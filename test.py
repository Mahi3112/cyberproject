from pymongo import MongoClient

# Replace with your actual MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://mahidevendrapatel:eXc6glPYTKuoSLBP@cluster0.eflhc.mongodb.net/"


client = MongoClient(MONGO_URI)

    # Check if the connection is successful
db_name = "test"
collection_name = "users"

db = client[db_name]
collection = db[collection_name]

# Count documents
count = collection.count_documents({})
print(f"Total documents in '{collection_name}': {count}")

# Fetch and print all documents
if count > 0:
    for doc in collection.find():
            print(doc)
else:
    print("No documents found in the collection.")