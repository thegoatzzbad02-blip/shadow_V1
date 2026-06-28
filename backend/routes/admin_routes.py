from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required, admin_required
from backend.models.user_model import UserModel
from backend.models.product_model import ProductModel
from backend.models.voucher_model import VoucherModel  # 👈 importar
import traceback

admin_bp = Blueprint('admin', __name__)

# ================== USUARIOS ==================

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users():
    try:
        users = UserModel.get_all_users()
        return jsonify(users), 200
    except Exception as e:
        print("Error en get_users:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener usuarios'}), 500

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        credits = data.get('credits', 0)

        if not username or not password:
            return jsonify({'message': 'Faltan datos'}), 400

        if UserModel.find_by_username(username):
            return jsonify({'message': 'El usuario ya existe'}), 400

        user = UserModel.create_user(username, password, 'user', credits)
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'credits': user['credits']
        }), 201
    except Exception as e:
        print("Error en create_user:", traceback.format_exc())
        return jsonify({'message': 'Error interno al crear usuario'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(user_id):
    try:
        data = request.get_json()
        username = data.get('username')
        credits = data.get('credits')
        if username is None or credits is None:
            return jsonify({'message': 'Faltan datos'}), 400

        if UserModel.update_user(user_id, username, credits):
            return jsonify({'message': 'Usuario actualizado'}), 200
        return jsonify({'message': 'Usuario no encontrado'}), 404
    except Exception as e:
        print("Error en update_user:", traceback.format_exc())
        return jsonify({'message': 'Error interno al actualizar usuario'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    try:
        if UserModel.delete_user(user_id):
            return jsonify({'message': 'Usuario eliminado'}), 200
        return jsonify({'message': 'Usuario no encontrado'}), 404
    except Exception as e:
        print("Error en delete_user:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar usuario'}), 500

# ================== PRODUCTOS ==================

@admin_bp.route('/products', methods=['GET'])
@token_required
@admin_required
def get_products():
    try:
        products = ProductModel.get_all_products()
        return jsonify(products), 200
    except Exception as e:
        print("Error en get_products:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener productos'}), 500

@admin_bp.route('/products', methods=['POST'])
@token_required
@admin_required
def create_product():
    try:
        data = request.get_json()
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock')
        category = data.get('category', 'otros')
        description = data.get('description', '')
        codes = data.get('codes', [])

        if not name or price is None or stock is None:
            return jsonify({'message': 'Faltan datos del producto'}), 400

        product = ProductModel.create_product(name, price, stock, category, description, codes)
        return jsonify(product), 201
    except Exception as e:
        print("Error en create_product:", traceback.format_exc())
        return jsonify({'message': 'Error interno al crear producto'}), 500

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(product_id):
    try:
        data = request.get_json()
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock')
        category = data.get('category')
        description = data.get('description')
        codes = data.get('codes')

        if not name or price is None or stock is None:
            return jsonify({'message': 'Faltan datos'}), 400

        updated = ProductModel.update_product(
            product_id,
            name,
            price,
            stock,
            category=category,
            description=description,
            codes=codes
        )
        if updated:
            return jsonify({'message': 'Producto actualizado'}), 200
        return jsonify({'message': 'Producto no encontrado'}), 404
    except Exception as e:
        print("Error en update_product:", traceback.format_exc())
        return jsonify({'message': 'Error interno al actualizar producto'}), 500

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(product_id):
    try:
        if ProductModel.delete_product(product_id):
            return jsonify({'message': 'Producto eliminado'}), 200
        return jsonify({'message': 'Producto no encontrado'}), 404
    except Exception as e:
        print("Error en delete_product:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar producto'}), 500

# ================== VOUCHERS (CÓDIGOS PROMOCIONALES) ==================

@admin_bp.route('/vouchers', methods=['GET'])
@token_required
@admin_required
def get_vouchers():
    try:
        vouchers = VoucherModel.get_all_vouchers()
        return jsonify(vouchers), 200
    except Exception as e:
        print("Error en get_vouchers:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener códigos'}), 500

@admin_bp.route('/vouchers', methods=['POST'])
@token_required
@admin_required
def create_voucher():
    try:
        data = request.get_json()
        amount = data.get('amount')
        expires_days = data.get('expires_days')  # opcional
        if not amount or amount <= 0:
            return jsonify({'message': 'El monto debe ser mayor a 0'}), 400
        voucher = VoucherModel.create_voucher(amount, expires_days, request.user['id'])
        if not voucher:
            return jsonify({'message': 'Error al generar el código'}), 500
        return jsonify(voucher), 201
    except Exception as e:
        print("Error en create_voucher:", traceback.format_exc())
        return jsonify({'message': 'Error interno al crear código'}), 500

@admin_bp.route('/vouchers/<int:voucher_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_voucher(voucher_id):
    try:
        if VoucherModel.delete_voucher(voucher_id):
            return jsonify({'message': 'Código eliminado'}), 200
        return jsonify({'message': 'Código no encontrado'}), 404
    except Exception as e:
        print("Error en delete_voucher:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar código'}), 500