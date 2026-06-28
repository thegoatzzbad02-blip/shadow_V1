import sys
import os
from flask import Flask, send_from_directory, jsonify, abort
from flask_cors import CORS
from dotenv import load_dotenv
from backend.database import init_db

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = '/workspaces/shadow_V1/frontend'  # RUTA ABSOLUTA

print(f"[INFO] Sirviendo frontend desde: {FRONTEND_DIR}")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')
init_db()

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

from backend.routes.auth_routes import auth_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        abort(404)
    return send_from_directory(FRONTEND_DIR, path)

@app.route('/favicon.ico')
def favicon():
    try:
        return send_from_directory(FRONTEND_DIR, 'favicon.ico')
    except Exception:
        return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)