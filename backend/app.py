import sys
import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from backend.database import init_db

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')

# Inicializar base de datos SQLite
init_db()

# Manejador global de errores
@app.errorhandler(Exception)
def handle_error(e):
    import traceback
    print("Error interno:", traceback.format_exc())
    return jsonify({'message': 'Error interno del servidor'}), 500

# Ruta de depuración
@app.route('/debug/env')
def debug_env():
    return jsonify({
        'SECRET_KEY': '****' if app.config.get('SECRET_KEY') else 'no configurada',
        'DB_PATH': os.path.join(os.path.dirname(__file__), '..', 'instance', 'shadow.db')
    })

# Blueprints
from backend.routes.auth_routes import auth_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

# Servir frontend
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return "Not found", 404
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        if os.path.isfile(file_path + '.html'):
            return send_from_directory(app.static_folder, path + '.html')
        return "Not found", 404

if __name__ == '__main__':
    app.run(debug=True)