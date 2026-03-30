/**
 * Food Search Utility - Handles searching and serving size calculations
 * for the new clean Food schema
 * 
 * Features:
 * - Search by name, alias, and text
 * - Calculate serving-based nutrition
 * - Support for multiple unit types
 */

const Food = require("../models/Food");
const { normalizeFoodName, logNutritionAudit } = require("./nutritionEngine");

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Comprehensive food search using name, aliases, and text search
 * @param {string} foodName - The food to search for
 * @returns {Promise<Object|null>} Food document or null if not found
 */
async function searchFoodByNameOrAlias(foodName) {
  if (!foodName || typeof foodName !== "string") return null;

  const normalized = normalizeFoodName(foodName);
  const escaped = escapeRegex(foodName);

  try {
    // Step 1: Try exact name match (case-insensitive)
    let food = await Food.findOne({
      name: new RegExp(`^${escaped}$`, "i"),
    });

    if (food) {
      logNutritionAudit("food_search_exact", { input: foodName, matched: food.name });
      return food;
    }

    // Step 2: Try alias match
    food = await Food.findOne({
      aliases: new RegExp(`^${escaped}$`, "i"),
    });

    if (food) {
      logNutritionAudit("food_search_alias", { input: foodName, matched: food.name });
      return food;
    }

    // Step 3: Try case-insensitive partial name match
    food = await Food.findOne({
      name: new RegExp(escaped, "i"),
    });

    if (food) {
      logNutritionAudit("food_search_partial", { input: foodName, matched: food.name });
      return food;
    }

    // Step 4: Try word boundary match in name
    food = await Food.findOne({
      name: new RegExp(`\\b${escaped}\\b`, "i"),
    });

    if (food) {
      logNutritionAudit("food_search_word_boundary", { input: foodName, matched: food.name });
      return food;
    }

    // Step 5: Try text search as last resort
    const textResults = await Food.find(
      { $text: { $search: normalized } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(1);

    if (textResults.length > 0) {
      logNutritionAudit("food_search_text", { input: foodName, matched: textResults[0].name });
      return textResults[0];
    }

    logNutritionAudit("food_search_not_found", { input: foodName });
    return null;
  } catch (error) {
    console.error(`Error searching for food "${foodName}":`, error.message);
    return null;
  }
}

/**
 * Calculate nutrition based on serving size from the Food document
 * Returns nutrition for exactly 1 serving unit as defined in the food
 * 
 * @param {Object} food - Food document with serving info
 * @returns {Object} Nutrition per serving { calories, protein, carbs, ... }
 */
function calculateNutritionPerServing(food) {
  if (!food || !food.nutrition_per_100g || !food.serving) {
    throw new Error("Invalid food document: missing nutrition or serving data");
  }

  const nutrition = food.nutrition_per_100g;
  const serving = food.serving;
  const servingGrams = serving.grams || 100;

  // Scale from per-100g to per-serving
  const scale = servingGrams / 100;

  return {
    calories: Number((nutrition.calories * scale).toFixed(2)),
    protein: Number((nutrition.protein * scale).toFixed(2)),
    carbs: Number((nutrition.carbs * scale).toFixed(2)),
    fat: Number((nutrition.fat * scale).toFixed(2)),
    fiber: Number((nutrition.fiber * scale).toFixed(2)),
    sugar: Number((nutrition.sugar * scale).toFixed(2)),
    saturatedFat: Number((nutrition.saturatedFat * scale).toFixed(2)),
  };
}

/**
 * Calculate nutrition for a custom quantity and unit
 * @param {Object} food - Food document
 * @param {number} quantity - Amount (e.g., 2)
 * @param {string} unit - Unit (e.g., "piece", "cup", "ml", "grams")
 * @returns {Object} Total nutrition for the quantity
 */
function calculateNutritionForQuantity(food, quantity = 1, unit = "serving") {
  if (!food || !food.nutrition_per_100g) {
    throw new Error("Invalid food document");
  }

  let grams = 100; // default

  if (unit === "serving") {
    // Use the food's defined serving size
    grams = (food.serving?.grams || 100) * (quantity || 1);
  } else if (unit === "gram" || unit === "grams" || unit === "g") {
    grams = quantity || 100;
  } else if (unit === "piece" || unit === "pieces") {
    // For piece-based servings, use serving.grams
    grams = (food.serving?.grams || 100) * (quantity || 1);
  } else if (unit === "cup" || unit === "cups") {
    grams = 240 * (quantity || 1);
  } else if (unit === "ml" || unit === "ml") {
    grams = quantity; // ml ≈ g for most foods
  } else if (unit === "tbsp" || unit === "tablespoon") {
    grams = 15 * (quantity || 1);
  } else if (unit === "tsp" || unit === "teaspoon") {
    grams = 5 * (quantity || 1);
  } else {
    // Unknown unit, default to grams
    grams = quantity || 100;
  }

  // Scale from per-100g
  const scale = grams / 100;
  const nutrition = food.nutrition_per_100g;

  return {
    calories: Number((nutrition.calories * scale).toFixed(2)),
    protein: Number((nutrition.protein * scale).toFixed(2)),
    carbs: Number((nutrition.carbs * scale).toFixed(2)),
    fat: Number((nutrition.fat * scale).toFixed(2)),
    fiber: Number((nutrition.fiber * scale).toFixed(2)),
    sugar: Number((nutrition.sugar * scale).toFixed(2)),
    saturatedFat: Number((nutrition.saturatedFat * scale).toFixed(2)),
  };
}

/**
 * Get micronutrients scaled to a quantity
 * @param {Object} food - Food document
 * @param {number} grams - Weight in grams
 * @returns {Object} Micronutrients scaled to weight
 */
function getMicronutrientsForGrams(food, grams = 100) {
  if (!food || !food.micronutrients_per_100g) {
    return {}; // Return empty if no micronutrients
  }

  const micros = food.micronutrients_per_100g;
  const scale = grams / 100;

  return {
    vitaminA: Number((micros.vitaminA * scale).toFixed(2)) || 0,
    vitaminB1: Number((micros.vitaminB1 * scale).toFixed(2)) || 0,
    vitaminB2: Number((micros.vitaminB2 * scale).toFixed(2)) || 0,
    vitaminB3: Number((micros.vitaminB3 * scale).toFixed(2)) || 0,
    vitaminB6: Number((micros.vitaminB6 * scale).toFixed(2)) || 0,
    vitaminB12: Number((micros.vitaminB12 * scale).toFixed(2)) || 0,
    vitaminC: Number((micros.vitaminC * scale).toFixed(2)) || 0,
    vitaminD: Number((micros.vitaminD * scale).toFixed(2)) || 0,
    vitaminE: Number((micros.vitaminE * scale).toFixed(2)) || 0,
    vitaminK: Number((micros.vitaminK * scale).toFixed(2)) || 0,
    folate: Number((micros.folate * scale).toFixed(2)) || 0,
    calcium: Number((micros.calcium * scale).toFixed(2)) || 0,
    iron: Number((micros.iron * scale).toFixed(2)) || 0,
    magnesium: Number((micros.magnesium * scale).toFixed(2)) || 0,
    potassium: Number((micros.potassium * scale).toFixed(2)) || 0,
    sodium: Number((micros.sodium * scale).toFixed(2)) || 0,
    zinc: Number((micros.zinc * scale).toFixed(2)) || 0,
  };
}

module.exports = {
  searchFoodByNameOrAlias,
  calculateNutritionPerServing,
  calculateNutritionForQuantity,
  getMicronutrientsForGrams,
};
