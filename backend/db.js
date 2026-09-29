const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Error: MONGODB_URI tidak ditemukan di file .env");
  process.exit(1);
}

const client = new MongoClient(uri);
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    console.log("Terhubung ke MongoDB Atlas dengan sukses!");
    db = client.db(); // Menggunakan default database dari URI (uvers_db)
    return db;
  } catch (error) {
    console.error("Gagal terhubung ke MongoDB Atlas:", error);
    throw error;
  }
}

module.exports = { connectDB, getDB: () => db };
