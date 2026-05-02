const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/auth");
const {
  getUsers,
  updateMembership,
  makeAdmin
} = require("../controllers/adminController");

router.get("/users", verifyToken, isAdmin, getUsers);
router.put("/membership/:id", verifyToken, isAdmin, updateMembership);
router.put("/make-admin/:id", verifyToken, isAdmin, makeAdmin);

module.exports = router;
