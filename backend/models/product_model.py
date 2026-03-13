from flask import current_app
from pymongo import MongoClient
import os

class ProductModel:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._client is None:
            try:
                uri = current_app.config.get('MONGO_URI') or os.getenv('MONGO_URI')
                dbname = current_app.config.get('MONGO_DBNAME') or os.getenv('MONGO_DB_NAME', 'shadow_platform')
                if not uri:
                    raise Exception("MONGO_URI no está configurada")
                print(f"Conectando a MongoDB con URI: {uri}")
                cls._client = MongoClient(uri)
                cls._db = cls._client[dbname]
            except Exception as e:
                print("Error conectando a MongoDB:", e)
                raise
        return cls._db

    @classmethod
    def get_collection(cls):
        return cls.get_db().products

    @classmethod
    def _convert_id(cls, doc):
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    @classmethod
    def create_product(cls, name, price, stock, codes=None):
        try:
            collection = cls.get_collection()
            last_product = collection.find_one(sort=[("id", -1)])
            new_id = (last_product["id"] + 1) if last_product else 1
            new_product = {
                "id": new_id,
                "name": name,
                "price": price,
                "stock": stock,
                "codes": codes if codes is not None else []
            }
            collection.insert_one(new_product)
            return new_product
        except Exception as e:
            print("Error en create_product:", e)
            raise

    @classmethod
    def get_by_id(cls, product_id):
        try:
            doc = cls.get_collection().find_one({"id": product_id})
            return cls._convert_id(doc)
        except Exception as e:
            print("Error en get_by_id:", e)
            return None

    @classmethod
    def get_all_products(cls):
        try:
            docs = list(cls.get_collection().find())
            for doc in docs:
                cls._convert_id(doc)
            return docs
        except Exception as e:
            print("Error en get_all_products:", e)
            return []

    @classmethod
    def get_available(cls):
        try:
            docs = list(cls.get_collection().find({"stock": {"$gt": 0}}))
            for doc in docs:
                cls._convert_id(doc)
            return docs
        except Exception as e:
            print("Error en get_available:", e)
            return []

    @classmethod
    def purchase(cls, product_id):
        try:
            collection = cls.get_collection()
            product = collection.find_one({"id": product_id})
            if not product or product["stock"] <= 0 or not product["codes"]:
                return None
            code = product["codes"].pop(0)
            result = collection.update_one(
                {"id": product_id},
                {
                    "$set": {"codes": product["codes"]},
                    "$inc": {"stock": -1}
                }
            )
            return code if result.modified_count > 0 else None
        except Exception as e:
            print("Error en purchase:", e)
            return None

    @classmethod
    def update_product(cls, product_id, new_name, new_price, new_stock, new_codes=None):
        try:
            update_data = {"name": new_name, "price": new_price, "stock": new_stock}
            if new_codes is not None:
                update_data["codes"] = new_codes
            result = cls.get_collection().update_one(
                {"id": product_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print("Error en update_product:", e)
            return False

    @classmethod
    def delete_product(cls, product_id):
        try:
            result = cls.get_collection().delete_one({"id": product_id})
            return result.deleted_count > 0
        except Exception as e:
            print("Error en delete_product:", e)
            return False