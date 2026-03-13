from flask import current_app
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os

class UserModel:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._client is None:
            try:
                # Obtener URI desde config o directamente de variable de entorno (por si acaso)
                uri = current_app.config.get('MONGO_URI') or os.getenv('MONGO_URI')
                dbname = current_app.config.get('MONGO_DBNAME') or os.getenv('MONGO_DB_NAME', 'shadow_platform')
                if not uri:
                    raise Exception("MONGO_URI no está configurada")
                print(f"Conectando a MongoDB con URI: {uri}")  # Log en Vercel
                cls._client = MongoClient(uri)
                cls._db = cls._client[dbname]
            except Exception as e:
                print("Error conectando a MongoDB:", e)
                raise
        return cls._db

    @classmethod
    def get_collection(cls):
        return cls.get_db().users

    @classmethod
    def _convert_id(cls, doc):
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    @classmethod
    def find_by_username(cls, username):
        try:
            doc = cls.get_collection().find_one({"username": username})
            return cls._convert_id(doc)
        except Exception as e:
            print("Error en find_by_username:", e)
            return None

    @classmethod
    def find_by_id(cls, user_id):
        try:
            doc = cls.get_collection().find_one({"id": user_id})
            return cls._convert_id(doc)
        except Exception as e:
            print("Error en find_by_id:", e)
            return None

    @classmethod
    def create_user(cls, username, password, role='user', credits=0):
        try:
            collection = cls.get_collection()
            last_user = collection.find_one(sort=[("id", -1)])
            new_id = (last_user["id"] + 1) if last_user else 1
            hashed = generate_password_hash(password)
            new_user = {
                "id": new_id,
                "username": username,
                "password": hashed,
                "role": role,
                "credits": credits
            }
            collection.insert_one(new_user)
            return new_user
        except Exception as e:
            print("Error en create_user:", e)
            raise

    @classmethod
    def update_credits(cls, user_id, new_credits):
        try:
            result = cls.get_collection().update_one(
                {"id": user_id},
                {"$set": {"credits": new_credits}}
            )
            return result.modified_count > 0
        except Exception as e:
            print("Error en update_credits:", e)
            return False

    @classmethod
    def update_user(cls, user_id, new_username, new_credits):
        try:
            result = cls.get_collection().update_one(
                {"id": user_id},
                {"$set": {"username": new_username, "credits": new_credits}}
            )
            return result.modified_count > 0
        except Exception as e:
            print("Error en update_user:", e)
            return False

    @classmethod
    def delete_user(cls, user_id):
        try:
            result = cls.get_collection().delete_one({"id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            print("Error en delete_user:", e)
            return False

    @classmethod
    def get_all_users(cls):
        try:
            docs = list(cls.get_collection().find({}, {"password": 0}))
            for doc in docs:
                cls._convert_id(doc)
            return docs
        except Exception as e:
            print("Error en get_all_users:", e)
            return []