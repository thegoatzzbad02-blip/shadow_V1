from flask import current_app
from pymongo import MongoClient

class ProductModel:
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
        return cls.get_db().products

    @classmethod
    def create_product(cls, name, price, stock, codes=None):
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

    @classmethod
    def get_by_id(cls, product_id):
        return cls.get_collection().find_one({"id": product_id})

    @classmethod
    def get_all_products(cls):
        return list(cls.get_collection().find())

    @classmethod
    def get_available(cls):
        return list(cls.get_collection().find({"stock": {"$gt": 0}}))

    @classmethod
    def purchase(cls, product_id):
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

    @classmethod
    def update_product(cls, product_id, new_name, new_price, new_stock, new_codes=None):
        update_data = {"name": new_name, "price": new_price, "stock": new_stock}
        if new_codes is not None:
            update_data["codes"] = new_codes
        result = cls.get_collection().update_one(
            {"id": product_id},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @classmethod
    def delete_product(cls, product_id):
        result = cls.get_collection().delete_one({"id": product_id})
        return result.deleted_count > 0
