/**
 * CANONICAL NUTRIENT SCHEMA AND TRANSFORMATION UTILITIES
 * 
 * Purpose: Define a single canonical nutrient object structure across the entire pipeline.
 * This prevents silent data loss and handles missing nutrients properly.
 * 
 * Key Principle: NEVER default missing values to 0.
 * - Use null for unknown/missing data
 * - Use 0 ONLY when the source explicitly states the nutrient is 0
 * - In UI layer, show "N/A" for null values
 */

/**
 * CANONICAL NUTRIENT SCHEMA
 * This is the single source of truth for nutrient structure
 */
const CANONICAL_NUTRIENT_SCHEMA = {
  // Macronutrients (always required)
  calories_kcal: null,      // number
  protein_g: null,          // number
  carbs_g: null,            // number
  fat_g: null,              // number
  fiber_g: null,            // number
  sugar_g: null,            // number
  saturated_fat_g: null,    // number

  // Micronutrients (may be null if unavailable)
  calcium_mg: null,
  iron_mg: null,
  magnesium_mg: null,
  potassium_mg: null,
  sodium_mg: null,
  zinc_mg: null,
  vitamin_a_mcg: null,
  vitamin_b1_mg: null,
  vitamin_b2_mg: null,
  vitamin_b3_mg: null,
  vitamin_b6_mg: null,
  vitamin_b12_mcg: null,
  vitamin_c_mg: null,
  vitamin_d_mcg: null,
  vitamin_e_mg: null,
  vitamin_k_mcg: null,
  folate_mcg: null,
};

/**
 * Creates a clean canonical nutrient object
 * All unspecified values are null (unknown), not 0
 * @param {Object} data - Partial nutrient data
 * @returns {Object} Canonical nutrient object with nulls for missing fields
 */
function createCanonicalNutrient(data = {}) {
  const nutrient = JSON.parse(JSON.stringify(CANONICAL_NUTRIENT_SCHEMA));
  
  // Merge provided data, but only store non-undefined values
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      nutrient[key] = Number(data[key]);
      // Validate no negative values
      if (nutrient[key] < 0) {
        nutrient[key] = null; // Invalid value becomes null
      }
    }
  });

  return nutrient;
}

/**
 * Maps database Food document to canonical nutrient format
 * CRITICAL: Preserves null for missing micronutrients instead of replacing with 0
 * 
 * @param {Object} foodDoc - MongoDB Food document
 * @returns {Object} Canonical nutrient object
 */
function mapDbFoodToCanonical(foodDoc) {
  const macro = foodDoc.nutrition_per_100g || {};
  const micro = foodDoc.micronutrients_per_100g || {};

  return createCanonicalNutrient({
    calories_kcal: macro.calories,
    protein_g: macro.protein,
    carbs_g: macro.carbs,
    fat_g: macro.fat,
    fiber_g: macro.fiber,
    sugar_g: macro.sugar,
    saturated_fat_g: macro.saturatedFat,
    
    // IMPORTANT: Use the exact value from DB, NOT defaulting to 0
    calcium_mg: micro.calcium ?? null,
    iron_mg: micro.iron ?? null,
    magnesium_mg: micro.magnesium ?? null,
    potassium_mg: micro.potassium ?? null,
    sodium_mg: micro.sodium ?? null,
    zinc_mg: micro.zinc ?? null,
    vitamin_a_mcg: micro.vitaminA ?? null,
    vitamin_b1_mg: micro.vitaminB1 ?? null,
    vitamin_b2_mg: micro.vitaminB2 ?? null,
    vitamin_b3_mg: micro.vitaminB3 ?? null,
    vitamin_b6_mg: micro.vitaminB6 ?? null,
    vitamin_b12_mcg: micro.vitaminB12 ?? null,
    vitamin_c_mg: micro.vitaminC ?? null,
    vitamin_d_mcg: micro.vitaminD ?? null,
    vitamin_e_mg: micro.vitaminE ?? null,
    vitamin_k_mcg: micro.vitaminK ?? null,
    folate_mcg: micro.folate ?? null,
  });
}

/**
 * Maps AI-generated nutrition to canonical format
 * AI may provide partial data (only macros), preserve nulls for missing micros
 * 
 * @param {Object} aiResult - Result from analyzeMeal() API
 * @returns {Object} Canonical nutrient object
 */
function mapAiResponseToCanonical(aiResult) {
  const macros = aiResult.macros || {};
  const vitamins = aiResult.vitamins || {};
  const minerals = aiResult.minerals || {};

  return createCanonicalNutrient({
    calories_kcal: macros.calories,
    protein_g: macros.protein,
    carbs_g: macros.carbs,
    fat_g: macros.fat,
    fiber_g: macros.fiber,
    sugar_g: macros.sugar,
    saturated_fat_g: macros.saturatedFat,
    
    calcium_mg: minerals.calcium ?? null,
    iron_mg: minerals.iron ?? null,
    magnesium_mg: minerals.magnesium ?? null,
    potassium_mg: minerals.potassium ?? null,
    sodium_mg: minerals.sodium ?? null,
    zinc_mg: minerals.zinc ?? null,
    vitamin_a_mcg: vitamins.vitaminA ?? null,
    vitamin_b1_mg: vitamins.vitaminB1 ?? null,
    vitamin_b2_mg: vitamins.vitaminB2 ?? null,
    vitamin_b3_mg: vitamins.vitaminB3 ?? null,
    vitamin_b6_mg: vitamins.vitaminB6 ?? null,
    vitamin_b12_mcg: vitamins.vitaminB12 ?? null,
    vitamin_c_mg: vitamins.vitaminC ?? null,
    vitamin_d_mcg: vitamins.vitaminD ?? null,
    vitamin_e_mg: vitamins.vitaminE ?? null,
    vitamin_k_mcg: vitamins.vitaminK ?? null,
    folate_mcg: vitamins.folate ?? null,
  });
}

/**
 * SAFE MERGE: Merges two nutrient objects without overwriting existing data
 * KEY PRINCIPLE: If target has a non-null value, KEEP IT. Only fill gaps from source.
 * 
 * Use Case: Database food has minerals but AI only provided macros
 * Should: Merge macros from AI, keep database minerals
 * 
 * @param {Object} target - Primary nutrient object (e.g., from database)
 * @param {Object} source - Secondary nutrient object (e.g., from AI fallback)
 * @returns {Object} Merged canonical nutrient object
 */
function safeMergeNutrients(target, source) {
  const merged = JSON.parse(JSON.stringify(target));
  
  Object.keys(source).forEach(key => {
    // Only use source value if target is null/missing
    if (merged[key] === null && source[key] !== null) {
      merged[key] = source[key];
    }
  });

  return merged;
}

/**
 * SCALING: Multiplies all nutrient values by a weight factor
 * CRITICAL: Scales ALL nutrients, including micronutrients
 * Formula: scaled = per_100g * (actual_grams / 100)
 * 
 * @param {Object} per100 - Canonical nutrient object (per 100g basis)
 * @param {number} grams - Total grams to scale to
 * @returns {Object} Scaled nutrient object with null preserved for missing data
 */
function scaleNutrientsByWeight(per100, grams) {
  const scaleFactor = grams / 100;
  const scaled = JSON.parse(JSON.stringify(CANONICAL_NUTRIENT_SCHEMA));

  Object.keys(per100).forEach(key => {
    if (per100[key] !== null) {
      const value = per100[key] * scaleFactor;
      // Round to 2 decimal places
      scaled[key] = Math.round(value * 100) / 100;
    }
    // If null, leave as null (unknown data remains unknown)
  });

  return scaled;
}

/**
 * AGGREGATION: Sums multiple nutrient objects for a complete meal
 * Handles nulls properly: only sums known values, preserves nulls
 * 
 * @param {Array<Object>} nutrients - Array of canonical nutrient objects
 * @returns {Object} Aggregated nutrient object
 */
function aggregateNutrients(nutrients) {
  const aggregated = JSON.parse(JSON.stringify(CANONICAL_NUTRIENT_SCHEMA));

  nutrients.forEach(nutrient => {
    Object.keys(aggregated).forEach(key => {
      if (nutrient[key] !== null && aggregated[key] !== null) {
        aggregated[key] += nutrient[key];
      } else if (nutrient[key] !== null && aggregated[key] === null) {
        aggregated[key] = nutrient[key];
      }
      // If both null, stays null
    });
  });

  // Round all values
  Object.keys(aggregated).forEach(key => {
    if (aggregated[key] !== null) {
      aggregated[key] = Math.round(aggregated[key] * 100) / 100;
    }
  });

  return aggregated;
}

/**
 * Recalculates calories from macros using standard formula
 * calories = (protein * 4) + (carbs * 4) + (fat * 9)
 * 
 * @param {Object} nutrient - Canonical nutrient object
 * @returns {Object} Same nutrient object with recalculated calories
 */
function recalculateCalories(nutrient) {
  // Only fill in calories if missing/null/zero
  // Listed calories from verified databases are more accurate than P*4+C*4+F*9
  if (nutrient.calories_kcal !== null && nutrient.calories_kcal > 0) {
    return nutrient; // Keep the listed value
  }

  const protein = nutrient.protein_g ?? 0;
  const carbs = nutrient.carbs_g ?? 0;
  const fat = nutrient.fat_g ?? 0;

  const calculatedCals = (protein * 4) + (carbs * 4) + (fat * 9);
  
  if (isFinite(calculatedCals)) {
    nutrient.calories_kcal = Math.round(calculatedCals * 100) / 100;
  }


  return nutrient;
}

/**
 * Converts canonical nutrient object to display format for API responses
 * Groups nutrients by category, shows "N/A" for unavailable data
 * 
 * @param {Object} nutrient - Canonical nutrient object
 * @returns {Object} Display-formatted nutrient object
 */
function formatNutrientForDisplay(nutrient) {
  const formatValue = (v) => v === null ? null : Math.round(v * 100) / 100;

  return {
    macros: {
      calories_kcal: formatValue(nutrient.calories_kcal),
      protein_g: formatValue(nutrient.protein_g),
      carbs_g: formatValue(nutrient.carbs_g),
      fat_g: formatValue(nutrient.fat_g),
      fiber_g: formatValue(nutrient.fiber_g),
      sugar_g: formatValue(nutrient.sugar_g),
      saturated_fat_g: formatValue(nutrient.saturated_fat_g),
    },
    minerals: {
      calcium_mg: formatValue(nutrient.calcium_mg),
      iron_mg: formatValue(nutrient.iron_mg),
      magnesium_mg: formatValue(nutrient.magnesium_mg),
      potassium_mg: formatValue(nutrient.potassium_mg),
      sodium_mg: formatValue(nutrient.sodium_mg),
      zinc_mg: formatValue(nutrient.zinc_mg),
    },
    vitamins: {
      vitamin_a_mcg: formatValue(nutrient.vitamin_a_mcg),
      vitamin_b1_mg: formatValue(nutrient.vitamin_b1_mg),
      vitamin_b2_mg: formatValue(nutrient.vitamin_b2_mg),
      vitamin_b3_mg: formatValue(nutrient.vitamin_b3_mg),
      vitamin_b6_mg: formatValue(nutrient.vitamin_b6_mg),
      vitamin_b12_mcg: formatValue(nutrient.vitamin_b12_mcg),
      vitamin_c_mg: formatValue(nutrient.vitamin_c_mg),
      vitamin_d_mcg: formatValue(nutrient.vitamin_d_mcg),
      vitamin_e_mg: formatValue(nutrient.vitamin_e_mg),
      vitamin_k_mcg: formatValue(nutrient.vitamin_k_mcg),
      folate_mcg: formatValue(nutrient.folate_mcg),
    },
  };
}

/**
 * Validates that final nutrient values are reasonable
 * Catches impossible values before saving
 * 
 * @param {Object} nutrient - Canonical nutrient object
 * @param {string} foodName - Food name for error messages
 * @returns {boolean} True if valid, false if impossible values found
 */
function validateNutrientValues(nutrient, foodName) {
  const checks = [
    { field: 'protein_g', min: 0, max: 100, name: 'Protein' },
    { field: 'carbs_g', min: 0, max: 100, name: 'Carbs' },
    { field: 'fat_g', min: 0, max: 100, name: 'Fat' },
    { field: 'fiber_g', min: 0, max: 100, name: 'Fiber' },
    { field: 'sugar_g', min: 0, max: 100, name: 'Sugar' },
    { field: 'calories_kcal', min: 0, max: 900, name: 'Calories' },
  ];

  for (const check of checks) {
    const value = nutrient[check.field];
    if (value !== null && (value < check.min || value > check.max)) {
      console.warn(`Validation warning for ${foodName}: ${check.name} = ${value} (expected ${check.min}-${check.max})`);
      return false;
    }
  }

  return true;
}

/**
 * SANITY CHECK: Validates that food nutrition composition makes sense
 * Detects obviously wrong matches (e.g., "meat" matched to high-carb "keema curry")
 * 
 * Returns validation result with issues array
 * 
 * @param {string} userInput - What user typed (e.g., "grilled chicken")
 * @param {string} matchedFoodName - What was matched in database
 * @param {Object} nutrition - Canonical nutrient object (per 100g)
 * @returns {Object} {valid: bool, confidence: string, issues: [string]}
 */
function performSanityCheck(userInput, matchedFoodName, nutrition) {
  const issues = [];
  const input = String(userInput || '').toLowerCase();
  const matched = String(matchedFoodName || '').toLowerCase();
  
  // Skip checks if nutrition is incomplete
  const carbs = nutrition.carbs_g ?? null;
  const protein = nutrition.protein_g ?? null;
  const fat = nutrition.fat_g ?? null;
  const calories = nutrition.calories_kcal ?? null;

  // RULE 1: Plain meat should have low carbs
  const isPlainMeatInput = /\b(meat|lamb|chicken|beef|fish|pork|turkey)\b/.test(input) &&
                          !/\b(curry|keema|biryani|kabab|kebab|masala|fry|sauce|gravy)\b/.test(input);
  if (isPlainMeatInput && carbs !== null && carbs > 3) {
    issues.push(`High carbs (${carbs}g) for plain meat - suggests curry/mixed dish match`);
  }

  // RULE 2: Plain meat should have meaningful protein
  const plainMeatNormal = protein !== null && protein >= 15;
  if (isPlainMeatInput && protein !== null && protein < 8) {
    issues.push(`Low protein (${protein}g) for meat - doesn't match typical meat composition`);
  }

  // RULE 3: Plain eggs should have protein 10-15g per 100g
  const isEggInput = /\b(egg|eggs)\b/.test(input);
  if (isEggInput && protein !== null && (protein < 10 || protein > 16)) {
    issues.push(`Unusual protein (${protein}g) for eggs - expected 10-15g per 100g`);
  }

  // RULE 4: Plain eggs should have low carbs <2g
  if (isEggInput && carbs !== null && carbs > 2.5) {
    issues.push(`High carbs (${carbs}g) for eggs - eggs should have <2g carbs per 100g`);
  }

  // RULE 5: Rice/grains should have carbs 20-35g per 100g (cooked)
  const isRiceInput = /\b(rice|grain|pasta|noodle|oat|barley|wheat)\b/.test(input) &&
                     !/\b(flour|powder|bran)\b/.test(input);
  if (isRiceInput && carbs !== null && (carbs < 12 || carbs > 80)) {
    issues.push(`Unusual carbs (${carbs}g) for rice/grain - cooked should be 20-35g, raw 70-80g per 100g`);
  }

  // RULE 6: Fruits should be carb-heavy with low protein
  const isFruitInput = /\b(apple|banana|orange|grape|berry|mango|papaya|pineapple|peach|kiwi|strawberry)\b/.test(input);
  if (isFruitInput && protein !== null && protein > 3) {
    issues.push(`High protein (${protein}g) for fruit - fruits typically have <2g protein`);
  }
  
  if (isFruitInput && carbs !== null && carbs < 8) {
    issues.push(`Low carbs (${carbs}g) for fruit - fruits typically have 10-20g carbs per 100g`);
  }

  // RULE 7: Vegetables should be low carb, low protein, high fiber
  const isVegetableInput = /\b(broccoli|spinach|carrot|lettuce|tomato|cucumber|capsicum|cabbage|peas)\b/.test(input);
  if (isVegetableInput && carbs !== null && carbs > 12) {
    issues.push(`High carbs (${carbs}g) for vegetable - typical vegetables have <10g carbs`);
  }

  // RULE 8: Presence of "fried" should correlate with higher fat
  const isFriedInput = /\b(fried|deep.fried|pan.fried)\b/.test(input);
  if (isFriedInput && fat !== null && fat < 5) {
    issues.push(`Low fat (${fat}g) for fried food - fried items should have 8-20g fat per 100g`);
  }

  // RULE 9: Milk/dairy should have protein 3-4g per 100ml
  const isDairyInput = /\b(milk|yogurt|curd|cheese|cream)\b/.test(input) && !/\b(powder|concentrate)\b/.test(input);
  if (isDairyInput && protein !== null && (protein < 2 || protein > 8)) {
    issues.push(`Unusual protein (${protein}g) for dairy - milk should have 3-4g per 100ml`);
  }

  // Determine confidence level
  const confidence = issues.length === 0 ? "high" : issues.length <= 2 ? "medium" : "low";
  const valid = issues.length === 0; // Only valid if no issues

  return {
    valid,
    confidence,
    issues,
  };
}

module.exports = {
  CANONICAL_NUTRIENT_SCHEMA,
  createCanonicalNutrient,
  mapDbFoodToCanonical,
  mapAiResponseToCanonical,
  safeMergeNutrients,
  scaleNutrientsByWeight,
  aggregateNutrients,
  recalculateCalories,
  formatNutrientForDisplay,
  validateNutrientValues,
  performSanityCheck,
};
