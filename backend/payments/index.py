"""
Платежи: ЮKassa и Сбербанк.
POST / { action: "create_payment", provider, order_id, amount, return_url }
POST / { action: "check_payment",  provider, payment_id }
POST / { action: "get_settings" }
"""
import json
import os
import uuid
import time
import urllib.request
import urllib.parse
import base64
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def http_post(url, payload, headers):
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def yukassa_create(amount, order_id, return_url):
    shop_id = os.environ.get("YUKASSA_SHOP_ID", "")
    secret  = os.environ.get("YUKASSA_SECRET_KEY", "")
    if not shop_id or not secret:
        raise ValueError("ЮKassa не настроена. Добавьте YUKASSA_SHOP_ID и YUKASSA_SECRET_KEY.")
    creds = base64.b64encode(f"{shop_id}:{secret}".encode()).decode()
    payload = {
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": return_url},
        "capture": True,
        "description": f"Заказ №{order_id} — Флора",
        "metadata": {"order_id": str(order_id)},
    }
    headers = {"Authorization": f"Basic {creds}", "Idempotence-Key": str(uuid.uuid4())}
    res = http_post("https://api.yookassa.ru/v3/payments", payload, headers)
    return {"payment_id": res["id"], "payment_url": res["confirmation"]["confirmation_url"], "status": res["status"]}

def yukassa_check(payment_id):
    shop_id = os.environ.get("YUKASSA_SHOP_ID", "")
    secret  = os.environ.get("YUKASSA_SECRET_KEY", "")
    creds   = base64.b64encode(f"{shop_id}:{secret}".encode()).decode()
    req = urllib.request.Request(f"https://api.yookassa.ru/v3/payments/{payment_id}", headers={"Authorization": f"Basic {creds}"})
    with urllib.request.urlopen(req, timeout=10) as r:
        res = json.loads(r.read())
    return {"status": res["status"], "paid": res.get("paid", False)}

def sberbank_create(amount, order_id, return_url):
    username = os.environ.get("SBERBANK_USERNAME", "")
    password = os.environ.get("SBERBANK_PASSWORD", "")
    if not username or not password:
        raise ValueError("Сбербанк не настроен. Добавьте SBERBANK_USERNAME и SBERBANK_PASSWORD.")
    base_url = "https://securepayments.sberbank.ru/payment/rest"
    params = urllib.parse.urlencode({
        "userName": username, "password": password,
        "orderNumber": f"flora-{order_id}-{int(time.time())}",
        "amount": int(amount * 100),
        "returnUrl": return_url,
        "description": f"Заказ №{order_id} — Флора",
    })
    with urllib.request.urlopen(f"{base_url}/register.do?{params}", timeout=15) as r:
        res = json.loads(r.read())
    if res.get("errorCode") and res["errorCode"] != "0":
        raise ValueError(res.get("errorMessage", "Ошибка Сбербанк"))
    return {"payment_id": res["orderId"], "payment_url": res["formUrl"], "status": "pending"}

def sberbank_check(payment_id):
    username = os.environ.get("SBERBANK_USERNAME", "")
    password = os.environ.get("SBERBANK_PASSWORD", "")
    base_url = "https://securepayments.sberbank.ru/payment/rest"
    params = urllib.parse.urlencode({"userName": username, "password": password, "orderId": payment_id})
    with urllib.request.urlopen(f"{base_url}/getOrderStatusExtended.do?{params}", timeout=10) as r:
        res = json.loads(r.read())
    paid = res.get("orderStatus") == 2
    return {"status": "succeeded" if paid else "pending", "paid": paid}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400"}, "body": ""}

    if event.get("httpMethod") != "POST":
        return err("Используйте POST", 405)

    body   = json.loads(event.get("body") or "{}")
    action = (body.get("action") or "").strip()

    if action == "get_settings":
        return ok({
            "yukassa":  bool(os.environ.get("YUKASSA_SHOP_ID") and os.environ.get("YUKASSA_SECRET_KEY")),
            "sberbank": bool(os.environ.get("SBERBANK_USERNAME") and os.environ.get("SBERBANK_PASSWORD")),
        })

    if action == "create_payment":
        provider   = (body.get("provider") or "").strip()
        order_id   = body.get("order_id")
        amount     = float(body.get("amount", 0))
        return_url = (body.get("return_url") or "").strip()
        if not provider:   return err("Укажите provider")
        if not order_id:   return err("Укажите order_id")
        if amount <= 0:    return err("Некорректная сумма")
        if not return_url: return err("Укажите return_url")
        try:
            if provider == "yukassa":
                result = yukassa_create(amount, order_id, return_url)
            elif provider == "sberbank":
                result = sberbank_create(amount, order_id, return_url)
            else:
                return err("Неизвестный провайдер. Используйте: yukassa, sberbank")
        except ValueError as e:
            return err(str(e))
        except Exception as e:
            return err(f"Ошибка платёжной системы: {str(e)}", 502)
        try:
            conn = get_conn()
            cur  = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.orders SET note = COALESCE(note,'') || %s WHERE id = %s", (f" | pay:{result['payment_id']}", order_id))
            conn.commit(); cur.close(); conn.close()
        except Exception:
            pass
        return ok(result, 201)

    if action == "check_payment":
        provider   = (body.get("provider") or "").strip()
        payment_id = (body.get("payment_id") or "").strip()
        if not provider or not payment_id:
            return err("Укажите provider и payment_id")
        try:
            if provider == "yukassa":
                result = yukassa_check(payment_id)
            elif provider == "sberbank":
                result = sberbank_check(payment_id)
            else:
                return err("Неизвестный провайдер")
        except Exception as e:
            return err(str(e), 502)
        return ok(result)

    return err("Неизвестное действие: create_payment, check_payment, get_settings", 400)
