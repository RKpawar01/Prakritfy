/**
 * Nutrition data validation and normalization utilities.
 * Ensures consistent data structure and type safety across the application.
 */

/**
 * Define the complete nutrition schema structure
 */
const NUTRITION_SCHEMA = {
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
  },
  vitamins: {
    vitaminA: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB6: 0,
    vitaminB12: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    folate: 0,
  },
  minerals: {
    calcium: 0,
    iron: 0,
    magnesium: 0,
    potassium: 0,
    sodium: 0,
    zinc: 0,
  },
};

/**
 * Validates if a nutrition object has all required fields.
 * @param {Object} nutrition - The nutrition object to validate
 * @returns {boolean} true if all required fields exist with valid numbers
 */
function isValidNutrition(nutrition) {
  if (!nutrition || typeof nutrition !== "object") return false;

  // Check macros
  if (!nutrition.macros || typeof nutrition.macros !== "object") return false;
  for (const key in NUTRITION_SCHEMA.macros) {
    if (typeof nutrition.macros[key] !== "number") return false;
  }

  // Check vitamins
  if (!nutrition.vitamins || typeof nutrition.vitamins !== "object") return false;
  for (const key in NUTRITION_SCHEMA.vitamins) {
    if (typeof nutrition.vitamins[key] !== "number") return false;
  }

  // Check minerals
  if (!nutrition.minerals || typeof nutrition.minerals !== "object") return false;
  for (const key in NUTRITION_SCHEMA.minerals) {
    if (typeof nutrition.minerals[key] !== "number") return false;
  }

  return true;
}

/**
 * Normalizes partial nutrition data to complete structure.
 * Fills missing fields with defaults (0).
 * @param {Object} macros - Partial macros object
 * @param {Object} vitamins - Partial vitamins object
 * @param {Object} minerals - Partial minerals object
 * @returns {Object} Complete, validated nutrition structure
 */
function normalizeNutrition(macros = {}, vitamins = {}, minerals = {}) {
  const normalized = JSON.parse(JSON.stringify(NUTRITION_SCHEMA));

  // Normalize macros
  Object.keys(normalized.macros).forEach((key) => {
    const value = macros[key];
    normalized.macros[key] = typeof value === "number" ? value : 0;
  });

  // Normalize vitamins
  Object.keys(normalized.vitamins).forEach((key) => {
    const value = vitamins[key];
    normalized.vitamins[key] = typeof value === "number" ? value : 0;
  });

  // Normalize minerals
  Object.keys(normalized.minerals).forEach((key) => {
    const value = minerals[key];
    normalized.minerals[key] = typeof value === "number" ? value : 0;
  });

  return normalized;
}

/**
 * Validates and cleans raw AI response nutrition data.
 * Ensures all fields are present and numeric.
 * @param {Object} rawNutrition - Raw data from AI service
 * @returns {Object} Cleaned and validated nutrition object
 * @throws {Error} If validation fails critically
 */
function validateAIResponse(rawNutrition) {
  if (!rawNutrition || typeof rawNutrition !== "object") {
    throw new Error("Invalid nutrition data format");
  }

  const normalized = normalizeNutrition(
    rawNutrition.macros,
    rawNutrition.vitamins,
    rawNutrition.minerals
  );

  return normalized;
}

/**
 * Gets empty nutrition data structure (all zeros).
 * Useful for fallback values and initialization.
 * @returns {Object} Complete nutrition structure with all zeros
 */
function getEmptyNutrition() {
  return JSON.parse(JSON.stringify(NUTRITION_SCHEMA));
}

/**
 * Checks if nutrition data has any significant values.
 * @param {Object} nutrition - The nutrition object to check
 * @returns {boolean} true if any macro value is greater than 0
 */
function hasNutritionData(nutrition) {
  if (!nutrition || !nutrition.macros) return false;

  for (const key in nutrition.macros) {
    if (nutrition.macros[key] > 0) return true;
  }

  return false;
}

/**
 * Combines multiple nutrition objects by summing all values.
 * Useful for aggregating meals.
 * @param {Object[]} nutritionArray - Array of nutrition objects
 * @returns {Object} Combined nutrition with summed values
 */
function combineNutrition(nutritionArray) {
  const combined = getEmptyNutrition();

  if (!Array.isArray(nutritionArray) || nutritionArray.length === 0) {
    return combined;
  }

  nutritionArray.forEach((nutrition) => {
    if (!nutrition) return;

    // Combine macros
    if (nutrition.macros) {
      Object.keys(combined.macros).forEach((key) => {
        combined.macros[key] += nutrition.macros[key] || 0;
      });
    }

    // Combine vitamins
    if (nutrition.vitamins) {
      Object.keys(combined.vitamins).forEach((key) => {
        combined.vitamins[key] += nutrition.vitamins[key] || 0;
      });
    }

    // Combine minerals
    if (nutrition.minerals) {
      Object.keys(combined.minerals).forEach((key) => {
        combined.minerals[key] += nutrition.minerals[key] || 0;
      });
    }
  });

  return combined;
}

/**
 * Calculates average nutrition from array of nutrition objects.
 * @param {Object[]} nutritionArray - Array of nutrition objects
 * @returns {Object} Average nutrition values with 2 decimal places
 */
function averageNutrition(nutritionArray) {
  if (!Array.isArray(nutritionArray) || nutritionArray.length === 0) {
    return getEmptyNutrition();
  }

  const combined = combineNutrition(nutritionArray);
  const count = nutritionArray.length;

  const averaged = getEmptyNutrition();

  // Average macros
  Object.keys(averaged.macros).forEach((key) => {
    averaged.macros[key] = parseFloat((combined.macros[key] / count).toFixed(2));
  });

  // Average vitamins
  Object.keys(averaged.vitamins).forEach((key) => {
    averaged.vitamins[key] = parseFloat(
      (combined.vitamins[key] / count).toFixed(2)
    );
  });

  // Average minerals
  Object.keys(averaged.minerals).forEach((key) => {
    averaged.minerals[key] = parseFloat(
      (combined.minerals[key] / count).toFixed(2)
    );
  });

  return averaged;
}

/**
 * Get the schema structure for reference.
 * @returns {Object} Complete nutrition schema
 */
function getSchema() {
  return JSON.parse(JSON.stringify(NUTRITION_SCHEMA));
}

module.exports = {
  NUTRITION_SCHEMA,
  isValidNutrition,
  normalizeNutrition,
  validateAIResponse,
  getEmptyNutrition,
  hasNutritionData,
  combineNutrition,
  averageNutrition,
  getSchema,
};
