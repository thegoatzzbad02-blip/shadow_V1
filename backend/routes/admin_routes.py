from flask import Blueprint, request, jsonify
from backend.utils.decorators import token_required, admin_required
from backend.models.user_model import UserModel
from backend.models.product_model import ProductModel
from backend.models.voucher_model import VoucherModel
from backend.models.solicitud_model import SolicitudModel
from backend.models.plataforma_model import PlataformaModel  # 👈 NUEVO
import traceback

admin_bp = Blueprint('admin', __name__)


# ================== USUARIOS ==================

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users():
    """Obtener todos los usuarios"""
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
    """Crear un nuevo usuario (solo admin)"""
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
    """Actualizar un usuario existente"""
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
    """Eliminar un usuario"""
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
    """Obtener todos los productos"""
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
    """Crear un nuevo producto"""
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
    """Actualizar un producto existente"""
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
    """Eliminar un producto"""
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
    """Obtener todos los códigos promocionales"""
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
    """Generar un nuevo código promocional"""
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
    """Eliminar un código promocional"""
    try:
        if VoucherModel.delete_voucher(voucher_id):
            return jsonify({'message': 'Código eliminado'}), 200
        return jsonify({'message': 'Código no encontrado'}), 404
    except Exception as e:
        print("Error en delete_voucher:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar código'}), 500


# ================================================================
#  PLATAFORMAS (Cuentas a dominio)
# ================================================================

@admin_bp.route('/plataformas', methods=['GET'])
@token_required
@admin_required
def get_plataformas():
    """Obtener todas las plataformas (activas e inactivas)"""
    try:
        plataformas = PlataformaModel.get_all(solo_activas=False)
        return jsonify(plataformas), 200
    except Exception as e:
        print("Error en get_plataformas:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener plataformas'}), 500


@admin_bp.route('/plataformas', methods=['POST'])
@token_required
@admin_required
def create_plataforma():
    """Crear una nueva plataforma"""
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        precio = data.get('precio')
        icono = data.get('icono', 'fas fa-tv')
        color = data.get('color', '#3b82f6')

        if not nombre or precio is None:
            return jsonify({'message': 'Faltan datos (nombre y precio son obligatorios)'}), 400

        if precio <= 0:
            return jsonify({'message': 'El precio debe ser mayor a 0'}), 400

        plataforma = PlataformaModel.create(nombre, precio, icono, color)
        if not plataforma:
            return jsonify({'message': 'Error al crear la plataforma (¿nombre duplicado?)'}), 400
        return jsonify(plataforma), 201
    except Exception as e:
        print("Error en create_plataforma:", traceback.format_exc())
        return jsonify({'message': 'Error interno al crear plataforma'}), 500


@admin_bp.route('/plataformas/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_plataforma(id):
    """Actualizar una plataforma existente"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No hay datos para actualizar'}), 400

        if PlataformaModel.update(id, **data):
            return jsonify({'message': 'Plataforma actualizada'}), 200
        return jsonify({'message': 'Plataforma no encontrada'}), 404
    except Exception as e:
        print("Error en update_plataforma:", traceback.format_exc())
        return jsonify({'message': 'Error interno al actualizar plataforma'}), 500


@admin_bp.route('/plataformas/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_plataforma(id):
    """Eliminar una plataforma"""
    try:
        if PlataformaModel.delete(id):
            return jsonify({'message': 'Plataforma eliminada'}), 200
        return jsonify({'message': 'Plataforma no encontrada'}), 404
    except Exception as e:
        print("Error en delete_plataforma:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar plataforma'}), 500


# ================================================================
#  SOLICITUDES (Admin)
# ================================================================

@admin_bp.route('/solicitudes', methods=['GET'])
@token_required
@admin_required
def get_solicitudes():
    """Obtener todas las solicitudes (con filtro por estado opcional)"""
    try:
        estado = request.args.get('estado')  # ?estado=pending
        solicitudes = SolicitudModel.get_all(estado)
        return jsonify(solicitudes), 200
    except Exception as e:
        print("Error en get_solicitudes:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener solicitudes'}), 500


@admin_bp.route('/solicitudes/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_solicitud(id):
    """Cambiar el estado de una solicitud (pending → completed/cancelled)"""
    try:
        data = request.get_json()
        estado = data.get('estado')

        if not estado:
            return jsonify({'message': 'Falta el estado'}), 400

        if estado not in ['pending', 'completed', 'cancelled']:
            return jsonify({'message': 'Estado inválido'}), 400

        if SolicitudModel.update_status(id, estado):
            return jsonify({'message': f'Solicitud actualizada a {estado}'}), 200
        return jsonify({'message': 'Solicitud no encontrada'}), 404
    except Exception as e:
        print("Error en update_solicitud:", traceback.format_exc())
        return jsonify({'message': 'Error interno al actualizar solicitud'}), 500


@admin_bp.route('/solicitudes/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_solicitud(id):
    """Eliminar una solicitud"""
    try:
        if SolicitudModel.delete(id):
            return jsonify({'message': 'Solicitud eliminada'}), 200
        return jsonify({'message': 'Solicitud no encontrada'}), 404
    except Exception as e:
        print("Error en delete_solicitud:", traceback.format_exc())
        return jsonify({'message': 'Error interno al eliminar solicitud'}), 500


@admin_bp.route('/solicitudes/estadisticas', methods=['GET'])
@token_required
@admin_required
def get_solicitudes_stats():
    """Obtener estadísticas de solicitudes (totales, pendientes, etc.)"""
    try:
        stats = SolicitudModel.count_by_status()
        return jsonify(stats), 200
    except Exception as e:
        print("Error en get_solicitudes_stats:", traceback.format_exc())
        return jsonify({'message': 'Error interno al obtener estadísticas'}), 500