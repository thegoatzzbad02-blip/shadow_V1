import sqlite3
import random
import string
from datetime import datetime, timedelta
from backend.database import get_db

class VoucherModel:
    @classmethod
    def generate_code(cls, length=12):
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    @classmethod
    def create_voucher(cls, amount, expires_days=None, created_by=None):
        conn = get_db()
        cursor = conn.cursor()
        code = cls.generate_code()
        expires_at = None
        if expires_days:
            expires_at = (datetime.now() + timedelta(days=expires_days)).isoformat()
        try:
            cursor.execute(
                "INSERT INTO vouchers (code, amount, expires_at, created_by) VALUES (?, ?, ?, ?)",
                (code, amount, expires_at, created_by)
            )
            conn.commit()
            voucher_id = cursor.lastrowid
            conn.close()
            return {
                'id': voucher_id,
                'code': code,
                'amount': amount,
                'used': False,
                'created_at': datetime.now().isoformat(),
                'expires_at': expires_at,
                'created_by': created_by
            }
        except sqlite3.IntegrityError:
            conn.close()
            return None

    @classmethod
    def get_all_vouchers(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vouchers ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def get_by_code(cls, code):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vouchers WHERE code = ?", (code,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def redeem_voucher(cls, code, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vouchers WHERE code = ?", (code,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {'success': False, 'message': 'Código inválido'}
        voucher = dict(row)
        if voucher['used']:
            conn.close()
            return {'success': False, 'message': 'Este código ya fue utilizado'}
        if voucher['expires_at']:
            expires = datetime.fromisoformat(voucher['expires_at'])
            if datetime.now() > expires:
                conn.close()
                return {'success': False, 'message': 'Este código ha expirado'}
        cursor.execute("UPDATE vouchers SET used = 1 WHERE id = ?", (voucher['id'],))
        cursor.execute("UPDATE users SET credits = credits + ? WHERE id = ?", (voucher['amount'], user_id))
        conn.commit()
        conn.close()
        return {
            'success': True,
            'message': f'¡Código canjeado! Has recibido {voucher["amount"]} créditos.',
            'amount': voucher['amount']
        }

    @classmethod
    def delete_voucher(cls, voucher_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vouchers WHERE id = ?", (voucher_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

