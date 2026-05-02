const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hashed]
  );

  res.json({ message: "User registered successfully" });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query("SELECT * FROM users WHERE email=?", [email]);

  if (users.length === 0)
    return res.status(400).json({ message: "User not found" });

  const user = users[0];

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user.id, role: user.role, membership: user.membership },
    "SECRET_KEY",
    { expiresIn: "1d" }
  );

  res.json({ token, user });
};