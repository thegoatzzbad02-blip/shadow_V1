from flask import current_app
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

class UserModel:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._client is None:
            uri = current_app.config['MONGO_URI']
            dbname = current_app.config['MONGO_DBNAME']
            cls._client = MongoClient(uri)
            cls._db = cls._client[dbname]
        return cls._db

    @classmethod
    def get_collection(cls):
        return cls.get_db().users

    @classmethod
    def _convert_id(cls, doc):
        """Convierte _id a string en un documento si existe."""
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    @classmethod
    def find_by_username(cls, username):
        doc = cls.get_collection().find_one({"username": username})
        return cls._convert_id(doc)

    @classmethod
    def find_by_id(cls, user_id):
        doc = cls.get_collection().find_one({"id": user_id})
        return cls._convert_id(doc)

    @classmethod
    def create_user(cls, username, password, role='user', credits=0):
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
        return new_user  # No contiene _id

    @classmethod
    def update_credits(cls, user_id, new_credits):
        result = cls.get_collection().update_one(
            {"id": user_id},
            {"$set": {"credits": new_credits}}
        )
        return result.modified_count > 0

    @classmethod
    def update_user(cls, user_id, new_username, new_credits):
        result = cls.get_collection().update_one(
            {"id": user_id},
            {"$set": {"username": new_username, "credits": new_credits}}
        )
        return result.modified_count > 0

    @classmethod
    def delete_user(cls, user_id):
        result = cls.get_collection().delete_one({"id": user_id})
        return result.deleted_count > 0

    @classmethod
    def get_all_users(cls):
        docs = list(cls.get_collection().find({}, {"password": 0}))
        for doc in docs:
            cls._convert_id(doc)
        return docs