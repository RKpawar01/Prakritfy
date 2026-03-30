/**
 * Production Nutrition Pipeline
 * 
 * Orchestrates fast food lookup with 3 concurrent tiers:
 * 1. Cache + Fast Map (Promise.all parallel) → < 10ms
 * 2. Database lookup → 50-200ms if needed
 * 3. AI fallback → 1-2 seconds (only if no match)
 * 
 * Target: < 2 seconds total (usually < 500ms with cache)
 */

const { getCachedNutrition, setCachedNutrition, isCached } = require('./cacheService');
const { getFastFoodNutrition } = require('./fastFoodMap');
const { normalizeFoodName, convertToGrams, logNutritionAudit } = require('../utils/nutritionEngine');
const { analyzeNutritionCompletely } = require('../utils/nutritionValidator');
const { scaleNutrientsByWeight, aggregateNutrients } = require('../utils/nutrientTransformer');

const FAST_FOOD_CACHE_KEY_PREFIX = 'fast_';
const AI_TIMEOUT_MS = 2000; // Max 2 seconds for AI fallback

/**
 * Process a complete meal input through the nutrition pipeline
 * Returns aggregated nutrition + source info for UI
 * 
 * @param {Array} foodItems - [{ foodName: "2 roti", ...}, { foodName: "dal", ...}]
 * @param {Function} aiAnalyzer - Function to call for AI fallback
 * @param {Object} options - { timeout, skipAI, ... }
 * @returns {Object} { items, totalNutrition, sources, timing }
 */
async function analyzeMealThroughPipeline(foodItems = [], aiAnalyzer, options = {}) {
  const pipelineStart = performance.now();

  try {
    if (!foodItems || foodItems.length === 0) {
      return {
        items: [],
        totalNutrition: null,
        error: 'No food items provided',
      };
    }

    logNutritionAudit('pipeline_start', {
      itemCount: foodItems.length,
      timeout: options.timeout || AI_TIMEOUT_MS,
    });

    // Process each food item through the pipeline
    const itemPromises = foodItems.map(item =>
      processSingleFood(item, aiAnalyzer, options).catch(err => ({
        foodName: item.foodName,
        name: item.originalInput || item.foodName,
        error: err.message,
        nutrition: null,
        source: 'error',
      }))
    );

    // Wait for ALL items in parallel
    const processedItems = await Promise.all(itemPromises);

    // Filter out errors and aggregate nutrition
    const successfulItems = processedItems.filter(item => !item.error && item.nutrition);
    const totalNutrition = successfulItems.length > 0 
      ? aggregateNutrients(successfulItems.map(i => i.nutrition))
      : null;

    const pipelineTime = performance.now() - pipelineStart;

    // Log slow pipeline
    if (pipelineTime > 2000) {
      logNutritionAudit('pipeline_slow_warning', {
        totalTime_ms: pipelineTime,
        itemCount: foodItems.length,
        successfulItems: successfulItems.length,
      });
    }

    return {
      items: processedItems,
      totalNutrition,
      successfulItems: successfulItems.length,
      totalItems: foodItems.length,
      timing: {
        total_ms: pipelineTime,
        perItem_ms: Math.round(pipelineTime / foodItems.length),
      },
    };
  } catch (error) {
    logNutritionAudit('pipeline_error', {
      error: error.message,
      itemCount: foodItems.length,
      time_ms: performance.now() - pipelineStart,
    });
    throw error;
  }
}

/**
 * Process ONE food item through the pipeline
 * Using Promise.all for cache + DB parallel lookup
 */
async function processSingleFood(foodItem, aiAnalyzer, options = {}) {
  const itemStart = performance.now();

  try {
    // Parse the input
    const { foodName, originalInput } = parseInput(foodItem);
    const { quantity, unit } = extractQuantity(foodName);
    const foodNameOnly = removeQuantity(foodName);
    const normalizedName = normalizeFoodName(foodNameOnly);
    const weightInGrams = convertToGrams(quantity, unit, foodNameOnly);

    logNutritionAudit('pipeline_item_start', {
      input: foodName,
      normalized: normalizedName,
      quantity,
      unit,
      weightGrams: weightInGrams,
    });

    // ===== STAGE 1: Fast parallel lookup (Promise.all) =====
    const [cachedNutrition, fastMapNutrition] = await Promise.all([
      // Tier 1: Check in-memory cache
      checkCacheFast(normalizedName),
      
      // Tier 2: Check fast food map
      checkFastMapFast(normalizedName),
    ]);

    // If we have a cache or fast map hit, return immediately
    if (cachedNutrition) {
      const scaled = scaleByWeight(cachedNutrition, weightInGrams);
      return {
        originalInput: originalInput || foodNameOnly,
        name: foodNameOnly,
        quantity,
        unit,
        weightGrams,
        nutrition: scaled,
        source: 'cache',
        confidence: 'high',
        timing_ms: performance.now() - itemStart,
      };
    }

    if (fastMapNutrition) {
      const scaled = scaleByWeight(fastMapNutrition, weightInGrams);
      // Cache it for next time
      setCachedNutrition(normalizedName, fastMapNutrition);
      
      return {
        originalInput: originalInput || foodNameOnly,
        name: foodNameOnly,
        quantity,
        unit,
        weightGrams,
        nutrition: scaled,
        source: 'fast_map',
        confidence: 'high',
        timing_ms: performance.now() - itemStart,
      };
    }

    // ===== STAGE 2: Database lookup (slower, but only if needed) =====
    logNutritionAudit('pipeline_db_fallback', {
      food: foodNameOnly,
      normalized: normalizedName,
    });

    // For now, skip DB lookup and go straight to AI
    // (You would call foodSearchService here)

    // ===== STAGE 3: AI fallback (last resort) =====
    if (!aiAnalyzer) {
      throw new Error(`No match found for "${foodNameOnly}" and AI not available`);
    }

    logNutritionAudit('pipeline_ai_fallback', {
      food: foodNameOnly,
      normalized: normalizedName,
    });

    const aiNutrition = await callAIWithTimeout(aiAnalyzer, foodNameOnly, options.timeout || AI_TIMEOUT_MS);
    
    if (aiNutrition) {
      const scaled = scaleByWeight(aiNutrition, weightInGrams);
      // Cache for next time
      setCachedNutrition(normalizedName, aiNutrition);
      
      // Optionally save high-confidence AI results to DB
      // (implementation depends on user preference)
      
      return {
        originalInput: originalInput || foodNameOnly,
        name: foodNameOnly,
        quantity,
        unit,
        weightGrams,
        nutrition: scaled,
        source: 'ai',
        confidence: 'medium',
        timing_ms: performance.now() - itemStart,
      };
    }

    throw new Error(`Could not find or analyze "${foodNameOnly}"`);
  } catch (error) {
    logNutritionAudit('pipeline_item_error', {
      foodItem: foodItem.foodName || foodItem,
      error: error.message,
      time_ms: performance.now() - itemStart,
    });
    
    return {
      originalInput: foodItem.foodName || String(foodItem),
      name: 'unknown',
      nutrition: null,
      error: error.message,
      source: 'error',
      timing_ms: performance.now() - itemStart,
    };
  }
}

/**
 * Check cache very quickly (< 1ms)
 */
async function checkCacheFast(normalizedName) {
  try {
    if (isCached(normalizedName)) {
      const cached = getCachedNutrition(normalizedName);
      return cached;
    }
  } catch (err) {
    logNutritionAudit('cache_check_error', { error: err.message });
  }
  return null;
}

/**
 * Check fast food map quickly (< 5ms)
 */
async function checkFastMapFast(normalizedName) {
  try {
    const fastFood = getFastFoodNutrition(normalizedName);
    if (fastFood && fastFood.nutrition_per_100g) {
      return fastFood.nutrition_per_100g;
    }
  } catch (err) {
    logNutritionAudit('fastmap_check_error', { error: err.message });
  }
  return null;
}

/**
 * Call AI with timeout protection
 */
async function callAIWithTimeout(aiAnalyzer, foodName, timeoutMs) {
  return Promise.race([
    aiAnalyzer(foodName),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]).catch(err => {
    logNutritionAudit('ai_timeout_or_error', {
      food: foodName,
      error: err.message,
    });
    return null;
  });
}

/**
 * Parse food item input
 */
function parseInput(foodItem) {
  if (typeof foodItem === 'string') {
    return {
      foodName: foodItem,
      originalInput: foodItem,
    };
  }
  
  return {
    foodName: foodItem.foodName || String(foodItem),
    originalInput: foodItem.originalInput || foodItem.foodName,
  };
}

/**
 * Extract quantity from food name
 * "2 roti" → { quantity: 2, unit: "piece" }
 * "100g dal" → { quantity: 100, unit: "g" }
 */
function extractQuantity(foodName) {
  const match = foodName.match(/^(\d+(?:\.\d+)?)\s*([a-z]*)\s+/i);
  
  if (match) {
    const quantity = parseFloat(match[1]);
    const unit = match[2] || 'piece';
    return { quantity, unit };
  }

  // No quantity specified - assume 1 piece or 100g
  return { quantity: 100, unit: 'g' };
}

/**
 * Remove quantity prefix from food name
 * "2 roti" → "roti"
 * "100g dal" → "dal"
 */
function removeQuantity(foodName) {
  return foodName.replace(/^\d+(?:\.\d+)?\s*[a-z]*\s+/i, '').trim();
}

/**
 * Scale nutrition by weight
 */
function scaleByWeight(nutritionPer100, weightGrams) {
  if (!nutritionPer100) return null;
  return scaleNutrientsByWeight(nutritionPer100, weightGrams);
}

/**
 * Get pipeline metrics for monitoring
 */
function getPipelineMetrics() {
  return {
    description: 'Nutrition pipeline processes meals through 3 tiers',
    tier1: { name: 'Cache + FastMap', maxTime_ms: 10 },
    tier2: { name: 'Database', maxTime_ms: 200 },
    tier3: { name: 'AI Fallback', maxTime_ms: 2000 },
    targetTotal: '< 2 seconds',
  };
}

module.exports = {
  analyzeMealThroughPipeline,
  processSingleFood,
  getPipelineMetrics,
  
  // Exports for testing
  extractQuantity,
  removeQuantity,
  parseInput,
};
