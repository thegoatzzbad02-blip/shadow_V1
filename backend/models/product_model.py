import json
import os
import time

# Detectar si estamos en Vercel (producción) para usar /tmp
if os.environ.get('VERCEL'):
    DATA_DIR = '/tmp/data'
else:
    DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

PRODUCTS_FILE = os.path.join(DATA_DIR, 'products.json')

# Asegurar que el directorio existe
os.makedirs(DATA_DIR, exist_ok=True)

# Variables para caché simple
_cache = None
_cache_time = 0
CACHE_DURATION = 5  # segundos

def _read_products():
    """Lee el archivo products.json y retorna una lista. Usa caché para evitar lecturas repetidas."""
    global _cache, _cache_time
    now = time.time()
    if _cache is not None and (now - _cache_time) < CACHE_DURATION:
        return _cache

    if not os.path.exists(PRODUCTS_FILE):
        _cache = []
    else:
        try:
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    _cache = []
                else:
                    _cache = json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            _cache = []
    _cache_time = now
    return _cache

def _write_products(products):
    """Escribe la lista de productos en el archivo JSON y actualiza la caché."""
    global _cache, _cache_time
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    _cache = products
    _cache_time = time.time()

class ProductModel:
    @staticmethod
    def create_product(name, price, stock, codes=None):
        """Crea un nuevo producto con su lista de códigos."""
        products = _read_products()
        new_id = max([p['id'] for p in products], default=0) + 1
        new_product = {
            'id': new_id,
            'name': name,
            'price': price,
            'stock': stock,
            'codes': codes if codes is not None else []
        }
        products.append(new_product)
        _write_products(products)
        return new_product

    @staticmethod
    def get_by_id(product_id):
        """Busca un producto por su ID. Retorna el producto o None."""
        products = _read_products()
        for p in products:
            if p['id'] == product_id:
                return p
        return None

    # Alias para compatibilidad con otros nombres usados en el código
    find_by_id = get_by_id

    @staticmethod
    def get_all_products():
        """Retorna todos los productos (para admin)."""
        return _read_products()

    @staticmethod
    def get_available():
        """Retorna solo los productos con stock > 0 (para usuarios)."""
        products = _read_products()
        return [p for p in products if p['stock'] > 0]

    @staticmethod
    def purchase(product_id):
        """
        Procesa la compra de un producto:
        - Toma el primer código de la lista y lo elimina.
        - Reduce el stock en 1.
        - Guarda los cambios.
        Retorna el código asignado o None si hay error.
        """
        products = _read_products()
        for p in products:
            if p['id'] == product_id:
                if p['stock'] <= 0:
                    return None
                if not p['codes'] or len(p['codes']) == 0:
                    # No hay códigos disponibles (inconsistencia)
                    return None
                # Tomar el primer código
                code = p['codes'].pop(0)
                p['stock'] -= 1
                _write_products(products)
                return code
        return None

    @staticmethod
    def update_stock(product_id, new_stock):
        """Actualiza el stock de un producto (útil para admin)."""
        products = _read_products()
        for p in products:
            if p['id'] == product_id:
                p['stock'] = new_stock
                _write_products(products)
                return True
        return False

    @staticmethod
    def update_product(product_id, new_name, new_price, new_stock, new_codes=None):
        """Actualiza todos los campos de un producto."""
        products = _read_products()
        for p in products:
            if p['id'] == product_id:
                p['name'] = new_name
                p['price'] = new_price
                p['stock'] = new_stock
                if new_codes is not None:
                    p['codes'] = new_codes
                _write_products(products)
                return True
        return False

    @staticmethod
    def delete_product(product_id):
        """Elimina un producto por su ID."""
        products = _read_products()
        new_products = [p for p in products if p['id'] != product_id]
        if len(new_products) != len(products):
            _write_products(new_products)
            return True
        return False