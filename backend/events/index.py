"""
CRUD для мероприятий: получение списка и создание (только для админа).
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p57925851_kiwi_smoothie_magic")
ADMIN_EMAIL = "maksimmmmmm12@gmail.com"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Email",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status, data, headers=None):
    h = {**CORS, **(headers or {})}
    return {"statusCode": status, "headers": h, "body": json.dumps(data, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    user_email = headers.get("X-User-Email", "")

    # GET — список мероприятий (для всех авторизованных)
    if method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, title, description, event_date, location, max_participants, created_at "
            f"FROM {SCHEMA}.events ORDER BY event_date ASC NULLS LAST"
        )
        rows = cur.fetchall()
        conn.close()
        events = [
            {
                "id": r[0], "title": r[1], "description": r[2],
                "event_date": r[3], "location": r[4],
                "max_participants": r[5], "created_at": r[6],
            }
            for r in rows
        ]
        return resp(200, {"events": events})

    # POST — создать мероприятие (только админ)
    if method == "POST":
        if user_email.lower() != ADMIN_EMAIL:
            return resp(403, {"error": "Нет доступа"})

        body = json.loads(event.get("body") or "{}")
        title = body.get("title", "").strip()
        if not title:
            return resp(400, {"error": "Название обязательно"})

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.events (title, description, event_date, location, max_participants) "
            f"VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (
                title,
                body.get("description", ""),
                body.get("event_date") or None,
                body.get("location", ""),
                body.get("max_participants") or None,
            ),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return resp(201, {"id": new_id, "message": "Мероприятие создано"})

    # DELETE — удалить мероприятие (только админ)
    if method == "DELETE":
        if user_email.lower() != ADMIN_EMAIL:
            return resp(403, {"error": "Нет доступа"})

        body = json.loads(event.get("body") or "{}")
        event_id = body.get("id")
        if not event_id:
            return resp(400, {"error": "Укажите id"})

        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.events WHERE id = %s", (event_id,))
        conn.commit()
        conn.close()
        return resp(200, {"message": "Удалено"})

    return resp(404, {"error": "Not found"})
