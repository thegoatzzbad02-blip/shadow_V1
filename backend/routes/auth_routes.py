from flask import Blueprint, request, jsonify
from backend.models.user_model import UserModel
from backend.utils.auth import check_password, generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = UserModel.find_by_username(username)
    if not user or not check_password(user['password'], password):
        return jsonify({'message': 'Credenciales inválidas'}), 401

    token = generate_token(user['id'], user['role'])
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'credits': user['credits'],
        'token': token
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')
    credits = data.get('credits', 0)

    if UserModel.find_by_username(username):
        return jsonify({'message': 'El usuario ya existe'}), 400

    user = UserModel.create_user(username, password, role, credits)
    token = generate_token(user['id'], user['role'])
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'credits': user['credits'],
        'token': token
    }), 201
