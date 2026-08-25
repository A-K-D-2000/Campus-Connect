const express = require("express");
const router = express.Router();
const { signup, verifyEmail } = require("../controllers/authController");

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);

module.exports = router;
