import sys
import os
import json
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

# Encoder personalizado para ObjectId
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.json_encoder = CustomJSONEncoder
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['MONGO_DBNAME'] = os.getenv('MONGO_DB_NAME', 'shadow_platform')

# Manejador global de errores
@app.errorhandler(Exception)
def handle_error(e):
    import traceback
    print("Error interno:", traceback.format_exc())
    return jsonify({'message': 'Error interno del servidor'}), 500

# Ruta de depuración
@app.route('/debug/env')
def debug_env():
    mongo_uri = app.config.get('MONGO_URI', 'no configurada')
    if mongo_uri and mongo_uri != 'no configurada' and '@' in mongo_uri:
        parts = mongo_uri.split('@')
        mongo_uri = 'mongodb+srv://****:****@' + parts[1]
    return jsonify({
        'SECRET_KEY': '****' if app.config.get('SECRET_KEY') else 'no configurada',
        'MONGO_URI': mongo_uri,
        'MONGO_DB_NAME': app.config.get('MONGO_DBNAME', 'no configurada')
    })

from backend.routes.auth_routes import auth_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

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