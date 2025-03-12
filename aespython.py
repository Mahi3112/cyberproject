from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64
import os
from pymongo import MongoClient

# AES Key (Should be stored securely, not hardcoded in production)
AES_KEY = os.urandom(32)  # 256-bit key
AES_IV = os.urandom(16)  # 16-byte IV

def encrypt_data(plain_text):
    cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
    encrypted_bytes = cipher.encrypt(pad(plain_text.encode(), AES.block_size))
    return base64.b64encode(AES_IV + encrypted_bytes).decode()

def decrypt_data(encrypted_text):
    encrypted_bytes = base64.b64decode(encrypted_text)
    iv = encrypted_bytes[:16]
    cipher = AES.new(AES_KEY, AES.MODE_CBC, iv)
    decrypted_bytes = unpad(cipher.decrypt(encrypted_bytes[16:]), AES.block_size)
    return decrypted_bytes.decode()

def encrypt_existing_data():
    client = MongoClient("mongodb+srv://mahidevendrapatel:<@cluster0.eflhc.mongodb.net/")
    db = client["secure_voting"]
    
    # Encrypt Users Collection
    users = db.users.find()
    for user in users:
        db.users.update_one({"_id": user["_id"]}, {"$set": {
            "name": encrypt_data(user["name"]),
            "age": encrypt_data(str(user["age"])),
            "email": encrypt_data(user["email"]),
            "mobile": encrypt_data(user["mobile"]),
            "aadhar": encrypt_data(user["aadhar"]),
            "password": encrypt_data(user["password"])
        }})
    
    # Encrypt Votes Collection
    votes = db.votes.find()
    for vote in votes:
        db.votes.update_one({"_id": vote["_id"]}, {"$set": {
            "encrypted_vote": encrypt_data(vote["encrypted_vote"])
        }})
    
    print("Existing database data encrypted successfully.")

def get_users():
    client = MongoClient("your_mongodb_atlas_connection_string")
    db = client["secure_voting"]
    users = db.users.find()
    return [{"id": str(user["_id"]), "name": decrypt_data(user["name"]), "age": decrypt_data(user["age"]), "email": decrypt_data(user["email"]), "mobile": decrypt_data(user["mobile"]), "aadhar": decrypt_data(user["aadhar"]), "password": decrypt_data(user["password"])} for user in users]

def get_votes():
    client = MongoClient("your_mongodb_atlas_connection_string")
    db = client["secure_voting"]
    votes = db.votes.find()
    return [{"id": str(vote["_id"]), "user_id": vote["user_id"], "vote": decrypt_data(vote["encrypted_vote"])} for vote in votes]

if __name__ == "__main__":
    encrypt_existing_data()