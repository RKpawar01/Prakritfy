const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get daily stats
router.get("/daily", statsController.getDailyStats);

// Calculate nutrition score
router.get("/nutrition-score", statsController.calculateNutritionScore);

// Get smart suggestions
router.get("/suggestions", statsController.getSuggestions);

// Get meal streak
router.get("/streak", statsController.getStreak);

// Get period analytics
router.get("/analytics", statsController.getPeriodAnalytics);

// Check and award badges
router.post("/check-badges", statsController.checkAndAwardBadges);

// Get user badges
router.get("/badges", statsController.getBadges);

module.exports = router;
