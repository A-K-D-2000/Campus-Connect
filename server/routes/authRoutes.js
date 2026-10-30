const express = require("express");
const router = express.Router();
const {
  signup,
  verifyEmail,
  login,
  resendVerification,
  setBackupEmail,
  verifyBackupEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);
router.post('/resend-verification', resendVerification);
router.post("/login", login);
router.put("/backup-email", protect, setBackupEmail);
router.get("/verify-backup/:token", verifyBackupEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;