"""
Регистрация и вход покупателя в личный кабинет.
POST / { action: "register", phone, password, name? }
POST / { action: "login",    phone, password }
POST / { action: "me",       token }
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


# ── JWT (HS256 без сторонних библиотек) ──────────────────

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def jwt_encode(payload: dict) -> str:
    header = _b64url(b'{"alg":"HS256","typ":"JWT"}')
    body   = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    sig    = _b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def jwt_decode(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Неверный формат токена")
    header, body, sig = parts
    expected = _b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        raise ValueError("Подпись токена недействительна")
    payload = json.loads(_b64url_decode(body))
    if payload.get("exp", 0) < time.time():
        raise ValueError("Токен истёк")
    return payload


# ── Пароль ───────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed)


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


# ── HANDLER ──────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    if event.get("httpMethod") != "POST":
        return err("Используйте POST", 405)

    body   = json.loads(event.get("body") or "{}")
    action = (body.get("action") or "").strip()

    # ── register ─────────────────────────────────────────
    if action == "register":
        phone    = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()
        name     = (body.get("name") or "").strip() or None

        if not phone or not password:
            return err("Укажите телефон и пароль")
        if len(password) < 6:
            return err("Пароль должен быть не менее 6 символов")

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.customers WHERE phone = %s", (phone,))
        if cur.fetchone():
            cur.close(); conn.close()
            return err("Покупатель с таким телефоном уже зарегистрирован")

        cur.execute(
            f"INSERT INTO {SCHEMA}.customers (phone, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
            (phone, hash_password(password), name),
        )
        customer_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()

        token = jwt_encode({"sub": customer_id, "exp": int(time.time()) + 60 * 60 * 24 * 30})
        return ok({"token": token, "customer": {"id": customer_id, "phone": phone, "name": name}}, 201)

    # ── login ─────────────────────────────────────────────
    if action == "login":
        phone    = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()

        if not phone or not password:
            return err("Укажите телефон и пароль")

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            f"SELECT id, password_hash, name, email FROM {SCHEMA}.customers WHERE phone = %s",
            (phone,),
        )
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row or not check_password(password, row[1]):
            return err("Неверный телефон или пароль", 401)

        customer_id, _, name, email = row
        token = jwt_encode({"sub": customer_id, "exp": int(time.time()) + 60 * 60 * 24 * 30})
        return ok({"token": token, "customer": {"id": customer_id, "phone": phone, "name": name, "email": email}})

    # ── me ────────────────────────────────────────────────
    if action == "me":
        token = (body.get("token") or "").strip()
        if not token:
            return err("Токен не передан", 401)

        try:
            payload = jwt_decode(token)
        except ValueError as e:
            return err(str(e), 401)

        customer_id = payload["sub"]
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            f"SELECT id, name, phone, email, birth_date, created_at FROM {SCHEMA}.customers WHERE id = %s",
            (customer_id,),
        )
        row = cur.fetchone()

        addresses = []
        if row:
            cur.execute(
                f"SELECT id, label, address, is_default FROM {SCHEMA}.customer_addresses WHERE customer_id = %s ORDER BY is_default DESC",
                (customer_id,),
            )
            addresses = [{"id": r[0], "label": r[1], "address": r[2], "is_default": r[3]} for r in cur.fetchall()]

        cur.close(); conn.close()

        if not row:
            return err("Пользователь не найден", 404)

        return ok({
            "id":         row[0],
            "name":       row[1],
            "phone":      row[2],
            "email":      row[3],
            "birth_date": str(row[4]) if row[4] else None,
            "created_at": str(row[5]),
            "addresses":  addresses,
        })

    return err("Неизвестное действие. Используйте: register, login, me", 400)
