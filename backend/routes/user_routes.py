from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required
from backend.models.product_model import ProductModel
from backend.models.user_model import UserModel

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@token_required
def profile():
    user = request.user
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'credits': user['credits'],
        'role': user['role']
    }), 200

@user_bp.route('/products', methods=['GET'])
@token_required
def get_products():
    products = ProductModel.get_available()
    safe_products = [{'id': p['id'], 'name': p['name'], 'price': p['price'], 'stock': p['stock']} for p in products]
    return jsonify(safe_products), 200

@user_bp.route('/buy/<int:product_id>', methods=['POST'])
@token_required
def buy_product(product_id):
    user = request.user
    product = ProductModel.get_by_id(product_id)

    if not product:
        return jsonify({'message': 'Producto no encontrado'}), 404
    if product['stock'] <= 0:
        return jsonify({'message': 'Producto sin stock'}), 400
    if user['credits'] < product['price']:
        return jsonify({'message': 'Créditos insuficientes'}), 400

    code = ProductModel.purchase(product_id)
    if not code:
        return jsonify({'message': 'Error al procesar la compra'}), 500

    new_credits = user['credits'] - product['price']
    UserModel.update_credits(user['id'], new_credits)

    return jsonify({
        'message': 'Compra exitosa',
        'code': code,
        'credits_remaining': new_credits
    }), 200
