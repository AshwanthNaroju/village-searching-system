const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "villages_api",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection immediately
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database pool connected");
    connection.release();
  } catch (err) {
    console.error("❌ Database pool error:", err.message);
  }
})();

module.exports = pool;
