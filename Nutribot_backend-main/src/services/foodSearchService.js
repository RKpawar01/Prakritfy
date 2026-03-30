/**
 * Food Search Service
 * 
 * Provides user-friendly food search with:
 * - Filter by dietary preferences (vegan, vegetarian, etc.)
 * - Filter by fitness goals (weight_loss, muscle_gain, etc.)
 * - Filter by category or region
 * - Smart recommendations
 */

const Food = require("../models/Food");
const {
  normalizeFoodName,
  logNutritionAudit,
  singularize,
} = require("../utils/nutritionEngine");
const { getSearchTerms } = require("../utils/ingredientExtractor");
const {
  detectCookingMethod,
  extractBaseFoodName,
  generateFoodSearchPatterns,
} = require("../utils/cookingMethodHandler");

const MATCH_PROJECTION = [
  "name",
  "canonical_name",
  "aliases",
  "search_tokens",
  "serving",
  "nutrition_per_100g",
  "micronutrients_per_100g",
  "cooking_method",
  "region",
  "diet_tags",
].join(" ");

const QUERY_TIMEOUT_MS = 2000;

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildTokenVariants(term) {
  const normalized = normalizeFoodName(term);
  const tokens = normalized.split(" ").filter(Boolean);
  const variants = [normalized];
  tokens.forEach((token) => {
    variants.push(token);
    variants.push(singularize(token));
  });
  return uniqueList(variants);
}

async function runMatchQuery(query, matchType, originalInput) {
  const doc = await Food.findOne(query)
    .select(MATCH_PROJECTION)
    .lean()
    .collation({ locale: "en", strength: 2 })
    .maxTimeMS(QUERY_TIMEOUT_MS);

  if (doc) {
    logNutritionAudit("food_match_candidate", {
      matchType,
      originalInput,
      matchedFood: doc.name,
    });
    return doc;
  }
  return null;
}

/**
 * Search foods with flexible filters
 * @param {Object} filters
 *   - diet_tags: array of diet preferences ["vegan", "vegetarian", etc.]
 *   - goal_tags: array of fitness goals ["weight_loss", "muscle_gain", etc.]
 *   - category: specific food category
 *   - region: specific region
 *   - searchText: search by name/aliases
 * @param {number} limit: max results to return
 */
async function searchFoods(filters = {}, limit = 20) {
  try {
    const query = {};

    // Filter by diet tags (if user specifies dietary preferences)
    if (filters.diet_tags && filters.diet_tags.length > 0) {
      query.diet_tags = { $in: filters.diet_tags };
    }

    // Filter by goal tags (if user specifies fitness goals)
    if (filters.goal_tags && filters.goal_tags.length > 0) {
      query.goal_tags = { $in: filters.goal_tags };
    }

    // Filter by category
    if (filters.category) {
      query.category = filters.category;
    }

    // Filter by region
    if (filters.region) {
      query.region = filters.region;
    }

    // Text search by name or aliases
    if (filters.searchText) {
      const searchRegex = new RegExp(filters.searchText, "i");
      query.$or = [
        { name: searchRegex },
        { aliases: { $in: [searchRegex] } },
      ];
    }

    const foods = await Food.find(query)
      .limit(limit)
      .lean();

    return {
      success: true,
      count: foods.length,
      foods: foods.map(f => ({
        id: f._id,
        name: f.name,
        category: f.category,
        region: f.region,
        diet_tags: f.diet_tags,
        goal_tags: f.goal_tags,
        nutrition_per_100g: f.nutrition_per_100g,
        serving: f.serving,
      })),
    };
  } catch (error) {
    console.error("Food search error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get foods matching user's dietary profile
 * @param {Object} userProfile
 *   - dietType: "vegan", "vegetarian", "eggetarian", "non_vegetarian"
 *   - fitnessGoal: "weight_loss", "weight_gain", "muscle_gain", "general_fitness"
 */
async function getFoodsForUserProfile(userProfile) {
  const { dietType, fitnessGoal } = userProfile;

  try {
    const query = {};

    // Match diet preference
    if (dietType) {
      query.diet_tags = { $in: [dietType] };
    }

    // Match fitness goal
    if (fitnessGoal) {
      query.goal_tags = { $in: [fitnessGoal] };
    }

    const foods = await Food.find(query)
      .limit(50)
      .lean();

    const stats = {
      vegan: await Food.countDocuments({ diet_tags: { $in: ["vegan"] } }),
      vegetarian: await Food.countDocuments({ diet_tags: { $in: ["vegetarian"] } }),
      eggetarian: await Food.countDocuments({ diet_tags: { $in: ["eggetarian"] } }),
      non_vegetarian: await Food.countDocuments({ diet_tags: { $in: ["non_vegetarian"] } }),
    };

    return {
      success: true,
      userProfile,
      count: foods.length,
      foods: foods.map(f => ({
        name: f.name,
        nutrition: f.nutrition_per_100g,
        diet_tags: f.diet_tags,
        goal_tags: f.goal_tags,
      })),
      stats,
    };
  } catch (error) {
    console.error("User profile foods error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get food recommendations for a specific goal
 * @param {string} goal: "weight_loss", "weight_gain", "muscle_gain", "general_fitness"
 * @param {string} dietType: optional diet filter
 */
async function getFoodsForGoal(goal, dietType = null) {
  try {
    const query = {
      goal_tags: { $in: [goal] },
    };

    if (dietType) {
      query.diet_tags = { $in: [dietType] };
    }

    const foods = await Food.find(query)
      .limit(30)
      .lean();

    // Group by category for better UX
    const grouped = {};
    foods.forEach(f => {
      if (!grouped[f.category]) {
        grouped[f.category] = [];
      }
      grouped[f.category].push({
        name: f.name,
        calories: f.nutrition_per_100g.calories,
        protein: f.nutrition_per_100g.protein,
        carbs: f.nutrition_per_100g.carbs,
        fat: f.nutrition_per_100g.fat,
        serving: f.serving,
      });
    });

    return {
      success: true,
      goal,
      dietType: dietType || "all",
      totalFoods: foods.length,
      byCategory: grouped,
    };
  } catch (error) {
    console.error("Goal recommendations error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all available diet tags and goal tags with counts
 */
async function getDatabaseStats() {
  try {
    // Count by diet tags
    const dietTagsCount = await Food.aggregate([
      { $unwind: "$diet_tags" },
      { $group: { _id: "$diet_tags", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Count by goal tags
    const goalTagsCount = await Food.aggregate([
      { $unwind: "$goal_tags" },
      { $group: { _id: "$goal_tags", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Count by category
    const categoryCount = await Food.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totalFoods = await Food.countDocuments();

    return {
      success: true,
      totalFoods,
      dietTags: Object.fromEntries(dietTagsCount.map(d => [d._id, d.count])),
      goalTags: Object.fromEntries(goalTagsCount.map(g => [g._id, g.count])),
      categories: Object.fromEntries(categoryCount.map(c => [c._id, c.count])),
    };
  } catch (error) {
    console.error("Database stats error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get trending foods (with best macros for goal)
 */
async function getTrendingFoods(goal = "general_fitness", limit = 10) {
  try {
    let foods;

    if (goal === "weight_loss") {
      // Low calorie foods
      foods = await Food.find({ goal_tags: { $in: [goal] } })
        .sort({ "nutrition_per_100g.calories": 1 })
        .limit(limit)
        .lean();
    } else if (goal === "muscle_gain") {
      // High protein foods
      foods = await Food.find({ goal_tags: { $in: [goal] } })
        .sort({ "nutrition_per_100g.protein": -1 })
        .limit(limit)
        .lean();
    } else if (goal === "weight_gain") {
      // High calorie foods
      foods = await Food.find({ goal_tags: { $in: [goal] } })
        .sort({ "nutrition_per_100g.calories": -1 })
        .limit(limit)
        .lean();
    } else {
      // General fitness - balanced foods
      foods = await Food.find({ goal_tags: { $in: [goal] } })
        .limit(limit)
        .lean();
    }

    return {
      success: true,
      goal,
      foods: foods.map(f => ({
        name: f.name,
        category: f.category,
        calories: f.nutrition_per_100g.calories,
        protein: f.nutrition_per_100g.protein,
        carbs: f.nutrition_per_100g.carbs,
        fat: f.nutrition_per_100g.fat,
        serving: f.serving,
        diet_tags: f.diet_tags,
      })),
    };
  } catch (error) {
    console.error("Trending foods error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function findBestFoodMatch(foodName) {
  const normalizedInput = normalizeFoodName(foodName);
  const cookingMethod = detectCookingMethod(foodName);
  const baseName = extractBaseFoodName(foodName);
  const ingredientTerms = getSearchTerms(foodName);
  const patternVariants = generateFoodSearchPatterns(foodName);

  const priorityTerms = uniqueList([
    foodName,
    normalizedInput,
    baseName,
    ...ingredientTerms,
    ...patternVariants,
  ]);

  const aliasTerms = uniqueList([
    ...ingredientTerms,
    baseName,
    singularize(baseName),
  ]);

  const tokenTerms = uniqueList(priorityTerms.flatMap(buildTokenVariants));

  logNutritionAudit("food_search_plan", {
    originalInput: foodName,
    normalizedInput,
    priorityTerms,
    aliasTerms,
    tokenTerms,
    cookingMethod,
  });

  for (const term of priorityTerms) {
    const doc = await runMatchQuery(
      { name: { $regex: new RegExp(`^${escapeRegex(term)}$`, "i") } },
      `name_exact:${term}`,
      foodName,
    );
    if (doc) {
      return {
        food: doc,
        cookingMethod,
        matchedPattern: term,
        matchType: "name_exact",
      };
    }
  }

  for (const term of priorityTerms) {
    const doc = await runMatchQuery({ canonical_name: term }, `canonical:${term}`, foodName);
    if (doc) {
      return {
        food: doc,
        cookingMethod,
        matchedPattern: term,
        matchType: "canonical",
      };
    }
  }

  for (const term of aliasTerms) {
    const doc = await runMatchQuery({ aliases: term }, `alias:${term}`, foodName);
    if (doc) {
      return {
        food: doc,
        cookingMethod,
        matchedPattern: term,
        matchType: "alias",
      };
    }
  }

  for (const term of tokenTerms) {
    const doc = await runMatchQuery({ search_tokens: { $in: [term] } }, `token:${term}`, foodName);
    if (doc) {
      return {
        food: doc,
        cookingMethod,
        matchedPattern: term,
        matchType: "token",
      };
    }
  }

  for (const term of tokenTerms) {
    const regex = new RegExp(escapeRegex(term), "i");
    const doc = await runMatchQuery(
      { $or: [{ name: regex }, { canonical_name: regex }, { aliases: regex }] },
      `fuzzy:${term}`,
      foodName,
    );
    if (doc) {
      return {
        food: doc,
        cookingMethod,
        matchedPattern: term,
        matchType: "fuzzy",
      };
    }
  }

  logNutritionAudit("food_match_miss", {
    originalInput: foodName,
    normalizedInput,
  });

  return null;
}

module.exports = {
  searchFoods,
  getFoodsForUserProfile,
  getFoodsForGoal,
  getDatabaseStats,
  getTrendingFoods,
  findBestFoodMatch,
};
