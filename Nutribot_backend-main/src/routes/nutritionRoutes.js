const router = require("express").Router();
const { getNutritionSummary, getMealSuggestions } = require("../controllers/nutritionController");
const { protect } = require("../middleware/authMiddleware");

// All nutrition routes require authentication
router.use(protect);

/**
 * GET /api/nutrition/summary
 * Fetch nutrition summary with deficiency analysis
 * Query params: period (daily|weekly), startDate, endDate
 */
router.get("/summary", getNutritionSummary);

/**
 * POST /api/nutrition/suggestions
 * Get personalized meal suggestions based on deficiencies
 * Body: { deficientNutrients: string[], goal: string, dietType: string }
 */
router.post("/suggestions", getMealSuggestions);

module.exports = router;
