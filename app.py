import sys
import os
from flask import Flask, send_from_directory, jsonify, abort
from flask_cors import CORS
from dotenv import load_dotenv
from backend.database import init_db

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

print(f"[INFO] Sirviendo desde: {FRONTEND_DIR}")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')

init_db()

# ===== MANEJADORES =====
@app.errorhandler(404)
def not_found(e):
    return jsonify({'message': 'Recurso no encontrado'}), 404

@app.errorhandler(Exception)
def handle_error(e):
    import traceback
    print("Error interno:", traceback.format_exc())
    return jsonify({'message': 'Error interno del servidor'}), 500

@app.route('/debug/env')
def debug_env():
    return jsonify({
        'FRONTEND_DIR': FRONTEND_DIR,
        'BASE_DIR': BASE_DIR
    })

# ===== BLUEPRINTS =====
from backend.routes.auth_routes import auth_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

# ===== SERVIR ARCHIVOS =====

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Si es una ruta de API, ignorar
    if path.startswith('api/'):
        abort(404)
    
    # Intentar servir el archivo directamente
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    
    # Si no existe, intentar con .html
    if os.path.isfile(file_path + '.html'):
        return send_from_directory(FRONTEND_DIR, path + '.html')
    
    # Si no, 404
    abort(404)

@app.route('/favicon.ico')
def favicon():
    try:
        return send_from_directory(FRONTEND_DIR, 'favicon.ico')
    except Exception:
        return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)