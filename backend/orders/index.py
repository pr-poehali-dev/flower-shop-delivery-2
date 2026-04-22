"""
Создание заказа из конструктора букетов + уведомления в Telegram и Email.
POST / { action: "create_order", token?, items, green, wrapping, note, delivery_address, delivery_date, recipient_name, recipient_phone }
"""

import json
import os
import hashlib
import hmac
import base64
import time
import smtplib
import urllib.request
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
JWT_SECRET = os.environ["JWT_SECRET"]


# ── JWT (опциональная авторизация) ────────────────────────

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def jwt_decode(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("bad token")
    header, body, sig = parts
    expected = base64.urlsafe_b64encode(
        hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    if not hmac.compare_digest(sig, expected):
        raise ValueError("invalid signature")
    payload = json.loads(_b64url_decode(body))
    if payload.get("exp", 0) < time.time():
        raise ValueError("token expired")
    return payload


# ── Helpers ──────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict, status: int = 200) -> dict:
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


# ── Уведомления ──────────────────────────────────────────

def build_message(order_id, items, green, wrapping, note, delivery_address, delivery_date, recipient_name, recipient_phone, total_price):
    lines = [f"🌸 Новый заказ №{order_id}"]
    lines.append(f"💰 Сумма: {total_price:,.0f} ₽")
    lines.append("")
    lines.append("📦 Состав:")
    for item in items:
        lines.append(f"  • {item.get('name')} × {item.get('quantity')} — {float(item.get('price',0)) * int(item.get('quantity',1)):,.0f} ₽")
    if green:    lines.append(f"  🌿 Зелень: {green}")
    if wrapping: lines.append(f"  🎀 Упаковка: {wrapping}")
    if note:     lines.append(f"  💬 Пожелание: {note}")
    lines.append("")
    lines.append("🚚 Доставка:")
    lines.append(f"  Адрес: {delivery_address}")
    if delivery_date: lines.append(f"  Дата: {delivery_date}")
    if recipient_name:  lines.append(f"  Получатель: {recipient_name}")
    lines.append(f"  Телефон: {recipient_phone}")
    return "\n".join(lines)

def send_telegram(text: str):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id   = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not bot_token or not chat_id:
        return
    payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=8)
    except Exception:
        pass

def send_email(subject: str, text: str):
    smtp_user = os.environ.get("NOTIFY_EMAIL", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")
    if not smtp_user or not smtp_pass:
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Флора Заказы <{smtp_user}>"
    msg["To"]      = smtp_user
    msg.attach(MIMEText(text, "plain", "utf-8"))
    html_body = text.replace("\n", "<br>").replace("  ", "&nbsp;&nbsp;")
    msg.attach(MIMEText(f"<html><body style='font-family:sans-serif'>{html_body}</body></html>", "html", "utf-8"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=8) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, smtp_user, msg.as_string())
    except Exception:
        pass


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

    if action != "create_order":
        return err("Неизвестное действие. Используйте: create_order", 400)

    # ── Авторизация (опциональная) ────────────────────────
    customer_id = None
    token = (body.get("token") or "").strip()
    if token:
        try:
            payload = jwt_decode(token)
            customer_id = payload["sub"]
        except ValueError:
            pass

    # ── Валидация ─────────────────────────────────────────
    items = body.get("items", [])
    if not items:
        return err("Добавьте хотя бы один цветок")

    delivery_address = (body.get("delivery_address") or "").strip()
    recipient_name   = (body.get("recipient_name") or "").strip()
    recipient_phone  = (body.get("recipient_phone") or "").strip()

    if not delivery_address:
        return err("Укажите адрес доставки")
    if not recipient_phone:
        return err("Укажите телефон получателя")

    # ── Считаем сумму ─────────────────────────────────────
    total_price = sum(float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in items)
    if total_price <= 0:
        return err("Некорректная сумма заказа")

    # ── Составляем примечание ─────────────────────────────
    green    = (body.get("green") or "").strip()
    wrapping = (body.get("wrapping") or "").strip()
    note_parts = []
    if green:    note_parts.append(f"Зелень: {green}")
    if wrapping: note_parts.append(f"Упаковка: {wrapping}")
    user_note = (body.get("note") or "").strip()
    if user_note: note_parts.append(user_note)
    full_note = " | ".join(note_parts) or None

    delivery_date = body.get("delivery_date") or None

    # ── Сохраняем в БД ───────────────────────────────────
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.orders
            (customer_id, status, total_price, delivery_address, delivery_date,
             recipient_name, recipient_phone, note)
        VALUES (%s, 'new', %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (customer_id, total_price, delivery_address, delivery_date,
         recipient_name or None, recipient_phone, full_note)
    )
    order_id = cur.fetchone()[0]

    for item in items:
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.order_items (order_id, name, price, quantity)
            VALUES (%s, %s, %s, %s)
            """,
            (order_id, item.get("name", ""), float(item.get("price", 0)), int(item.get("quantity", 1)))
        )

    # Сохраняем адрес доставки для авторизованного покупателя
    if customer_id and delivery_address:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.customer_addresses WHERE customer_id = %s AND address = %s",
            (customer_id, delivery_address)
        )
        if not cur.fetchone():
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.customer_addresses (customer_id, address, is_default)
                VALUES (%s, %s, (SELECT COUNT(*) = 0 FROM {SCHEMA}.customer_addresses WHERE customer_id = %s))
                """,
                (customer_id, delivery_address, customer_id)
            )

    conn.commit()
    cur.close()
    conn.close()

    # ── Отправляем уведомления (не блокируют ответ) ───────
    message = build_message(
        order_id, items, green, wrapping, user_note,
        delivery_address, delivery_date, recipient_name, recipient_phone, total_price
    )
    send_telegram(message)
    send_email(f"🌸 Новый заказ №{order_id} на {total_price:,.0f} ₽", message)

    return ok({
        "order_id":    order_id,
        "total_price": total_price,
        "status":      "new",
        "message":     "Заказ успешно оформлен! Мы свяжемся с вами для подтверждения.",
    }, 201)
