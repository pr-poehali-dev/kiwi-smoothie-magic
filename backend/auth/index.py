"""
Авторизация пользователей: вход и проверка токена.
"""
import json
import os
import hashlib
import hmac
import secrets
import psycopg2


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p57925851_kiwi_smoothie_magic")
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def hash_password(password: str) -> str:
    salt = "eventpass_salt_2025"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    if method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Введите email и пароль"}),
            }

        password_hash = hash_password(password)

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, email FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
            (email, password_hash),
        )
        user = cur.fetchone()
        conn.close()

        if not user:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный email или пароль"}),
            }

        token = hashlib.sha256(f"{user[0]}{user[1]}{secrets.token_hex(8)}".encode()).hexdigest()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"token": token, "email": user[1], "user_id": user[0]}),
        }

    return {
        "statusCode": 404,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": "Not found"}),
    }