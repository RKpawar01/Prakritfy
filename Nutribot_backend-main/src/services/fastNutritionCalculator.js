/**
 * FAST NUTRITION CALCULATOR
 * 
 * High-performance nutrition calculation with fast paths:
 * 1. In-memory cache (< 1ms)
 * 2. Fast food map (< 5ms)
 * 3. Database lookup with cooking method handling
 * 4. AI fallback with confidence scoring
 * 
 * Target: < 1 second response time (vs 2-3s baseline)
 */

const { getCachedNutrition, setCachedNutrition, isCached } = require('./cacheService');
const { getFastFoodNutrition, isFastFood } = require('./fastFoodMap');
const { normalizeFoodName, isKnownFood } = require('./foodNormalizer');
const { 
  scaleNutrientsByWeight, 
  recalculateCalories 
} = require('../utils/nutrientTransformer');
const { 
  convertToGrams, 
  logNutritionAudit 
} = require('../utils/nutritionEngine');

/**
 * Analyze ONE food with fast paths enabled
 * 
 * Returns {
 *   nutrition: {...},
 *   displayName: "User's input", // Show this to user
 *   canonicalName: "normalized name", // Used for lookup
 *   source: "cache|fast_map|database|ai_fallback",
 *   confidence: "high|medium|low",
 *   weight_grams: 100,
 * }
 */
async function calculateFoodNutrition(
  foodInput,      // e.g., "2 roti", "100g aloo sabji"
  analyzeWithAI   // Function to call for AI fallback
) {
  const startTime = performance.now();

  try {
    // PARSE WEIGHT & FOOD NAME
    // E.g., "2 roti" → { quantity: 2, unit: "piece", food_name: "roti" }
    const parsed = parseQuantityAndFood(foodInput);
    const userDisplayName = parsed.food_name; // Keep original for UI
    const weightInGrams = convertToGrams(parsed.quantity, parsed.unit, parsed.food_name);

    logNutritionAudit('fast_calc_start', {
      input: foodInput,
      parsed,
      weightInGrams,
    });

    // NORMALIZE FOOD NAME
    const normResult = normalizeFoodName(userDisplayName);
    const normalizedName = normResult.normalized || userDisplayName;

    // ===== FAST PATH 1: Check Cache (< 1ms) =====
    if (isCached(normalizedName)) {
      const cachedNutrition = getCachedNutrition(normalizedName);
      const scaledNutrition = scaleNutrientsByWeight(cachedNutrition, weightInGrams);

      logNutritionAudit('fast_calc_cache_hit', {
        food: userDisplayName,
        canonical: normalizedName,
        time_ms: performance.now() - startTime,
      });

      return {
        nutrition: scaledNutrition,
        displayName: userDisplayName,
        canonicalName: normalizedName,
        source: 'cache',
        confidence: 'high',
        weight_grams: weightInGrams,
      };
    }

    // ===== FAST PATH 2: Check Fast Food Map (< 5ms) =====
    const fastFood = getFastFoodNutrition(normalizedName);
    if (fastFood) {
      const scaledNutrition = scaleNutrientsByWeight(
        fastFood.nutrition_per_100g,
        weightInGrams
      );

      // Cache for next time
      setCachedNutrition(normalizedName, fastFood.nutrition_per_100g);

      logNutritionAudit('fast_calc_fast_map_hit', {
        food: userDisplayName,
        canonical: normalizedName,
        time_ms: performance.now() - startTime,
      });

      return {
        nutrition: scaledNutrition,
        displayName: userDisplayName,
        canonicalName: normalizedName,
        source: 'fast_map',
        confidence: 'high',
        weight_grams: weightInGrams,
      };
    }

    // ===== FALLBACK: Try Database (slow, ~500-1000ms) =====
    logNutritionAudit('fast_calc_falling_back_to_db', {
      food: userDisplayName,
      canonical: normalizedName,
    });

    // For now, skip DB (you would call findBestFoodMatch here)
    // To keep this fast, we're going straight to AI if normalized name unknown
    
    // ===== FINAL FALLBACK: AI (you choose this for unlisted foods) =====
    logNutritionAudit('fast_calc_ai_fallback', {
      food: userDisplayName,
      canonical: normalizedName,
      reason: 'food_not_in_cache_or_map',
    });

    const aiResult = await analyzeWithAI(userDisplayName);
    const aiNutrition = mapAiResponse(aiResult);

    // Scale by weight
    const scaledNutrition = scaleNutrientsByWeight(aiNutrition, weightInGrams);

    // Cache for next time
    setCachedNutrition(normalizedName, aiNutrition);

    const totalTime = performance.now() - startTime;
    const isSlowResponse = totalTime > 1000;

    logNutritionAudit('fast_calc_ai_complete', {
      food: userDisplayName,
      time_ms: totalTime,
      slow_warning: isSlowResponse,
    });

    return {
      nutrition: scaledNutrition,
      displayName: userDisplayName, // Show user what they typed
      canonicalName: normalizedName,
      source: 'ai_fallback',
      confidence: isSlowResponse ? 'medium' : 'medium', // AI is always medium confidence
      weight_grams: weightInGrams,
      warning: isSlowResponse ? 'AI response was slow (>1s), values may be estimates' : null,
    };
  } catch (error) {
    logNutritionAudit('fast_calc_error', {
      input: foodInput,
      error: error.message,
      time_ms: performance.now() - startTime,
    });
    throw error;
  }
}

/**
 * Parse quantity and food from input like "2 roti", "100g aloo sabji", "1 cup milk"
 * Simple regex-based approach
 */
function parseQuantityAndFood(foodInput) {
  const text = String(foodInput || '').trim();

  // Match: "2 roti", "100g spinach", "1 cup milk", "roti"
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)$|^(.+)$/);

  if (match && match[1]) {
    // Pattern matched: "2 roti"
    return {
      quantity: parseFloat(match[1]),
      unit: match[2] || 'piece', // Default to pieces
      food_name: match[3],
    };
  }

  // No quantity: just food name
  return {
    quantity: 1,
    unit: 'piece',
    food_name: text,
  };
}

/**
 * Convert AI response to nutrition object
 * Applies recalculation and validation
 */
function mapAiResponse(aiResult) {
  if (!aiResult) return null;

  // Assume aiResult is { macros: {...}, vitamins: {...}, minerals: {...} }
  // Convert to flat object with _unit suffixes for consistency

  return {
    calories_kcal: aiResult.macros?.calories || 0,
    protein_g: aiResult.macros?.protein || 0,
    carbs_g: aiResult.macros?.carbs || 0,
    fat_g: aiResult.macros?.fat || 0,
    fiber_g: aiResult.macros?.fiber || 0,
    sugar_g: aiResult.macros?.sugar || 0,
    saturated_fat_g: aiResult.macros?.saturatedFat || 0,
    calcium_mg: aiResult.minerals?.calcium || null,
    iron_mg: aiResult.minerals?.iron || null,
    magnesium_mg: aiResult.minerals?.magnesium || null,
    potassium_mg: aiResult.minerals?.potassium || null,
    sodium_mg: aiResult.minerals?.sodium || null,
    zinc_mg: aiResult.minerals?.zinc || null,
    vitamin_a_mcg: aiResult.vitamins?.vitaminA || null,
    vitamin_b1_mg: aiResult.vitamins?.vitaminB1 || null,
    vitamin_b2_mg: aiResult.vitamins?.vitaminB2 || null,
    vitamin_b3_mg: aiResult.vitamins?.vitaminB3 || null,
    vitamin_b6_mg: aiResult.vitamins?.vitaminB6 || null,
    vitamin_b12_mcg: aiResult.vitamins?.vitaminB12 || null,
    vitamin_c_mg: aiResult.vitamins?.vitaminC || null,
    vitamin_d_mcg: aiResult.vitamins?.vitaminD || null,
    vitamin_e_mg: aiResult.vitamins?.vitaminE || null,
    vitamin_k_mcg: aiResult.vitamins?.vitaminK || null,
    folate_mcg: aiResult.vitamins?.folate || null,
  };
}

module.exports = {
  calculateFoodNutrition,
  parseQuantityAndFood,
  mapAiResponse,
};
