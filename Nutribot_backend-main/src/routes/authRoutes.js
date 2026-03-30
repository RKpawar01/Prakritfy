const router = require("express").Router();
const { register, verifyOtp, resendOtp, login, getProfile, changePassword, deleteAccount } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);
router.post("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
