const db = require("../config/db");

// GET USERS
exports.getUsers = async (req, res) => {
  const [users] = await db.query("SELECT id,name,email,role,membership FROM users");
  res.json(users);
};

// UPDATE MEMBERSHIP
exports.updateMembership = async (req, res) => {
  const { id } = req.params;
  const { membership } = req.body;

  await db.query("UPDATE users SET membership=? WHERE id=?", [
    membership,
    id,
  ]);

  res.json({ message: "Membership updated" });
};

// MAKE ADMIN
exports.makeAdmin = async (req, res) => {
  const { id } = req.params;

  await db.query("UPDATE users SET role='admin' WHERE id=?", [id]);

  res.json({ message: "User promoted to admin" });
};
