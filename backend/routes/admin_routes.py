from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required, admin_required
from backend.models.user_model import UserModel
from backend.models.product_model import ProductModel

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users():
    users = UserModel.get_all_users()
    return jsonify(users), 200

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    credits = data.get('credits', 0)

    if UserModel.find_by_username(username):
        return jsonify({'message': 'El usuario ya existe'}), 400

    user = UserModel.create_user(username, password, 'user', credits)
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'credits': user['credits']
    }), 201

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(user_id):
    data = request.get_json()
    username = data.get('username')
    credits = data.get('credits')
    if username is None or credits is None:
        return jsonify({'message': 'Faltan datos'}), 400
    if UserModel.update_user(user_id, username, credits):
        return jsonify({'message': 'Usuario actualizado'}), 200
    return jsonify({'message': 'Usuario no encontrado'}), 404

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    if UserModel.delete_user(user_id):
        return jsonify({'message': 'Usuario eliminado'}), 200
    return jsonify({'message': 'Usuario no encontrado'}), 404

@admin_bp.route('/products', methods=['GET'])
@token_required
@admin_required
def get_products():
    products = ProductModel.get_all_products()
    return jsonify(products), 200

@admin_bp.route('/products', methods=['POST'])
@token_required
@admin_required
def create_product():
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    codes = data.get('codes', [])
    if not name or price is None or stock is None:
        return jsonify({'message': 'Faltan datos del producto'}), 400
    product = ProductModel.create_product(name, price, stock, codes)
    return jsonify(product), 201

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(product_id):
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    codes = data.get('codes')
    if not name or price is None or stock is None:
        return jsonify({'message': 'Faltan datos'}), 400
    if ProductModel.update_product(product_id, name, price, stock, codes):
        return jsonify({'message': 'Producto actualizado'}), 200
    return jsonify({'message': 'Producto no encontrado'}), 404

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(product_id):
    if ProductModel.delete_product(product_id):
        return jsonify({'message': 'Producto eliminado'}), 200
    return jsonify({'message': 'Producto no encontrado'}), 404
