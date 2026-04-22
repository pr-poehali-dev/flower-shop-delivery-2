"""
Личный кабинет покупателя: профиль и история заказов.
POST / { action: "get_profile", token }           — профиль + адреса
POST / { action: "get_orders",  token }           — история заказов
POST / { action: "update_profile", token, name?, email?, birth_date? }
"""

import json
import os
import hashlib
import hmac
import base64
import time
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
JWT_SECRET = os.environ["JWT_SECRET"]


# ── JWT ───────────────────────────────────────────────────

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def jwt_decode(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Неверный формат токена")
    header, body, sig = parts
    expected = base64.urlsafe_b64encode(
        hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    if not hmac.compare_digest(sig, expected):
        raise ValueError("Подпись токена недействительна")
    payload = json.loads(_b64url_decode(body))
    if payload.get("exp", 0) < time.time():
        raise ValueError("Токен истёк, войдите снова")
    return payload


# ── Helpers ──────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }

def err(message: str, status: int = 400) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"error": message}, ensure_ascii=False),
    }

def require_auth(body: dict):
    token = (body.get("token") or "").strip()
    if not token:
        raise PermissionError("Токен не передан")
    try:
        payload = jwt_decode(token)
    except ValueError as e:
        raise PermissionError(str(e))
    return payload["sub"]


# ── HANDLER ──────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    if event.get("httpMethod") != "POST":
        return err("Используйте POST", 405)

    body   = json.loads(event.get("body") or "{}")
    action = (body.get("action") or "").strip()

    try:
        customer_id = require_auth(body)
    except PermissionError as e:
        return err(str(e), 401)

    conn = get_conn()
    cur  = conn.cursor()

    # ── get_profile ───────────────────────────────────────
    if action == "get_profile":
        cur.execute(
            f"SELECT id, name, phone, email, birth_date, created_at FROM {SCHEMA}.customers WHERE id = %s",
            (customer_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err("Пользователь не найден", 404)

        cur.execute(
            f"SELECT id, label, address, is_default FROM {SCHEMA}.customer_addresses WHERE customer_id = %s ORDER BY is_default DESC, id ASC",
            (customer_id,)
        )
        addresses = [{"id": r[0], "label": r[1], "address": r[2], "is_default": r[3]} for r in cur.fetchall()]
        cur.close(); conn.close()

        return ok({
            "id":         row[0],
            "name":       row[1],
            "phone":      row[2],
            "email":      row[3],
            "birth_date": str(row[4]) if row[4] else None,
            "created_at": str(row[5]),
            "addresses":  addresses,
        })

    # ── update_profile ────────────────────────────────────
    if action == "update_profile":
        fields = []
        values = []
        for col in ("name", "email", "birth_date"):
            if col in body:
                fields.append(f"{col} = %s")
                values.append(body[col] or None)
        if not fields:
            cur.close(); conn.close()
            return err("Нечего обновлять")

        fields.append("updated_at = NOW()")
        values.append(customer_id)
        cur.execute(
            f"UPDATE {SCHEMA}.customers SET {', '.join(fields)} WHERE id = %s RETURNING id, name, phone, email, birth_date",
            values
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return ok({"id": row[0], "name": row[1], "phone": row[2], "email": row[3], "birth_date": str(row[4]) if row[4] else None})

    # ── get_orders ────────────────────────────────────────
    if action == "get_orders":
        cur.execute(
            f"""
            SELECT id, status, total_price, delivery_address, delivery_date,
                   recipient_name, recipient_phone, note, created_at
            FROM {SCHEMA}.orders
            WHERE customer_id = %s
            ORDER BY created_at DESC
            """,
            (customer_id,)
        )
        orders_rows = cur.fetchall()

        orders = []
        for o in orders_rows:
            order_id = o[0]
            cur.execute(
                f"SELECT name, price, quantity FROM {SCHEMA}.order_items WHERE order_id = %s",
                (order_id,)
            )
            items = [{"name": r[0], "price": float(r[1]), "quantity": r[2]} for r in cur.fetchall()]

            status_labels = {
                "new":        "Новый",
                "confirmed":  "Подтверждён",
                "delivering": "Доставляется",
                "done":       "Выполнен",
                "cancelled":  "Отменён",
            }
            orders.append({
                "id":               o[0],
                "status":           o[1],
                "status_label":     status_labels.get(o[1], o[1]),
                "total_price":      float(o[2]),
                "delivery_address": o[3],
                "delivery_date":    str(o[4]) if o[4] else None,
                "recipient_name":   o[5],
                "recipient_phone":  o[6],
                "note":             o[7],
                "created_at":       str(o[8]),
                "items":            items,
            })

        cur.close(); conn.close()
        return ok({"orders": orders})

    cur.close(); conn.close()
    return err("Неизвестное действие. Используйте: get_profile, update_profile, get_orders", 400)
