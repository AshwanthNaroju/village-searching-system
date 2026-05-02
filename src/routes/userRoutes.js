const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "User profile",
    user: req.user
  });
});

module.exports = router;