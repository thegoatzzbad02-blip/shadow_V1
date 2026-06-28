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
    def create_product(cls, name, price, stock, category='otros', description='', codes=None):
        conn = get_db()
        cursor = conn.cursor()
        codes_json = cls._convert_codes(codes)
        cursor.execute(
            "INSERT INTO products (name, price, stock, category, description, codes) VALUES (?, ?, ?, ?, ?, ?)",
            (name, price, stock, category, description, codes_json)
        )
        conn.commit()
        product_id = cursor.lastrowid
        conn.close()
        return {
            'id': product_id,
            'name': name,
            'price': price,
            'stock': stock,
            'category': category,
            'description': description,
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
    def get_available(cls, category=None):
        conn = get_db()
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT * FROM products WHERE stock > 0 AND category = ?", (category,))
        else:
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
    def update_product(cls, product_id, name, price, stock, category=None, description=None, codes=None):
        conn = get_db()
        cursor = conn.cursor()
        updates = ["name = ?", "price = ?", "stock = ?"]
        params = [name, price, stock]
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if codes is not None:
            updates.append("codes = ?")
            params.append(cls._convert_codes(codes))
        params.append(product_id)
        query = f"UPDATE products SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
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