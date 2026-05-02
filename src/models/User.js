const db = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const { name, email, password, membership = "free" } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, membership, status, role) VALUES (?, ?, ?, ?, 'pending', 'user')",
      [name, email, hashedPassword, membership]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT id, name, email, role, membership, status, bio, search_count_today, created_at FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  static async updateProfile(id, { name, bio }) {
    await db.execute("UPDATE users SET name = ?, bio = ? WHERE id = ?", [name, bio, id]);
  }

  static async updateStatus(id, status) {
    await db.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  }

  static async updateMembership(id, membership) {
    await db.execute("UPDATE users SET membership = ? WHERE id = ?", [membership, id]);
  }

  static async incrementSearchCount(id) {
    await db.execute("UPDATE users SET search_count_today = search_count_today + 1, last_search_date = CURDATE() WHERE id = ?", [id]);
  }

  static async getAllUsers() {
    const [rows] = await db.execute("SELECT id, name, email, role, membership, status, search_count_today, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC");
    return rows;
  }

  static async deleteUser(id) {
    await db.execute("DELETE FROM users WHERE id = ?", [id]);
  }
}

module.exports = User;