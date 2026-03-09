import json
import os
import time
from backend.utils.auth import hash_password

# ... resto igual ...

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

_cache = None
_cache_time = 0
CACHE_DURATION = 5  # segundos

def _read_users():
    global _cache, _cache_time
    now = time.time()
    if _cache is not None and (now - _cache_time) < CACHE_DURATION:
        return _cache
    if not os.path.exists(USERS_FILE):
        _cache = []
    else:
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                _cache = json.loads(content) if content else []
        except json.JSONDecodeError:
            _cache = []
    _cache_time = now
    return _cache

def _write_users(users):
    global _cache, _cache_time
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
    _cache = users
    _cache_time = time.time()

class UserModel:
    @staticmethod
    def find_by_username(username):
        users = _read_users()
        for user in users:
            if user['username'] == username:
                return user
        return None

    @staticmethod
    def find_by_id(user_id):
        users = _read_users()
        for user in users:
            if user['id'] == user_id:
                return user
        return None

    @staticmethod
    def create_user(username, password, role='user', credits=0):
        users = _read_users()
        new_id = max([u['id'] for u in users], default=0) + 1
        hashed = hash_password(password)
        new_user = {
            'id': new_id,
            'username': username,
            'password': hashed,
            'role': role,
            'credits': credits
        }
        users.append(new_user)
        _write_users(users)
        return new_user

    @staticmethod
    def update_credits(user_id, new_credits):
        users = _read_users()
        for user in users:
            if user['id'] == user_id:
                user['credits'] = new_credits
                _write_users(users)
                return True
        return False

    @staticmethod
    def update_user(user_id, new_username, new_credits):
        users = _read_users()
        for user in users:
            if user['id'] == user_id:
                user['username'] = new_username
                user['credits'] = new_credits
                _write_users(users)
                return True
        return False

    @staticmethod
    def delete_user(user_id):
        users = _read_users()
        new_users = [u for u in users if u['id'] != user_id]
        if len(new_users) != len(users):
            _write_users(new_users)
            return True
        return False

    @staticmethod
    def get_all_users():
        users = _read_users()
        return [{k: v for k, v in u.items() if k != 'password'} for u in users]
