/**
 * Enhanced Food Input Parser with Strict Validation
 * Prevents bad matches and ensures safe nutrition data
 * 
 * Features:
 * - Strict unit conversion
 * - Beverage-safe handling  
 * - Quantity extraction
 * - Normalization
 * - Detailed logging
 */

const UNIT_CONVERSIONS = {
  // grams
  g: 1,
  gram: 1,
  grams: 1,
  gm: 1,
  gms: 1,

  // milliliters
  ml: 0.95, // 1ml ≈ 0.95g for most liquids
  milliliter: 0.95,
  milliliters: 0.95,

  // liters
  l: 950,
  liter: 950,
  liters: 950,

  // cups (US standard: 240ml)
  cup: 240,
  cups: 240,
  c: 240,

  // glasses (standard: 200ml)
  glass: 200,
  glasses: 200,
  glassful: 200,

  // bowls (standard: 300ml)
  bowl: 300,
  bowls: 300,

  // tablespoon
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,

  // teaspoon
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,

  // pieces/items
  piece: 1,
  pieces: 1,
  item: 1,
  items: 1,
};

const BEVERAGE_KEYWORDS = [
  "milk", "juice", "water", "tea", "coffee", "cola", "coke", "soda",
  "drink", "beverage", "smoothie", "shake", "lassi", "buttermilk",
  "coconut water", "nariyal pani", "curd", "dahi", "yogurt", "broth",
  "soup", "sauce", "gravy", "curry", "dal", "lentil water"
];

const BEVERAGE_UNIT_MAP = {
  ml: "ml",
  l: "ml",
  glass: "ml",
  cup: "ml",
};

/**
 * Parse food input: "100g paneer" or "1 glass milk" -> {quantity, unit, foodName}
 */
function enhancedParseFoodInput(input) {
  const originalInput = input.trim();
  let text = originalInput.toLowerCase();

  // Remove extra spaces
  text = text.replace(/\s+/g, " ").trim();

  // Pattern: quantity + unit + food name
  // Examples: "100g paneer", "1 glass milk", "2 boiled eggs"
  const quantityPattern = /^(\d+(?:\.\d+)?)\s*([a-z]+)?\s+(.+)$/i;
  const match = originalInput.match(quantityPattern);

  if (match) {
    const quantity = parseFloat(match[1]);
    const unitRaw = (match[2] || "").trim().toLowerCase();
    const foodName = match[3].trim();

    // Normalize unit
    const unit = normalizeUnit(unitRaw);

    if (unit && quantity > 0) {
      return {
        originalInput,
        success: true,
        quantity,
        unitRaw,
        unit,
        foodName: normalizeFoodName(foodName),
        grams: convertToGrams(quantity, unit),
        isBeverage: detectBeverage(foodName),
      };
    }
  }

  // No quantity found - just food name
  return {
    originalInput,
    success: false,
    quantity: null,
    unit: null,
    foodName: normalizeFoodName(text),
    grams: null,
    isBeverage: detectBeverage(text),
    error: "Could not parse quantity and unit",
  };
}

/**
 * Normalize unit to standard form
 */
function normalizeUnit(unitRaw) {
  if (!unitRaw || unitRaw.length === 0) return null;

  const normalized = unitRaw.toLowerCase().trim();

  // Check exact match first
  if (UNIT_CONVERSIONS[normalized] !== undefined) {
    return normalized;
  }

  // Try partial matches
  for (const [key, value] of Object.entries(UNIT_CONVERSIONS)) {
    if (normalized.startsWith(key.substring(0, 2))) {
      return key;
    }
  }

  return null;
}

/**
 * Convert quantity + unit to grams
 */
function convertToGrams(quantity, unit) {
  if (!unit || !UNIT_CONVERSIONS[unit]) {
    return null;
  }

  const factor = UNIT_CONVERSIONS[unit];
  return Math.round(quantity * factor * 100) / 100;
}

/**
 * Detect if food is a beverage
 */
function detectBeverage(foodName) {
  const lower = foodName.toLowerCase();
  return BEVERAGE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Normalize food name: handle typos, common variants
 */
function normalizeFoodName(foodName) {
  let normalized = foodName.toLowerCase().trim();

  // Handle specific misspellings
  const corrections = {
    "coco coal": false, // Never match this - it's junk
    "coca cola": "coca cola",
    "coco cola": "coca cola",
    "cok": "coca cola",
    "coke": "coca cola",
    "coconut water": "coconut water",
    "nariyal": "coconut water",
    "nariyal pani": "coconut water",
    "ande": "boiled egg",
    "anda": "boiled egg",
    "chawal": "rice",
    "roti": "roti",
    "chappati": "roti",
    "dal": "dal",
    "paneer": "paneer",
    "milk": "milk",
    "doodh": "milk",
    "dahi": "yogurt",
    "curd": "yogurt",
    "lassi": "lassi",
  };

  // Check for exact corrections
  for (const [typo, correction] of Object.entries(corrections)) {
    if (normalized === typo) {
      if (correction === false) {
        return null; // Block this search
      }
      return correction;
    }
  }

  // Remove quantity words
  normalized = normalized
    .replace(/^\d+\s*(piece|pieces|glass|bowl|cup|tbsp|tsp)?\s*/i, "")
    .trim();

  // Remove common prefixes/suffixes
  normalized = normalized
    .replace(/\b(boiled|fried|cooked|raw|steamed|grilled|baked|roasted|plain|simple)\s+/i, "")
    .replace(/\s+(curry|fry|masala|sabzi|bhaji)$/i, "")
    .trim();

  return normalized;
}

/**
 * Validate nutrition values
 * Returns {valid: boolean, errors: string[]}
 */
function validateNutrition(nutrition, isBeverage = false) {
  const errors = [];

  if (!nutrition) {
    return { valid: false, errors: ["No nutrition data provided"] };
  }

  const {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    saturatedFat,
  } = nutrition;

  // Check for required fields
  if (calories === undefined || calories === null) {
    errors.push("Calories is required");
  }
  if (carbs === undefined || carbs === null) {
    errors.push("Carbs is required");
  }
  if (protein === undefined || protein === null) {
    errors.push("Protein is required");
  }
  if (fat === undefined || fat === null) {
    errors.push("Fat is required");
  }

  // Check for negative values
  if (calories < 0) errors.push("Calories cannot be negative");
  if (protein < 0) errors.push("Protein cannot be negative");
  if (carbs < 0) errors.push("Carbs cannot be negative");
  if (fat < 0) errors.push("Fat cannot be negative");
  if (fiber && fiber < 0) errors.push("Fiber cannot be negative");
  if (sugar && sugar < 0) errors.push("Sugar cannot be negative");

  // Check nutrition logic
  if (fiber && carbs && fiber > carbs) {
    errors.push(`Fiber (${fiber}g) cannot exceed carbs (${carbs}g)`);
  }

  if (sugar && carbs && sugar > carbs) {
    errors.push(`Sugar (${sugar}g) cannot exceed carbs (${carbs}g)`);
  }

  if (saturatedFat && fat && saturatedFat > fat) {
    errors.push(
      `Saturated fat (${saturatedFat}g) cannot exceed total fat (${fat}g)`
    );
  }

  // Validate calories from macros (approximate)
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
  const calculatedCals = protein * 4 + carbs * 4 + fat * 9;
  const difference = Math.abs(calories - calculatedCals);
  const tolerance = Math.max(calculatedCals * 0.15, 30); // 15% tolerance or 30 cal

  if (difference > tolerance) {
    errors.push(
      `Calories (${calories}) don't match macros (calculated: ${Math.round(calculatedCals)}cal). Difference: ${Math.round(difference)}cal`
    );
  }

  // Beverage specific checks
  if (isBeverage) {
    // Beverages (100ml baseline) shouldn't be too high
    if (calories > 100) {
      errors.push(
        `Beverage has high calories (${calories}/100ml). Check if this is realistic - sodas ~42cal, juice ~44cal, milk ~61cal`
      );
    }
    if (carbs > 15) {
      errors.push(
        `Beverage has high carbs (${carbs}g/100ml). Check if juice or sweetened drink`
      );
    }
  }

  // Check if all values are zero (impossible)
  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    errors.push("All nutrition values cannot be zero");
  }

  return {
    valid: errors.length === 0,
    errors,
    warning: `Calculated calories: ${Math.round(calculatedCals)}, Actual: ${calories}, Diff: ${Math.round(difference)}`,
  };
}

/**
 * Scale nutrition from per-100g to actual serving weight
 */
function scaleNutrition(nutritionPer100g, grams) {
  if (!nutritionPer100g || grams <= 0) {
    return null;
  }

  const factor = grams / 100;
  const scaled = {};

  for (const [key, value] of Object.entries(nutritionPer100g)) {
    if (typeof value === "number") {
      scaled[key] = Math.round(value * factor * 100) / 100;
    }
  }

  return scaled;
}

/**
 * Log food lookup action for debugging
 */
function logFoodLookup(actionData) {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    ...actionData,
  };

  // In production, send to logging service
  console.log("[FOOD_LOOKUP]", JSON.stringify(log, null, 2));

  return log;
}

module.exports = {
  enhancedParseFoodInput,
  normalizeUnit,
  convertToGrams,
  detectBeverage,
  normalizeFoodName,
  validateNutrition,
  scaleNutrition,
  logFoodLookup,
  UNIT_CONVERSIONS,
  BEVERAGE_KEYWORDS,
};
