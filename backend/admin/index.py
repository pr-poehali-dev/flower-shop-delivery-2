"""
Панель администратора: заказы, товары, аналитика.
Все запросы: POST / { action, password, ...payload }

Действия:
  login            — проверка пароля, возврат admin_token
  get_orders       — список заказов с фильтрами
  update_order     — изменение статуса заказа
  get_analytics    — статистика по заказам
  get_products     — список товаров
  create_product   — создать товар
  update_product   — редактировать товар
  delete_product   — удалить товар (мягко: in_stock=false)
  get_categories   — список категорий
  create_category  — создать категорию
"""

import json
import os
import hashlib
import hmac
import base64
import time
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "changeme")


# ── JWT для admin_token ───────────────────────────────────

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def admin_jwt_encode() -> str:
    header  = _b64url(b'{"alg":"HS256","typ":"JWT"}')
    payload = _b64url(json.dumps({"role": "admin", "exp": int(time.time()) + 3600 * 12}).encode())
    sig     = _b64url(hmac.new((JWT_SECRET + "_admin").encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def admin_jwt_verify(token: str) -> bool:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False
        header, payload, sig = parts
        expected = _b64url(hmac.new((JWT_SECRET + "_admin").encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return False
        data = json.loads(_b64url_decode(payload))
        return data.get("role") == "admin" and data.get("exp", 0) > time.time()
    except Exception:
        return False


# ── Helpers ──────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(message: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": message}, ensure_ascii=False)}

def require_admin(body: dict) -> bool:
    return admin_jwt_verify((body.get("admin_token") or "").strip())


# ── HANDLER ──────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400"}, "body": ""}

    if event.get("httpMethod") != "POST":
        return err("Используйте POST", 405)

    body   = json.loads(event.get("body") or "{}")
    action = (body.get("action") or "").strip()

    # ── login ─────────────────────────────────────────────
    if action == "login":
        password = (body.get("password") or "").strip()
        if not ADMIN_PASSWORD:
            return err("Пароль администратора не настроен", 500)
        if not hmac.compare_digest(password, ADMIN_PASSWORD):
            return err("Неверный пароль", 401)
        return ok({"admin_token": admin_jwt_encode()})

    # Все остальные действия требуют admin_token
    if not require_admin(body):
        return err("Требуется авторизация администратора", 401)

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── get_orders ────────────────────────────────────
        if action == "get_orders":
            status_filter = body.get("status")
            date_from     = body.get("date_from")
            date_to       = body.get("date_to")
            limit         = min(int(body.get("limit", 50)), 200)
            offset        = int(body.get("offset", 0))

            where, params = ["1=1"], []
            if status_filter:
                where.append("o.status = %s"); params.append(status_filter)
            if date_from:
                where.append("o.created_at >= %s"); params.append(date_from)
            if date_to:
                where.append("o.created_at <= %s"); params.append(date_to + " 23:59:59")

            where_sql = " AND ".join(where)
            cur.execute(f"""
                SELECT o.id, o.status, o.total_price, o.delivery_address, o.delivery_date,
                       o.recipient_name, o.recipient_phone, o.note, o.created_at,
                       c.name as customer_name, c.phone as customer_phone
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.customers c ON c.id = o.customer_id
                WHERE {where_sql}
                ORDER BY o.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders o WHERE {where_sql}", params)
            total = cur.fetchone()[0]

            orders = []
            for o in rows:
                cur.execute(f"SELECT name, price, quantity FROM {SCHEMA}.order_items WHERE order_id = %s", (o[0],))
                items = [{"name": r[0], "price": float(r[1]), "quantity": r[2]} for r in cur.fetchall()]
                orders.append({
                    "id": o[0], "status": o[1], "total_price": float(o[2]),
                    "delivery_address": o[3], "delivery_date": str(o[4]) if o[4] else None,
                    "recipient_name": o[5], "recipient_phone": o[6], "note": o[7],
                    "created_at": str(o[8]),
                    "customer_name": o[9], "customer_phone": o[10],
                    "items": items,
                })
            return ok({"orders": orders, "total": total})

        # ── update_order ──────────────────────────────────
        if action == "update_order":
            order_id = body.get("order_id")
            if not order_id:
                return err("Укажите order_id")
            allowed = {"new", "confirmed", "delivering", "done", "cancelled"}
            new_status = body.get("status")
            update_fields, vals = [], []
            if new_status:
                if new_status not in allowed:
                    return err(f"Недопустимый статус. Допустимые: {', '.join(allowed)}")
                update_fields.append("status = %s"); vals.append(new_status)
            for field in ("delivery_address", "delivery_date", "recipient_name", "recipient_phone", "note"):
                if field in body:
                    update_fields.append(f"{field} = %s"); vals.append(body[field] or None)
            if not update_fields:
                return err("Нечего обновлять")
            update_fields.append("updated_at = NOW()")
            vals.append(order_id)
            cur.execute(f"UPDATE {SCHEMA}.orders SET {', '.join(update_fields)} WHERE id = %s RETURNING id, status", vals)
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err("Заказ не найден", 404)
            return ok({"id": row[0], "status": row[1]})

        # ── get_analytics ─────────────────────────────────
        if action == "get_analytics":
            period = body.get("period", "30")  # дней

            cur.execute(f"""
                SELECT
                    COUNT(*) as total_orders,
                    COALESCE(SUM(total_price), 0) as total_revenue,
                    COALESCE(AVG(total_price), 0) as avg_order,
                    COUNT(*) FILTER (WHERE status = 'done') as done_orders,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
                    COUNT(*) FILTER (WHERE status = 'new') as new_orders
                FROM {SCHEMA}.orders
                WHERE created_at >= NOW() - INTERVAL '{period} days'
            """)
            row = cur.fetchone()
            summary = {
                "total_orders": row[0], "total_revenue": float(row[1]),
                "avg_order": round(float(row[2]), 2),
                "done_orders": row[3], "cancelled_orders": row[4], "new_orders": row[5],
            }

            # Заказы по дням
            cur.execute(f"""
                SELECT DATE(created_at) as day, COUNT(*) as cnt, COALESCE(SUM(total_price), 0) as revenue
                FROM {SCHEMA}.orders
                WHERE created_at >= NOW() - INTERVAL '{period} days'
                GROUP BY day ORDER BY day
            """)
            by_day = [{"date": str(r[0]), "orders": r[1], "revenue": float(r[2])} for r in cur.fetchall()]

            # Топ товаров
            cur.execute(f"""
                SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.price * oi.quantity) as total_sum
                FROM {SCHEMA}.order_items oi
                JOIN {SCHEMA}.orders o ON o.id = oi.order_id
                WHERE o.created_at >= NOW() - INTERVAL '{period} days'
                GROUP BY oi.name ORDER BY total_qty DESC LIMIT 10
            """)
            top_items = [{"name": r[0], "quantity": int(r[1]), "revenue": float(r[2])} for r in cur.fetchall()]

            # Статусы
            cur.execute(f"""
                SELECT status, COUNT(*) FROM {SCHEMA}.orders
                WHERE created_at >= NOW() - INTERVAL '{period} days'
                GROUP BY status
            """)
            by_status = {r[0]: r[1] for r in cur.fetchall()}

            return ok({"summary": summary, "by_day": by_day, "top_items": top_items, "by_status": by_status})

        # ── get_products ──────────────────────────────────
        if action == "get_products":
            cur.execute(f"""
                SELECT p.id, p.name, p.slug, p.description, p.composition, p.price, p.old_price,
                       p.image_url, p.tag, p.in_stock, p.sort_order, p.created_at,
                       c.name as category_name, p.category_id
                FROM {SCHEMA}.products p
                LEFT JOIN {SCHEMA}.categories c ON c.id = p.category_id
                ORDER BY p.sort_order, p.id
            """)
            products = [{"id": r[0], "name": r[1], "slug": r[2], "description": r[3], "composition": r[4],
                         "price": float(r[5]), "old_price": float(r[6]) if r[6] else None,
                         "image_url": r[7], "tag": r[8], "in_stock": r[9], "sort_order": r[10],
                         "created_at": str(r[11]), "category_name": r[12], "category_id": r[13]}
                        for r in cur.fetchall()]
            return ok({"products": products})

        # ── create_product ────────────────────────────────
        if action == "create_product":
            name = (body.get("name") or "").strip()
            if not name:
                return err("Укажите название товара")
            price = float(body.get("price", 0))
            if price <= 0:
                return err("Укажите корректную цену")
            slug = name.lower().replace(" ", "-").replace("ё", "е")
            # Уникальность slug
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.products WHERE slug LIKE %s", (slug + "%",))
            cnt = cur.fetchone()[0]
            if cnt > 0:
                slug = f"{slug}-{cnt}"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.products
                    (name, slug, description, composition, price, old_price, image_url, tag, in_stock, sort_order, category_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (name, slug, body.get("description"), body.get("composition"),
                  price, body.get("old_price") or None, body.get("image_url"),
                  body.get("tag"), body.get("in_stock", True),
                  int(body.get("sort_order", 0)), body.get("category_id") or None))
            product_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": product_id, "slug": slug}, 201)

        # ── update_product ────────────────────────────────
        if action == "update_product":
            product_id = body.get("product_id")
            if not product_id:
                return err("Укажите product_id")
            fields_map = {"name": str, "description": str, "composition": str,
                          "price": float, "old_price": float, "image_url": str,
                          "tag": str, "in_stock": bool, "sort_order": int, "category_id": int}
            update_fields, vals = [], []
            for field, cast in fields_map.items():
                if field in body:
                    val = body[field]
                    update_fields.append(f"{field} = %s")
                    vals.append(cast(val) if val is not None else None)
            if not update_fields:
                return err("Нечего обновлять")
            update_fields.append("updated_at = NOW()")
            vals.append(product_id)
            cur.execute(f"UPDATE {SCHEMA}.products SET {', '.join(update_fields)} WHERE id = %s RETURNING id", vals)
            if not cur.fetchone():
                return err("Товар не найден", 404)
            conn.commit()
            return ok({"updated": True})

        # ── delete_product ────────────────────────────────
        if action == "delete_product":
            product_id = body.get("product_id")
            if not product_id:
                return err("Укажите product_id")
            cur.execute(f"UPDATE {SCHEMA}.products SET in_stock = FALSE, updated_at = NOW() WHERE id = %s RETURNING id", (product_id,))
            if not cur.fetchone():
                return err("Товар не найден", 404)
            conn.commit()
            return ok({"deleted": True})

        # ── get_categories ────────────────────────────────
        if action == "get_categories":
            cur.execute(f"SELECT id, name, slug, sort_order FROM {SCHEMA}.categories ORDER BY sort_order, id")
            cats = [{"id": r[0], "name": r[1], "slug": r[2], "sort_order": r[3]} for r in cur.fetchall()]
            return ok({"categories": cats})

        # ── create_category ───────────────────────────────
        if action == "create_category":
            name = (body.get("name") or "").strip()
            if not name:
                return err("Укажите название категории")
            slug = name.lower().replace(" ", "-")
            cur.execute(f"INSERT INTO {SCHEMA}.categories (name, slug, sort_order) VALUES (%s,%s,%s) RETURNING id",
                        (name, slug, int(body.get("sort_order", 0))))
            cat_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": cat_id}, 201)

        return err("Неизвестное действие", 400)

    finally:
        cur.close()
        conn.close()
