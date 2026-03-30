/**
 * Safe Food Lookup Service
 * 
 * Priority order:
 * 1. Exact name match
 * 2. Exact alias match  
 * 3. Normalized name match
 * 4. High-confidence fuzzy match (>85%)
 * 5. AI fallback (with validation before save)
 * 
 * NEVER: Return low-confidence matches
 * NEVER: Save bad data to database
 */

const Food = require("../models/Food");
const { validateNutrition, logFoodLookup } = require("./foodInputValidator");

const MIN_FUZZY_CONFIDENCE = 0.85; // 85% threshold
const MIN_RESULT_CONFIDENCE = 0.75; // Require 75%+ confidence overall

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j][i + 1] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Calculate fuzzy match confidence (0-1)
 */
function calculateFuzzyConfidence(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * Safe lookup with detailed logging
 */
async function safeLookupFood(foodName, { isBeverage = false, logId = null } = {}) {
  const lookupLog = {
    logId,
    originalFoodName: foodName,
    timestamp: new Date().toISOString(),
    steps: [],
    result: null,
    matchType: null,
    confidence: null,
    errors: [],
  };

  try {
    // Step 1: Exact name match
    lookupLog.steps.push("Attempting exact name match...");
    let food = await Food.findOne({
      name: { $regex: `^${foodName}$`, $options: "i" },
    })
      .select("name aliases nutrition_per_100g micronutrients_per_100g")
      .lean();

    if (food) {
      lookupLog.steps.push("✅ Found exact name match");
      lookupLog.matchType = "exact";
      lookupLog.confidence = 1.0;

      // Validate before returning
      const validation = validateNutrition(
        food.nutrition_per_100g,
        isBeverage
      );
      if (validation.valid) {
        lookupLog.result = food;
        logFoodLookup(lookupLog);
        return { success: true, food, matchType: "exact", confidence: 1.0 };
      } else {
        lookupLog.errors = validation.errors;
        lookupLog.steps.push(
          `⚠️ Exact match failed validation: ${validation.errors.join(", ")}`
        );
      }
    }

    // Step 2: Exact alias match
    lookupLog.steps.push("Attempting exact alias match...");
    food = await Food.findOne({
      aliases: { $regex: `^${foodName}$`, $options: "i" },
    })
      .select("name aliases nutrition_per_100g micronutrients_per_100g")
      .lean();

    if (food) {
      lookupLog.steps.push("✅ Found exact alias match");
      lookupLog.matchType = "alias";
      lookupLog.confidence = 0.95;

      const validation = validateNutrition(
        food.nutrition_per_100g,
        isBeverage
      );
      if (validation.valid) {
        lookupLog.result = food;
        logFoodLookup(lookupLog);
        return { success: true, food, matchType: "alias", confidence: 0.95 };
      } else {
        lookupLog.errors = validation.errors;
        lookupLog.steps.push(
          `⚠️ Alias match failed validation: ${validation.errors.join(", ")}`
        );
      }
    }

    // Step 3: Fuzzy match if no exact match
    lookupLog.steps.push(`Attempting fuzzy match (threshold: ${MIN_FUZZY_CONFIDENCE})...`);
    const allFoods = await Food.find({})
      .select("name aliases nutrition_per_100g micronutrients_per_100g")
      .lean();

    let bestMatch = null;
    let bestScore = 0;

    for (const dbFood of allFoods) {
      // Check name
      const nameScore = calculateFuzzyConfidence(
        foodName.toLowerCase(),
        dbFood.name.toLowerCase()
      );

      // Check aliases
      let aliasScore = 0;
      if (dbFood.aliases && dbFood.aliases.length > 0) {
        for (const alias of dbFood.aliases) {
          const score = calculateFuzzyConfidence(
            foodName.toLowerCase(),
            alias.toLowerCase()
          );
          aliasScore = Math.max(aliasScore, score);
        }
      }

      // Use best score
      const score = Math.max(nameScore, aliasScore);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { food: dbFood, score };
      }
    }

    if (bestMatch && bestScore >= MIN_FUZZY_CONFIDENCE) {
      const validation = validateNutrition(
        bestMatch.food.nutrition_per_100g,
        isBeverage
      );

      if (validation.valid && bestScore >= MIN_RESULT_CONFIDENCE) {
        lookupLog.steps.push(
          `✅ Found fuzzy match: "${bestMatch.food.name}" (confidence: ${(bestScore * 100).toFixed(1)}%)`
        );
        lookupLog.matchType = "fuzzy";
        lookupLog.confidence = bestScore;
        lookupLog.result = bestMatch.food;
        logFoodLookup(lookupLog);
        return {
          success: true,
          food: bestMatch.food,
          matchType: "fuzzy",
          confidence: bestScore,
        };
      } else if (validation.valid) {
        lookupLog.steps.push(
          `⚠️ Fuzzy match has low confidence (${(bestScore * 100).toFixed(1)}% < ${(MIN_RESULT_CONFIDENCE * 100).toFixed(1)}%). Not using.`
        );
      } else {
        lookupLog.steps.push(
          `⚠️ Fuzzy match failed validation: ${validation.errors.join(", ")}`
        );
      }
    } else {
      lookupLog.steps.push(
        `No fuzzy matches above threshold${bestMatch ? ` (best was ${(bestScore * 100).toFixed(1)}%)` : ""}`
      );
    }

    // No database match found
    lookupLog.steps.push(
      "No reliable database match found. AI fallback required."
    );
    logFoodLookup(lookupLog);

    return {
      success: false,
      food: null,
      matchType: "none",
      confidence: 0,
      requiresAI: true,
      lookupLog,
    };
  } catch (error) {
    lookupLog.errors.push(`Database lookup error: ${error.message}`);
    logFoodLookup(lookupLog);
    return {
      success: false,
      food: null,
      matchType: null,
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Validate and save AI-generated food
 * Only save if:
 * 1. All required fields exist
 * 2. All values are numeric
 * 3. Nutrition validation passes
 */
async function saveAIGeneratedFood(foodData, lookupLog = {}) {
  const saveLog = {
    ...lookupLog,
    saveAttempted: true,
    foodName: foodData.name,
    validationResults: {},
    saved: false,
    errors: [],
  };

  try {
    // Check required fields
    const requiredFields = [
      "name",
      "aliases",
      "category",
      "region",
      "serving",
      "nutrition_per_100g",
      "micronutrients_per_100g",
    ];

    for (const field of requiredFields) {
      if (!foodData[field]) {
        saveLog.errors.push(`Missing required field: ${field}`);
      }
    }

    if (saveLog.errors.length > 0) {
      logFoodLookup(saveLog);
      return { saved: false, errors: saveLog.errors };
    }

    // Check nutrition is numeric
    const nutritionKeys = Object.keys(foodData.nutrition_per_100g);
    for (const key of nutritionKeys) {
      const value = foodData.nutrition_per_100g[key];
      if (typeof value !== "number" || isNaN(value)) {
        saveLog.errors.push(`Invalid nutrition value: ${key} = ${value}`);
      }
    }

    if (saveLog.errors.length > 0) {
      logFoodLookup(saveLog);
      return { saved: false, errors: saveLog.errors };
    }

    // Validate nutrition
    const validation = validateNutrition(
      foodData.nutrition_per_100g,
      lookupLog.isBeverage || false
    );

    saveLog.validationResults = {
      valid: validation.valid,
      errors: validation.errors,
      warning: validation.warning,
    };

    if (!validation.valid) {
      saveLog.errors = validation.errors;
      logFoodLookup(saveLog);
      return { saved: false, errors: validation.errors };
    }

    // All checks passed - save to database
    const newFood = new Food({
      ...foodData,
      source: "ai_generated",
      verified: false,
    });

    await newFood.save();
    saveLog.saved = true;
    saveLog.savedId = newFood._id;
    logFoodLookup(saveLog);

    return {
      saved: true,
      food: newFood,
    };
  } catch (error) {
    saveLog.errors.push(`Save error: ${error.message}`);
    logFoodLookup(saveLog);
    return { saved: false, errors: [error.message] };
  }
}

/**
 * Find suspicious or junk entries in database
 */
async function findSuspiciousEntries() {
  const suspicious = [];

  // Find entries with bad names
  const badPatterns = [
    "coco coal",
    "coco cola",
    "coca cola", // This one might be OK, but worth checking
    "junk",
    "test",
    "xxx",
    "unknown",
  ];

  for (const pattern of badPatterns) {
    const foods = await Food.find({
      name: { $regex: pattern, $options: "i" },
    }).lean();
    suspicious.push(...foods);
  }

  // Find entries with impossible nutrition
  const impossibleFoods = await Food.find({
    $or: [
      { "nutrition_per_100g.fiber": { $gt: "$nutrition_per_100g.carbs" } },
      { "nutrition_per_100g.sugar": { $gt: "$nutrition_per_100g.carbs" } },
      { "nutrition_per_100g.calories": { $lt: 0 } },
      { "nutrition_per_100g.protein": { $lt: 0 } },
      { "nutrition_per_100g.carbs": { $lt: 0 } },
      { "nutrition_per_100g.fat": { $lt: 0 } },
    ],
  }).lean();

  suspicious.push(...impossibleFoods);

  // Remove duplicates
  const unique = [...new Set(suspicious.map((s) => s._id.toString()))];
  return unique.length;
}

module.exports = {
  safeLookupFood,
  saveAIGeneratedFood,
  findSuspiciousEntries,
  calculateFuzzyConfidence,
  levenshteinDistance,
  MIN_FUZZY_CONFIDENCE,
  MIN_RESULT_CONFIDENCE,
};
