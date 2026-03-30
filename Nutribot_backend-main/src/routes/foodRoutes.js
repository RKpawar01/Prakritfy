/**
 * Food Discovery Routes
 * 
 * Simple, user-friendly endpoints for:
 * - Searching foods by preferences
 * - Getting personalized recommendations
 * - Browsing database statistics
 */

const express = require("express");
const router = express.Router();
const {
  searchFoods,
  getFoodsForUserProfile,
  getFoodsForGoal,
  getDatabaseStats,
  getTrendingFoods,
} = require("../services/foodSearchService");

/**
 * GET /foods/stats
 * Get database overview: how many foods, diet tags, goals, categories
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/search
 * Search foods with filters
 * Query params:
 *   - searchText: search by name
 *   - diet_tags: comma-separated (vegan, vegetarian, etc.)
 *   - goal_tags: comma-separated (weight_loss, muscle_gain, etc.)
 *   - category: food category
 *   - region: food region
 *   - limit: max results (default 20)
 */
router.get("/search", async (req, res) => {
  try {
    const filters = {};

    if (req.query.searchText) {
      filters.searchText = req.query.searchText;
    }

    if (req.query.diet_tags) {
      filters.diet_tags = req.query.diet_tags.split(",").map(t => t.trim());
    }

    if (req.query.goal_tags) {
      filters.goal_tags = req.query.goal_tags.split(",").map(t => t.trim());
    }

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.region) {
      filters.region = req.query.region;
    }

    const limit = parseInt(req.query.limit) || 20;
    const result = await searchFoods(filters, limit);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/for-me
 * Get personalized food recommendations
 * Query params:
 *   - dietType: vegan, vegetarian, eggetarian, non_vegetarian
 *   - fitnessGoal: weight_loss, weight_gain, muscle_gain, general_fitness
 */
router.get("/for-me", async (req, res) => {
  try {
    const userProfile = {
      dietType: req.query.dietType || null,
      fitnessGoal: req.query.fitnessGoal || null,
    };

    const result = await getFoodsForUserProfile(userProfile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/goal/:goal
 * Get foods tailored to a specific goal
 * Params:
 *   - goal: weight_loss, weight_gain, muscle_gain, general_fitness
 * Query:
 *   - dietType: optional dietary filter
 */
router.get("/goal/:goal", async (req, res) => {
  try {
    const { goal } = req.params;
    const dietType = req.query.dietType || null;

    // Validate goal
    const validGoals = ["weight_loss", "weight_gain", "muscle_gain", "general_fitness"];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: `Invalid goal. Must be one of: ${validGoals.join(", ")}`,
      });
    }

    const result = await getFoodsForGoal(goal, dietType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/trending/:goal
 * Get best foods for a goal (sorted by relevance)
 * Params:
 *   - goal: weight_loss, weight_gain, muscle_gain, general_fitness
 * Query:
 *   - limit: max results
 */
router.get("/trending/:goal", async (req, res) => {
  try {
    const { goal } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Validate goal
    const validGoals = ["weight_loss", "weight_gain", "muscle_gain", "general_fitness"];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: `Invalid goal. Must be one of: ${validGoals.join(", ")}`,
      });
    }

    const result = await getTrendingFoods(goal, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/categories
 * List all available food categories
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      "breakfast",
      "lunch",
      "dinner",
      "snacks",
      "fruits",
      "vegetables",
      "dairy",
      "protein",
      "grains",
      "legumes",
      "beverages",
      "sweets",
      "poultry",
      "seafood",
      "meat",
      "regional",
      "eggs",
    ];

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/diet-types
 * List all available diet types
 */
router.get("/diet-types", async (req, res) => {
  try {
    const dietTypes = ["vegan", "vegetarian", "eggetarian", "non_vegetarian", "gluten_free", "high_fiber"];

    res.json({
      success: true,
      dietTypes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /foods/goals
 * List all available fitness goals
 */
router.get("/goals", async (req, res) => {
  try {
    const goals = ["weight_loss", "weight_gain", "muscle_gain", "general_fitness"];

    res.json({
      success: true,
      goals,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
