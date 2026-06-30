import sqlite3
from backend.database import get_db


class PlataformaModel:
    """Modelo para gestionar las plataformas de cuentas a dominio"""

    @classmethod
    def create(cls, nombre, precio, icono='fas fa-tv', color='#3b82f6'):
        """Crear una nueva plataforma"""
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO plataformas (nombre, precio, icono, color, activo)
                VALUES (?, ?, ?, ?, 1)
            ''', (nombre, precio, icono, color))
            conn.commit()
            id = cursor.lastrowid
            conn.close()
            return {
                'id': id,
                'nombre': nombre,
                'precio': precio,
                'icono': icono,
                'color': color,
                'activo': 1
            }
        except sqlite3.IntegrityError:
            conn.close()
            return None  # Nombre duplicado

    @classmethod
    def get_all(cls, solo_activas=True):
        """Obtener todas las plataformas"""
        conn = get_db()
        cursor = conn.cursor()
        if solo_activas:
            cursor.execute('SELECT * FROM plataformas WHERE activo = 1 ORDER BY nombre')
        else:
            cursor.execute('SELECT * FROM plataformas ORDER BY nombre')
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def get_by_id(cls, id):
        """Obtener una plataforma por su ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM plataformas WHERE id = ?', (id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def update(cls, id, **kwargs):
        """Actualizar una plataforma"""
        conn = get_db()
        cursor = conn.cursor()
        campos = []
        valores = []
        for key, value in kwargs.items():
            if key in ['nombre', 'precio', 'icono', 'color', 'activo']:
                campos.append(f"{key} = ?")
                valores.append(value)
        if not campos:
            conn.close()
            return False
        valores.append(id)
        query = f"UPDATE plataformas SET {', '.join(campos)} WHERE id = ?"
        cursor.execute(query, valores)
        conn.commit()
        afectados = cursor.rowcount
        conn.close()
        return afectados > 0

    @classmethod
    def delete(cls, id):
        """Eliminar una plataforma"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM plataformas WHERE id = ?', (id,))
        conn.commit()
        afectados = cursor.rowcount
        conn.close()
        return afectados > 0