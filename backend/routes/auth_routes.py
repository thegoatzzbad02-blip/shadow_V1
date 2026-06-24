from flask import Blueprint, request, jsonify
from backend.models.user_model import UserModel
from backend.utils.auth import generate_token
import traceback

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Faltan credenciales'}), 400

        user = UserModel.check_password(username, password)
        if not user:
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

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')          # opcional, se puede guardar luego
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not username or not password or not confirm_password:
            return jsonify({'message': 'Faltan datos obligatorios'}), 400

        if password != confirm_password:
            return jsonify({'message': 'Las contraseñas no coinciden'}), 400

        if len(password) < 6:
            return jsonify({'message': 'La contraseña debe tener al menos 6 caracteres'}), 400

        # Verificar si el usuario ya existe
        existing = UserModel.find_by_username(username)
        if existing:
            return jsonify({'message': 'El nombre de usuario ya está en uso'}), 400

        # Crear usuario (por defecto rol 'user', créditos 0)
        user = UserModel.create_user(username, password, role='user', credits=0)
        if not user:
            return jsonify({'message': 'Error al crear usuario'}), 500

        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'username': user['username']
        }), 201

    except Exception as e:
        print("Error en register:", traceback.format_exc())
        return jsonify({'message': 'Error interno del servidor'}), 500