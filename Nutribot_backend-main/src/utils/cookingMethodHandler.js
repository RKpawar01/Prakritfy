/**
 * COOKING METHOD VARIANT HANDLER
 * 
 * Handles food variants like: boiled egg, grilled chicken, fried fish, roasted potatoes
 * Maps cooking methods to nutrition adjustments
 */

const COOKING_METHODS = {
  // NOTES ON ADJUSTMENTS:
  // These multipliers are heuristic approximations.
  // Ideally, separate DB entries (raw vs cooked variants) are preferred.
  // Adjustments only applied when no specific cooked variant exists in DB.
  
  raw: { 
    keywords: ['raw', 'uncooked'], 
    fatMultiplier: 1.0,     // No change
    waterLossPercent: 0,    // No water loss
  },
  boiled: { 
    keywords: ['boiled', 'steamed', 'poached'], 
    fatMultiplier: 1.0,     // Minimal or no change (water drains fat slightly)
    waterLossPercent: 25,   // Boiling causes 20-30% water loss
    note: "Use separate DB entry for cooked variant when available"
  },
  grilled: { 
    keywords: ['grilled', 'barbecued', 'bbq'], 
    fatMultiplier: 1.05,    // ~5% fat loss from dripping (slight)
    waterLossPercent: 20,   // Moderate water loss
    note: "No multiplicative fat addition; trim loss accounted for"
  },
  roasted: { 
    keywords: ['roasted', 'baked', 'oven'], 
    fatMultiplier: 1.1,     // ~10% fat increase from oil in oven
    waterLossPercent: 15,   // Mild water loss
    note: "Assumes some oil in roasting process"
  },
  fried: { 
    keywords: ['fried', 'pan-fried', 'deep-fried'], 
    fatMultiplier: 1.5,     // Significant fat increase from oil absorption
    waterLossPercent: 30,   // High water loss from heat
    note: "Deep-fried worst case; light pan-fry may be 20% less"
  },
  curry: { 
    keywords: ['curry', 'gravy', 'sauce', 'masala'], 
    fatMultiplier: 1.3,     // Curry base adds fat (oil/ghee/coconut milk)
    carbs_added_grams: 3,   // Sauce adds carbs (onions, tomatoes, spices)
    note: "Use separate curry entry in DB for more accurate nutrition"
  },
  cooked: { 
    keywords: ['cooked', 'prepared'], 
    fatMultiplier: 1.05,    // Slight fat change
    waterLossPercent: 10,   // Minor water loss
    note: "Generic 'cooked' - apply minimal adjustments"
  },
};

/**
 * Detects cooking method from food name
 * @param {string} foodName - e.g., "boiled eggs", "fried fish", "grilled chicken"
 * @returns {string|null} Cooking method or null if raw/unknown
 */
function detectCookingMethod(foodName) {
  const lower = foodName.toLowerCase();
  
  for (const [method, config] of Object.entries(COOKING_METHODS)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        return method;
      }
    }
  }
  
  return null; // Unknown cooking method – assume raw
}

/**
 * Extracts base food name by removing cooking method keywords
 * @param {string} foodName - e.g., "fried fish" → "fish"
 * @returns {string} Base food name without cooking method
 */
function extractBaseFoodName(foodName) {
  const lower = foodName.toLowerCase();
  
  // Remove all cooking method keywords
  let cleaned = lower;
  for (const config of Object.values(COOKING_METHODS)) {
    for (const keyword of config.keywords) {
      const regex = new RegExp(`\\b${keyword}\\s*`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }
  }

  return cleaned.trim();
}

/**
 * Adjusts nutrition values based on cooking method
 * Used when database has raw food but user requested cooked variant
 * 
 * IMPORTANT: These are heuristic approximations.
 * Ideally, the database should contain separate entries for "raw chicken" vs "cooked chicken"
 * rather than calculating adjustments. Use this as fallback only.
 * 
 * @param {Object} baseNutrient - Canonical nutrient object for raw food
 * @param {string} cookingMethod - e.g., 'fried', 'boiled', 'grilled'
 * @param {number} gramsUsed - Total grams for the nutrient calculation
 * @returns {Object} Adjusted canonical nutrient object
 */
function adjustForCookingMethod(baseNutrient, cookingMethod, gramsUsed = 100) {
  if (!cookingMethod || cookingMethod === 'raw') {
    return baseNutrient; // No adjustment needed
  }

  const methodConfig = COOKING_METHODS[cookingMethod];
  if (!methodConfig) {
    return baseNutrient; // Unknown method, use base
  }

  const adjusted = JSON.parse(JSON.stringify(baseNutrient));

  // Fat adjustment: some cooking methods add or lose fat
  if (adjusted.fat_g !== null && methodConfig.fatMultiplier) {
    adjusted.fat_g = adjusted.fat_g * methodConfig.fatMultiplier;
  }

  // Water loss during cooking concentrates nutrients
  // Formula: higher water loss = higher density of remaining nutrients
  if (methodConfig.waterLossPercent && methodConfig.waterLossPercent > 0) {
    const densityFactor = 1 + (methodConfig.waterLossPercent / 100); // e.g., 25% loss = 1.25x density
    
    // Apply to macros (they get concentrated as water leaves)
    if (adjusted.protein_g !== null) adjusted.protein_g *= densityFactor;
    if (adjusted.carbs_g !== null) adjusted.carbs_g *= densityFactor;
    if (adjusted.fiber_g !== null) adjusted.fiber_g *= densityFactor;
    if (adjusted.sugar_g !== null) adjusted.sugar_g *= densityFactor;
    
    // Apply to minerals (they concentrate as water leaves)
    // But NOT vitamins which can degrade with heat
    if (adjusted.calcium_mg !== null) adjusted.calcium_mg *= densityFactor;
    if (adjusted.iron_mg !== null) adjusted.iron_mg *= densityFactor;
    if (adjusted.magnesium_mg !== null) adjusted.magnesium_mg *= densityFactor;
    if (adjusted.potassium_mg !== null) adjusted.potassium_mg *= densityFactor;
    if (adjusted.sodium_mg !== null) adjusted.sodium_mg *= densityFactor;
    if (adjusted.zinc_mg !== null) adjusted.zinc_mg *= densityFactor;
  }

  // Curry/sauce dishes add carbs from sauce ingredients
  if (methodConfig.carbs_added_grams && adjusted.carbs_g !== null) {
    adjusted.carbs_g += methodConfig.carbs_added_grams;
  }

  return adjusted;
}

/**
 * Builds search patterns for finding food variants
 * For "fried fish", generates patterns like:
 *   "fried fish", "fish fried", "cooked fish", "fish" (raw)
 * 
 * @param {string} foodName - Original food name
 * @returns {Array<string>} Search patterns in order of preference
 */
function generateFoodSearchPatterns(foodName) {
  const cookingMethod = detectCookingMethod(foodName);
  const baseName = extractBaseFoodName(foodName);
  const patterns = [];

  // Pattern 1: Exact match with cooking method in original position
  if (cookingMethod && foodName !== baseName) {
    patterns.push(foodName); // "fried fish"
  }

  // Pattern 2: Base food name only (will apply cooking adjustment)
  if (baseName && baseName !== foodName) {
    patterns.push(baseName); // "fish"
  }

  // Pattern 3: Reverse cooking method position
  if (cookingMethod && baseName) {
    patterns.push(`${baseName} ${cookingMethod}`); // "fish fried"
  }

  // Pattern 4: Cooked variant
  if (cookingMethod !== 'raw' && cookingMethod !== 'cooked') {
    patterns.push(`${baseName} cooked`); // "fish cooked"
  }

  // Pattern 5: Original as fallback
  patterns.push(foodName);

  // Remove duplicates
  return [...new Set(patterns)];
}

/**
 * Metadata about how nutrition was determined
 * Used for confidence tracking
 */
function createCookingMetadata(originalInput, baseFoodName, cookingMethod, matchedDbFood) {
  return {
    user_input: originalInput,
    detected_cooking_method: cookingMethod,
    base_food_name: baseFoodName,
    matched_database_food: matchedDbFood,
    confidence: cookingMethod ? 'medium' : 'high', // Adjusted foods are less certain
    note: cookingMethod 
      ? `${cookingMethod} cooking method applied to ${matchedDbFood}`
      : `Raw/base food nutrition used`,
  };
}

module.exports = {
  COOKING_METHODS,
  detectCookingMethod,
  extractBaseFoodName,
  adjustForCookingMethod,
  generateFoodSearchPatterns,
  createCookingMetadata,
};
