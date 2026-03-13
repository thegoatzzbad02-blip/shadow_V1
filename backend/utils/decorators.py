from functools import wraps
from flask import request, jsonify
from backend.utils.auth import verify_token
from backend.models.user_model import UserModel

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'message': 'Token requerido'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido o expirado'}), 401

        user = UserModel.find_by_id(payload['id'])
        if not user:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        request.user = user
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user['role'] != 'admin':
            return jsonify({'message': 'Acceso denegado, se requiere rol admin'}), 403
        return f(*args, **kwargs)
    return decorated
