import sqlite3
from backend.database import get_db


class PurchaseModel:
    @classmethod
    def create_purchase(cls, user_id, product_id, product_name, price, code):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO purchase_history (user_id, product_id, product_name, price, code, purchased_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (user_id, product_id, product_name, price, code),
        )
        conn.commit()
        purchase_id = cursor.lastrowid
        conn.close()
        return {
            'id': purchase_id,
            'user_id': user_id,
            'product_id': product_id,
            'product_name': product_name,
            'price': price,
            'code': code,
        }

    @classmethod
    def get_by_user(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM purchase_history WHERE user_id = ? ORDER BY purchased_at DESC",
            (user_id,),
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
