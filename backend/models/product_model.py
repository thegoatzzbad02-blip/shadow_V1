import sqlite3
import json
from backend.database import get_db

class ProductModel:
    @classmethod
    def _convert_codes(cls, codes):
        if codes is None:
            return '[]'
        return json.dumps(codes)

    @classmethod
    def _parse_codes(cls, codes_str):
        if codes_str is None:
            return []
        try:
            return json.loads(codes_str)
        except json.JSONDecodeError:
            return []

    @classmethod
    def create_product(cls, name, price, stock, codes=None):
        conn = get_db()
        cursor = conn.cursor()
        codes_json = cls._convert_codes(codes)
        cursor.execute(
            "INSERT INTO products (name, price, stock, codes) VALUES (?, ?, ?, ?)",
            (name, price, stock, codes_json)
        )
        conn.commit()
        product_id = cursor.lastrowid
        conn.close()
        return {
            'id': product_id,
            'name': name,
            'price': price,
            'stock': stock,
            'codes': codes if codes is not None else []
        }

    @classmethod
    def get_by_id(cls, product_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            product = dict(row)
            product['codes'] = cls._parse_codes(product.get('codes'))
            return product
        return None

    @classmethod
    def get_all_products(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products")
        rows = cursor.fetchall()
        conn.close()
        products = []
        for row in rows:
            product = dict(row)
            product['codes'] = cls._parse_codes(product.get('codes'))
            products.append(product)
        return products

    @classmethod
    def get_available(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE stock > 0")
        rows = cursor.fetchall()
        conn.close()
        products = []
        for row in rows:
            product = dict(row)
            product['codes'] = cls._parse_codes(product.get('codes'))
            products.append(product)
        return products

    @classmethod
    def purchase(cls, product_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT stock, codes FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None
        stock = row['stock']
        codes = cls._parse_codes(row['codes'])
        if stock <= 0 or not codes:
            conn.close()
            return None
        code = codes.pop(0)
        new_stock = stock - 1
        new_codes_json = cls._convert_codes(codes)
        cursor.execute(
            "UPDATE products SET stock = ?, codes = ? WHERE id = ?",
            (new_stock, new_codes_json, product_id)
        )
        conn.commit()
        conn.close()
        return code

    @classmethod
    def update_product(cls, product_id, new_name, new_price, new_stock, new_codes=None):
        conn = get_db()
        cursor = conn.cursor()
        if new_codes is not None:
            codes_json = cls._convert_codes(new_codes)
            cursor.execute(
                "UPDATE products SET name = ?, price = ?, stock = ?, codes = ? WHERE id = ?",
                (new_name, new_price, new_stock, codes_json, product_id)
            )
        else:
            cursor.execute(
                "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?",
                (new_name, new_price, new_stock, product_id)
            )
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def delete_product(cls, product_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0