from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required, admin_required
from backend.models.user_model import UserModel
from backend.models.product_model import ProductModel
import traceback

admin_bp = Blueprint('admin', __name__)

# ... (el resto de tus rutas, con try/except similar)

@admin_bp.route('/products', methods=['POST'])
@token_required
@admin_required
def create_product():
    try:
        data = request.get_json()
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock')
        codes = data.get('codes', [])
        if not name or price is None or stock is None:
            return jsonify({'message': 'Faltan datos del producto'}), 400
        product = ProductModel.create_product(name, price, stock, codes)
        return jsonify(product), 201
    except Exception as e:
        print("Error en create_product:", traceback.format_exc())
        return jsonify({'message': 'Error interno'}), 500

# Aplica el mismo patrón a todas las rutas (GET, PUT, DELETE)