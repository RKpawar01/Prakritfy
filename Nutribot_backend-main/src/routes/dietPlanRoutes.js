const express = require("express");
const router = express.Router();
const dietPlanController = require("../controllers/dietPlanController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Generate diet plan
router.post("/generate", dietPlanController.generateDietPlan);

// Get current diet plan
router.get("/current", dietPlanController.getDietPlan);

// Regenerate diet plan
router.post("/regenerate", dietPlanController.regenerateDietPlan);

module.exports = router;
