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
            category TEXT DEFAULT 'otros',
            description TEXT DEFAULT '',
            codes TEXT
        )
    ''')

    # Tabla de vouchers (códigos promocionales)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            amount INTEGER NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT,
            created_by INTEGER
        )
    ''')

    # Tabla de solicitudes (cuentas a dominio)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS solicitudes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            plataforma TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT,
            mensaje TEXT,
            estado TEXT DEFAULT 'pending',
            creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
            completado_en TEXT
        )
    ''')

    # Historial de compras
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS purchase_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            code TEXT NOT NULL,
            purchased_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 👇 NUEVA TABLA: Plataformas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS plataformas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            precio INTEGER NOT NULL,
            icono TEXT DEFAULT 'fas fa-tv',
            color TEXT DEFAULT '#3b82f6',
            activo INTEGER DEFAULT 1
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

    # Plataformas por defecto para cuentas a dominio
    cursor.execute("SELECT id FROM plataformas")
    if not cursor.fetchone():
        default_platforms = [
            ('Netflix', 15, 'fab fa-netflix', '#e50914'),
            ('Disney+', 18, 'fab fa-disney', '#0063e5'),
            ('HBO Max', 20, 'fas fa-video', '#9b4dff')
        ]
        cursor.executemany(
            "INSERT INTO plataformas (nombre, precio, icono, color, activo) VALUES (?, ?, ?, ?, 1)",
            default_platforms
        )
        print("✅ Plataformas por defecto creadas")

    conn.commit()
    conn.close()
    print("✅ Base de datos SQLite inicializada con todas las tablas.")

if __name__ == '__main__':
    init_db()