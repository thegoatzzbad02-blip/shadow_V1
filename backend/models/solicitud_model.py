import sqlite3
from datetime import datetime
from backend.database import get_db

class SolicitudModel:
    @classmethod
    def create(cls, usuario_id, username, plataforma, email, password=None, mensaje=None):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO solicitudes (usuario_id, username, plataforma, email, password, mensaje, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ''', (usuario_id, username, plataforma, email, password, mensaje))
        conn.commit()
        solicitud_id = cursor.lastrowid
        conn.close()
        return cls.get_by_id(solicitud_id)

    @classmethod
    def get_by_id(cls, solicitud_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM solicitudes WHERE id = ?", (solicitud_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def get_all(cls, estado=None):
        conn = get_db()
        cursor = conn.cursor()
        if estado:
            cursor.execute("SELECT * FROM solicitudes WHERE estado = ? ORDER BY creado_en DESC", (estado,))
        else:
            cursor.execute("SELECT * FROM solicitudes ORDER BY creado_en DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def get_by_user(cls, usuario_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM solicitudes WHERE usuario_id = ? ORDER BY creado_en DESC", (usuario_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def update_status(cls, solicitud_id, estado):
        conn = get_db()
        cursor = conn.cursor()
        completado_en = datetime.now().isoformat() if estado == 'completed' else None
        cursor.execute('''
            UPDATE solicitudes 
            SET estado = ?, completado_en = ? 
            WHERE id = ?
        ''', (estado, completado_en, solicitud_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def delete(cls, solicitud_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM solicitudes WHERE id = ?", (solicitud_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def count_by_status(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN estado = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN estado = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM solicitudes
        """)
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else {'total': 0, 'pending': 0, 'completed': 0, 'cancelled': 0}