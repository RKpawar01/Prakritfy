const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get profile
router.get("/", profileController.getProfile);

// Get user goal
router.get("/goal", profileController.getUserGoal);

// Onboarding - Initial profile setup after registration
router.post("/onboarding", profileController.onboarding);

// Update profile
router.put("/update", profileController.updateProfile);

// Check if profile is complete
router.get("/check-complete", profileController.isProfileComplete);

// Calculate daily calorie requirement
router.get("/calculate-calories", profileController.calculateCalories);

module.exports = router;
