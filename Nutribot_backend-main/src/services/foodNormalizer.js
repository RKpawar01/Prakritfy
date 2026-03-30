/**
 * FOOD NORMALIZER - Map variants to canonical names
 * 
 * Converts user input to standardized food names for consistent lookups
 * Handles spelling variations, regional terms, and common aliases
 * 
 * IMPORTANT: Preserves original user input for UI display
 * Only used for database lookups
 */

/**
 * Comprehensive food name mapping for Indian foods
 * Maps: variant → canonical_name
 */
const FOOD_NORMALIZATIONS = {
  // Breads & Grains
  'roti': 'whole wheat chapati',
  'rotis': 'whole wheat chapati',
  'chapati': 'whole wheat chapati',
  'chappati': 'whole wheat chapati',
  'chapatis': 'whole wheat chapati',
  'flatbread': 'whole wheat chapati',
  'wheat bread': 'whole wheat chapati',
  'paratha': 'stuffed wheat paratha',
  'parathas': 'stuffed wheat paratha',
  'aloo paratha': 'stuffed wheat paratha',
  'puri': 'fried wheat puri',
  'puris': 'fried wheat puri',
  'bhature': 'fried wheat bhature',
  'naan': 'naan bread',
  'naans': 'naan bread',
  'white bread': 'white bread sliced',
  'brown bread': 'whole wheat bread',

  'rice': 'white rice boiled',
  'white rice': 'white rice boiled',
  'brown rice': 'brown rice boiled',
  'basmati rice': 'white rice boiled',
  'jasmine rice': 'white rice boiled',
  'pulao': 'rice pilaf',
  'pilaf': 'rice pilaf',
  'biryani': 'rice biryani',

  // Vegetables
  'aloo': 'potato boiled',
  'aloo sabji': 'potato curry indian',
  'potato': 'potato boiled',
  'potatoes': 'potato boiled',
  'boiled potato': 'potato boiled',
  'baked potato': 'potato baked',
  'fried potato': 'french fries',
  'french fries': 'french fries',
  'chips': 'potato chips',

  'spinach': 'spinach boiled',
  'palak': 'spinach boiled',
  'palak paneer': 'spinach paneer curry',

  'broccoli': 'broccoli boiled',
  'cauliflower': 'cauliflower boiled',
  'carrot': 'carrot boiled',
  'carrots': 'carrot boiled',
  'tomato': 'tomato raw',
  'tomatoes': 'tomato raw',
  'onion': 'onion boiled',
  'onions': 'onion boiled',
  'cucumber': 'cucumber raw',
  'lettuce': 'lettuce raw',
  'salad': 'mixed vegetable salad',

  'bhindi': 'okra fried',
  'capsicum': 'bell pepper',
  'green beans': 'green beans boiled',
  'beans': 'green beans boiled',

  // Legumes & Pulses
  'dal': 'lentil curry cooked',
  'dals': 'lentil curry cooked',
  'daal': 'lentil curry cooked',
  'lentils': 'lentil curry cooked',
  'red lentils': 'lentil curry cooked',
  'masoor': 'lentil curry cooked',
  'chana': 'chickpea curry',
  'chickpea': 'chickpea curry',
  'chickpeas': 'chickpea curry',
  'rajma': 'kidney bean curry',
  'kidney beans': 'kidney bean curry',
  'moong': 'mung bean curry',
  'mung beans': 'mung bean curry',

  // Protein - Vegetarian
  'paneer': 'paneer cottage cheese',
  'paneer curry': 'paneer curry cooked',
  'tofu': 'tofu cooked',
  'soya chunks': 'soy chunks cooked',

  // Protein - Non-vegetarian
  'chicken': 'chicken breast grilled',
  'egg': 'chicken egg boiled',
  'eggs': 'chicken egg boiled',
  'boiled egg': 'chicken egg boiled',
  'scrambled egg': 'egg scrambled',
  'fried egg': 'egg fried',
  'omelette': 'egg omelette',
  'fish': 'tilapia fish grilled',
  'salmon': 'salmon cooked',
  'tuna': 'tuna canned',
  'meat': 'beef cooked',
  'beef': 'beef cooked',
  'mutton': 'mutton cooked',
  'lamb': 'lamb cooked',
  'pork': 'pork cooked',
  'shrimp': 'shrimp cooked',
  'prawn': 'shrimp cooked',

  // Dairy
  'milk': 'milk whole cow',
  'cow milk': 'milk whole cow',
  'buffalo milk': 'milk buffalo',
  'greek yogurt': 'yogurt greek',
  'yogurt': 'yogurt plain low fat',
  'curd': 'yogurt plain low fat',
  'lassi': 'lassi yogurt drink',
  'cheese': 'cheese cheddar',
  'butter': 'butter salted',
  'ghee': 'ghee clarified butter',
  'cream': 'cream heavy',
  'ice cream': 'ice cream vanilla',

  // Fruits
  'apple': 'apple raw',
  'banana': 'banana raw',
  'orange': 'orange raw',
  'mango': 'mango raw',
  'papaya': 'papaya raw',
  'guava': 'guava raw',
  'strawberry': 'strawberry raw',
  'grapes': 'grapes raw',
  'watermelon': 'watermelon raw',
  'pineapple': 'pineapple raw',
  'lemon': 'lemon raw',
  'lime': 'lemon raw',
  'coconut': 'coconut raw',
  'pomegranate': 'pomegranate raw',

  // Nuts & Seeds
  'almond': 'almonds raw',
  'almonds': 'almonds raw',
  'cashew': 'cashew nuts raw',
  'cashews': 'cashew nuts raw',
  'peanut': 'peanuts raw',
  'peanuts': 'peanuts raw',
  'walnut': 'walnuts raw',
  'walnuts': 'walnuts raw',
  'sunflower seeds': 'sunflower seeds raw',
  'pumpkin seeds': 'pumpkin seeds raw',
  'sesame seeds': 'sesame seeds raw',
  'flaxseed': 'flaxseeds raw',

  // Beverages
  'chai': 'milk tea indian',
  'tea': 'milk tea indian',
  'coffee': 'coffee black no milk',
  'black coffee': 'coffee black no milk',
  'green tea': 'green tea brewed',
  'juice': 'orange juice fresh',
  'orange juice': 'orange juice fresh',
  'apple juice': 'apple juice',
  'water': 'water plain',
  'coconut water': 'coconut water',
  'smoothie': 'fruit smoothie',
  'milkshake': 'milk shake',

  // Condiments & Oils
  'oil': 'vegetable oil',
  'olive oil': 'olive oil',
  'coconut oil': 'coconut oil',
  'honey': 'honey',
  'jaggery': 'jaggery',
  'salt': 'salt',
  'sugar': 'sugar',
  'jam': 'jam strawberry',
  'peanut butter': 'peanut butter',

  // Snacks
  'chips': 'potato chips',
  'biscuit': 'biscuit plain',
  'cookie': 'cookie chocolate chip',
  'granola': 'granola with honey',
  'cereal': 'cereal whole grain',
  'popcorn': 'popcorn air popped',
  'samosa': 'samosa fried',
  'pakora': 'pakora fried',
  'namkeen': 'namkeen savory mix',

  // Curries & Dishes
  'butter chicken': 'chicken curry cooked',
  'chicken curry': 'chicken curry cooked',
  'aloo sabji': 'potato curry indian',
  'saag': 'spinach paneer curry',
  'chole': 'chickpea curry',
  'rajma': 'kidney bean curry',

  // Common India adjustments
  'white rice': 'white rice boiled',
  'basmati': 'white rice boiled',
  'wheat': 'whole wheat chapati',
  'sweetcorn': 'corn boiled',
  'corn': 'corn boiled',
  'mushroom': 'mushroom raw',
  'garlic': 'garlic raw',
  'ginger': 'ginger raw',
  'chilli': 'chili red raw',
  'chilly': 'chili red raw',
};

/**
 * Normalize a food name
 * 
 * Input: "ALOO SABJI", "Aloo Sabji", "aloo sabji"
 * Output: "potato curry indian"
 * 
 * Preserves original name in response for UI display
 */
function normalizeFoodName(foodName) {
  if (!foodName) return null;

  const original = String(foodName).trim();
  const normalized = original
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Exact match
  if (FOOD_NORMALIZATIONS[normalized]) {
    return {
      original: original,
      normalized: FOOD_NORMALIZATIONS[normalized],
      found: true,
    };
  }

  // Partial match (first significant word)
  const words = normalized.split(' ').filter(Boolean);
  for (const word of words) {
    if (FOOD_NORMALIZATIONS[word]) {
      return {
        original: original,
        normalized: FOOD_NORMALIZATIONS[word],
        found: true,
      };
    }
  }

  // No match - return as-is
  return {
    original: original,
    normalized: normalized,
    found: false,
  };
}

/**
 * Check if this exact food has a known normalization
 */
function isKnownFood(foodName) {
  const result = normalizeFoodName(foodName);
  return result.found;
}

/**
 * Get all available normalizations (for debugging/stats)
 */
function getNormalizations() {
  return { ...FOOD_NORMALIZATIONS };
}

/**
 * Get canonical name from a variant
 * Returns null if no mapping found
 */
function getCanonicalName(foodName) {
  const result = normalizeFoodName(foodName);
  return result.found ? result.normalized : null;
}

module.exports = {
  FOOD_NORMALIZATIONS,
  normalizeFoodName,
  isKnownFood,
  getCanonicalName,
  getNormalizations,
};
