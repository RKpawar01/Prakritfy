/**
 * Ingredient Extractor Utility
 * 
 * Extracts main ingredients from compound food descriptions like "chicken curry"
 * and provides alternative search terms for better database matching.
 * 
 * Examples:
 * - "chicken curry" → ["chicken", "curry", "chicken"]
 * - "grilled salmon" → ["salmon", "grilled"]
 * - "brown rice" → ["rice", "brown"]
 */

// Adjectives that describe preparation but aren't the main ingredient
const PREPARATION_ADJECTIVES = new Set([
  "roasted",
  "grilled",
  "fried",
  "boiled",
  "steamed",
  "baked",
  "raw",
  "cooked",
  "fresh",
  "dried",
  "frozen",
  "canned",
  "caramelized",
  "caramelised",
  "sautéed",
  "sauteed",
  "blanched",
  "braised",
  "broiled",
  "poached",
  "simmered",
  "stewed",
  "charred",
  "toasted",
  "roasted",
  "melted",
  "sliced",
  "diced",
  "shredded",
  "minced",
  "chopped",
  "ground",
  "whole",
  "halved",
  "sliced",
  "peeled",
  "unpeeled",
  "organic",
  "natural",
  "pure",
  "sweet",
  "hot",
  "mild",
  "spicy",
  "dark",
  "light",
  "white",
  "brown",
  "red",
  "green",
  "yellow",
  "pink",
]);

// Common cuisines and dish types that modify but aren't the main ingredient
const CUISINE_MODIFIERS = new Set([
  "curry",
  "pad thai",
  "thai",
  "indian",
  "mexican",
  "chinese",
  "japanese",
  "korean",
  "italian",
  "french",
  "spanish",
  "greek",
  "vietnamese",
  "thai",
  "asian",
  "mediterranean",
  "fusion",
  "sandwich",
  "salad",
  "soup",
  "stew",
  "wrap",
  "roll",
  "skewer",
  "kabob",
  "kebab",
  "pasta",
  "noodles",
  "rice",
  "grain",
  "bowl",
  "plate",
  "platter",
  "special",
  "deluxe",
  "supreme",
  "combo",
  "meal",
  "entree",
  "appetizer",
  "dessert",
  "burger",
  "pizza",
  "sandwich",
]);

/**
 * Extract main ingredients and alternative search terms from a food description
 * 
 * @param {string} foodName - The food name/description (e.g., "100g chicken curry")
 * @returns {object} { mainIngredient, allTerms, searchTerms }
 *   - mainIngredient: The primary ingredient (e.g., "chicken")
 *   - allTerms: All words from the food name
 *   - searchTerms: Array of suggested database search terms, ordered by priority
 */
function extractIngredients(foodName) {
  const normalized = String(foodName || "")
    .toLowerCase()
    .trim()
    // Remove common filler words and punctuation
    .replace(/\b(and|or|with|in|a|an|the|served|made|prepared)\b/gi, " ")
    .replace(/[,;:'']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return {
      mainIngredient: foodName,
      allTerms: [],
      searchTerms: [foodName],
    };
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return {
      mainIngredient: foodName,
      allTerms: [],
      searchTerms: [foodName],
    };
  }

  // If only one word, use it as main ingredient
  if (words.length === 1) {
    return {
      mainIngredient: words[0],
      allTerms: words,
      searchTerms: [words[0], foodName],
    };
  }

  // Multi-word analysis: find main ingredient by excluding modifiers
  let mainIngredient = null;
  const nonModifierWords = [];

  for (const word of words) {
    const isModifier = PREPARATION_ADJECTIVES.has(word) || CUISINE_MODIFIERS.has(word);
    if (!isModifier) {
      nonModifierWords.push(word);
      if (!mainIngredient) {
        mainIngredient = word; // First non-modifier is likely the main ingredient
      }
    }
  }

  // If all words were modifiers, use the last word as main ingredient
  if (!mainIngredient) {
    mainIngredient = words[words.length - 1];
  }

  // Build search terms in priority order
  const searchTerms = [];

  // Priority 1: Main ingredient (e.g., "chicken")
  if (mainIngredient && !searchTerms.includes(mainIngredient)) {
    searchTerms.push(mainIngredient);
  }

  // Priority 2: Non-modifier words (e.g., ["chicken", "rice"])
  for (const word of nonModifierWords) {
    if (!searchTerms.includes(word)) {
      searchTerms.push(word);
    }
  }

  // Priority 3: Original food name for fallback
  if (!searchTerms.includes(foodName)) {
    searchTerms.push(foodName);
  }

  // Priority 4: Normalized version
  if (!searchTerms.includes(normalized) && normalized !== foodName) {
    searchTerms.push(normalized);
  }

  return {
    mainIngredient,
    allTerms: words,
    searchTerms,
  };
}

/**
 * Get simplified search term from a compound food name
 * Example: "chicken curry" → "chicken"
 * 
 * @param {string} foodName - The food name
 * @returns {string} The main ingredient to search for
 */
function getMainIngredient(foodName) {
  return extractIngredients(foodName).mainIngredient;
}

/**
 * Get all search terms to try, in priority order
 * Example: "chicken curry" → ["chicken", "curry"]
 * 
 * @param {string} foodName - The food name
 * @returns {array} Search terms ordered by priority
 */
function getSearchTerms(foodName) {
  return extractIngredients(foodName).searchTerms;
}

module.exports = {
  extractIngredients,
  getMainIngredient,
  getSearchTerms,
};
