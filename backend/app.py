import sys
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Añadir el directorio actual al path de Python para que encuentre los módulos locales
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

# Rutas absolutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

# Importar blueprints (ahora funcionan gracias al sys.path)
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

# Ruta para la raíz (sirve index.html)
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Ruta para servir archivos estáticos y otras páginas HTML
@app.route('/<path:path>')
def serve_static(path):
    # Evitar que interfiera con rutas de API
    if path.startswith('api/'):
        return "Not found", 404
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        # Si no es un archivo, intentar con .html (para admin.html, user.html)
        if os.path.isfile(file_path + '.html'):
            return send_from_directory(app.static_folder, path + '.html')
        return "Not found", 404

# Solo para desarrollo local
if __name__ == '__main__':
    app.run(debug=True)