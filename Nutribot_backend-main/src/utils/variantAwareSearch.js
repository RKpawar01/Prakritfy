/**
 * Variant-Aware Food Search Utility
 * 
 * Enhances food search to leverage preparation_state and cooking_method
 * for better food matching and nutrition accuracy.
 */

const { normalizeFoodName } = require('./nutritionEngine');

/**
 * Infer preparation_state from user input
 * Examples:
 *   "boiled rice" → "cooked"
 *   "raw milk" → "raw"
 *   "fried chicken" → "cooked"
 */
function inferPreparationFromInput(userInput) {
  const normalized = normalizeFoodName(userInput);

  // Check for explicit preparation indicators
  const cookedKeywords = [
    'boiled', 'cooked', 'fried', 'grilled', 'roasted',
    'steamed', 'baked', 'sauteed', 'curry', 'tandoor'
  ];

  const rawKeywords = ['raw', 'uncooked', 'fresh', 'plain'];

  const readyToEatKeywords = [
    'packaged', 'canned', 'frozen', 'instant', 'processed'
  ];

  for (const keyword of cookedKeywords) {
    if (normalized.includes(keyword)) {
      return 'cooked';
    }
  }

  for (const keyword of rawKeywords) {
    if (normalized.includes(keyword)) {
      return 'raw';
    }
  }

  for (const keyword of readyToEatKeywords) {
    if (normalized.includes(keyword)) {
      return 'ready_to_eat';
    }
  }

  // Default: no explicit preparation specified
  return null;
}

/**
 * Infer cooking_method from user input
 * Examples:
 *   "boiled eggs" → "boiled"
 *   "tandoori chicken" → "grilled"
 */
function infSerCookingMethodFromInput(userInput) {
  const normalized = normalizeFoodName(userInput);

  const methodMappings = {
    'boiled': ['boil', 'boiled', 'steamed'],
    'fried': ['fried', 'fry', 'deep-fried', 'oil'],
    'grilled': ['grill', 'grilled', 'tandoor', 'tandoori', 'roast', 'roasted'],
    'baked': ['bake', 'baked', 'oven'],
    'sauteed': ['saute', 'sauteed', 'stir-fry', 'sauté'],
    'curried': ['curry', 'curried', 'masala'],
  };

  for (const [method, keywords] of Object.entries(methodMappings)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return method;
      }
    }
  }

  return null;
}

/**
 * Extract base food name from user input
 * Removes preparation-related keywords to get the core food
 * 
 * Examples:
 *   "boiled eggs" → "eggs"
 *   "fried chicken breast" → "chicken breast"
 *   "raw spinach" → "spinach"
 */
function extractBaseFoodName(userInput) {
  let normalized = normalizeFoodName(userInput);

  // Remove preparation-related keywords
  const preparationKeywords = [
    'boiled', 'cooked', 'fried', 'grilled', 'roasted', 'steamed',
    'baked', 'sauteed', 'curry', 'curried', 'tandoor', 'tandoori',
    'oil', 'ghee', 'butter', 'raw', 'uncooked', 'fresh', 'plain',
    'packaged', 'canned', 'frozen', 'instant', 'processed'
  ];

  for (const keyword of preparationKeywords) {
    normalized = normalized.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), ' ');
  }

  // Clean up whitespace
  normalized = normalized
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Build a search query with variant awareness
 * Returns MongoDB query that can be used with Food.findOne() or Food.find()
 */
function buildVariantAwareQuery(userInput) {
  const baseFoodName = extractBaseFoodName(userInput);
  const inferredPreparation = inferPreparationFromInput(userInput);
  const inferredCookingMethod = infSerCookingMethodFromInput(userInput);

  const query = {
    $or: [
      // Try exact name match
      { name: { $regex: new RegExp(`^${baseFoodName}$`, 'i') } },
      // Try aliases
      { aliases: { $elemMatch: { $regex: new RegExp(`^${baseFoodName}$`, 'i') } } },
      // Try contains match
      { name: { $regex: baseFoodName, $options: 'i' } },
      // Try search tokens
      { search_tokens: baseFoodName },
    ],
  };

  // Add preparation_state filter if inferred
  if (inferredPreparation) {
    query.preparation_state = inferredPreparation;
  }

  // Add cooking_method filter if inferred
  if (inferredCookingMethod) {
    query.cooking_method = inferredCookingMethod;
  }

  return {
    query,
    metadata: {
      baseFoodName,
      inferredPreparation,
      inferredCookingMethod,
    },
  };
}

/**
 * Score a food match based on variant accuracy
 * Higher score means better match
 */
function scoreVariantMatch(food, userInput, inferredPreparation, inferredCookingMethod) {
  let score = 1.0; // Base score

  // +0.3 if preparation_state matches inferred
  if (inferredPreparation && food.preparation_state === inferredPreparation) {
    score += 0.3;
  }

  // +0.2 if cooking_method matches inferred
  if (inferredCookingMethod && food.cooking_method === inferredCookingMethod) {
    score += 0.2;
  }

  // -0.1 if preparation seems mismatched
  if (inferredPreparation && food.preparation_state !== inferredPreparation) {
    score -= 0.1;
  }

  // -0.05 if cooking_method seems mismatched
  if (inferredCookingMethod && food.cooking_method !== inferredCookingMethod) {
    score -= 0.05;
  }

  return Math.max(0.5, score); // Minimum 0.5 score
}

module.exports = {
  inferPreparationFromInput,
  infSerCookingMethodFromInput,
  extractBaseFoodName,
  buildVariantAwareQuery,
  scoreVariantMatch,
};
