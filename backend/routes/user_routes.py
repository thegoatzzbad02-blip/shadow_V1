from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required
from backend.models.product_model import ProductModel
from backend.models.user_model import UserModel
from backend.models.solicitud_model import SolicitudModel
from backend.models.plataforma_model import PlataformaModel
from backend.models.purchase_model import PurchaseModel
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

@user_bp.route('/plataformas', methods=['GET'])
@token_required
def get_plataformas_user():
    try:
        plataformas = PlataformaModel.get_all(solo_activas=True)
        return jsonify(plataformas), 200
    except Exception as e:
        print("Error en get_plataformas_user:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener plataformas'}), 500

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
    PurchaseModel.create_purchase(
        user_id=user['id'],
        product_id=product_id,
        product_name=product['name'],
        price=product['price'],
        code=code,
    )

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

        user = UserModel.find_by_id(request.user['id'])
        plataformas = PlataformaModel.get_all(solo_activas=True)
        selected_platform = next((item for item in plataformas if item['nombre'] == plataforma), None)

        if not selected_platform:
            return jsonify({'message': 'Plataforma no disponible'}), 400

        costo = int(selected_platform['precio'])
        if user['credits'] < costo:
            return jsonify({'message': f'No tienes créditos suficientes. Necesitas {costo} créditos.'}), 400

        nueva_creditos = int(user['credits']) - costo
        UserModel.update_credits(user['id'], nueva_creditos)

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
            'solicitud': solicitud,
            'credits_remaining': nueva_creditos,
            'price': costo
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

@user_bp.route('/historial', methods=['GET'])
@token_required
def historial_usuario():
    try:
        user = request.user
        compras = PurchaseModel.get_by_user(user['id'])
        solicitudes = SolicitudModel.get_by_user(user['id'])
        return jsonify({'compras': compras, 'solicitudes': solicitudes}), 200
    except Exception as e:
        print("Error en historial_usuario:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener historial'}), 500

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