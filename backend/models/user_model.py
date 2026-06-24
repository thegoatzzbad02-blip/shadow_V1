import sqlite3
from backend.database import get_db
from werkzeug.security import generate_password_hash, check_password_hash

class UserModel:
    @classmethod
    def find_by_username(cls, username):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def find_by_id(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def check_password(cls, username, password):
        """Verifica las credenciales y devuelve el usuario si son correctas."""
        user = cls.find_by_username(username)
        if user and check_password_hash(user['password'], password):
            return user
        return None

    @classmethod
    def create_user(cls, username, password, role='user', credits=0):
        """Crea un nuevo usuario con contraseña hasheada."""
        conn = get_db()
        cursor = conn.cursor()
        hashed = generate_password_hash(password)
        try:
            cursor.execute(
                "INSERT INTO users (username, password, role, credits) VALUES (?, ?, ?, ?)",
                (username, hashed, role, credits)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return {
                'id': user_id,
                'username': username,
                'role': role,
                'credits': credits
            }
        except sqlite3.IntegrityError:
            conn.close()
            return None  # Usuario duplicado

    @classmethod
    def update_credits(cls, user_id, new_credits):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (new_credits, user_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def update_user(cls, user_id, new_username, new_credits):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET username = ?, credits = ? WHERE id = ?", (new_username, new_credits, user_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def delete_user(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def get_all_users(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role, credits FROM users")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]