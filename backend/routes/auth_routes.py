from flask import Blueprint, request, jsonify
from backend.models.user_model import UserModel
from backend.utils.auth import check_password, generate_token
import traceback

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = UserModel.find_by_username(username)
        if not user:
            return jsonify({'message': 'Credenciales inválidas'}), 401

        if not check_password(user['password'], password):
            return jsonify({'message': 'Credenciales inválidas'}), 401

        token = generate_token(user['id'], user['role'])
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'credits': user['credits'],
            'token': token
        }), 200
    except Exception as e:
        print("Error en login:", traceback.format_exc())
        return jsonify({'message': 'Error interno', 'error': str(e)}), 500