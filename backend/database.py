import sqlite3
import os
from werkzeug.security import generate_password_hash

# Ruta de la base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'instance', 'shadow.db')

def get_db():
    """Devuelve una conexión a SQLite con row_factory para acceder por nombre."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crea las tablas y agrega usuario admin por defecto si no existe."""
    conn = get_db()
    cursor = conn.cursor()

    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            credits INTEGER DEFAULT 0
        )
    ''')

    # Tabla de productos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            stock INTEGER NOT NULL,
            codes TEXT
        )
    ''')

    # Crear admin por defecto
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        hashed = generate_password_hash('admin123')
        cursor.execute(
            "INSERT INTO users (username, password, role, credits) VALUES (?, ?, ?, ?)",
            ('admin', hashed, 'admin', 0)
        )
        print("✅ Usuario admin creado (admin/admin123)")

    conn.commit()
    conn.close()
    print("✅ Base de datos SQLite inicializada.")