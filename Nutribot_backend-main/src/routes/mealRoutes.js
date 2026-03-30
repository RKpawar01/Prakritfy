const router = require("express").Router();
const { saveMeal, getMyMeals, rebuildDailyStats, rebuildAllStats, diagnosticMealCount } = require("../controllers/mealController");
const { protect } = require("../middleware/authMiddleware");

router.post("/save", protect, saveMeal);
router.get("/my", protect, getMyMeals);
router.get("/diagnostic/meal-count", protect, diagnosticMealCount);

// Rebuild all DailyStats - Fix historical data issue for all users (unprotected for initialization)
router.get("/rebuild-all-stats", rebuildAllStats);

// Rebuild user's DailyStats - protected for security
router.post("/rebuild-daily-stats", protect, rebuildDailyStats);

module.exports = router;
