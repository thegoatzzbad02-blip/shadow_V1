from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required
from backend.models.product_model import ProductModel
from backend.models.user_model import UserModel
from backend.models.solicitud_model import SolicitudModel  # 👈 NUEVO
import traceback

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
    return jsonify(products), 200

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

# ================================================================
#  CUENTAS A DOMINIO - SOLICITUDES (USER)
# ================================================================

@user_bp.route('/solicitar-cuenta', methods=['POST'])
@token_required
def solicitar_cuenta():
    try:
        data = request.get_json()
        plataforma = data.get('plataforma')
        email = data.get('email')
        password = data.get('password')
        mensaje = data.get('mensaje', '')

        if not plataforma or not email:
            return jsonify({'message': 'Plataforma y correo son obligatorios'}), 400

        user = request.user

        solicitud = SolicitudModel.create(
            usuario_id=user['id'],
            username=user['username'],
            plataforma=plataforma,
            email=email,
            password=password,
            mensaje=mensaje
        )

        return jsonify({
            'message': 'Solicitud creada exitosamente',
            'solicitud': solicitud
        }), 201

    except Exception as e:
        print("Error en solicitar_cuenta:", traceback.format_exc())
        return jsonify({'message': 'Error interno al crear solicitud'}), 500

@user_bp.route('/mis-solicitudes', methods=['GET'])
@token_required
def mis_solicitudes():
    try:
        user = request.user
        solicitudes = SolicitudModel.get_by_user(user['id'])
        return jsonify(solicitudes), 200
    except Exception as e:
        print("Error en mis_solicitudes:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener solicitudes'}), 500

# ================================================================
#  CANJEAR CÓDIGO (REDEEM)
# ================================================================

@user_bp.route('/redeem', methods=['POST'])
@token_required
def redeem_voucher():
    try:
        from backend.models.voucher_model import VoucherModel
        data = request.get_json()
        code = data.get('code')
        if not code:
            return jsonify({'message': 'Falta el código'}), 400
        
        user = request.user
        result = VoucherModel.redeem_voucher(code, user['id'])
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        print("Error en redeem_voucher:", traceback.format_exc())
        return jsonify({'message': 'Error interno al canjear código'}), 500