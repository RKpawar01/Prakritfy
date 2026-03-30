/**
 * Suggestion Engine
 * 
 * Provides smart food suggestions based on:
 * 1. Regional food availability (state-level)
 * 2. Meal balance (complementary foods)
 * 3. Deficiencies (nutrient-fixing foods)
 * 4. User preferences (diet type, allergies)
 */

const { logNutritionAudit } = require('../utils/nutritionEngine');
const { REGION_MACRO_RATIOS } = require('../config/rdaConfig');

/**
 * Regional foods by state/region
 * Organized for quick lookup
 */
const REGIONAL_FOODS = {
  // North India (Wheat-belt)
  'punjab': ['roti', 'dal', 'paneer', 'ghee', 'curd', 'milk', 'lassi', 'sarson'],
  'haryana': ['roti', 'dal', 'milk', 'paneer', 'rice', 'rajma', 'curd'],
  'delhi': ['roti', 'dal', 'paneer', 'paratha', 'egg', 'milk', 'curd', 'rajma'],
  'uttar pradesh': ['roti', 'dal', 'rice', 'potato', 'paneer', 'milk', 'curd'],
  'rajasthan': ['bajra', 'jowar', 'dal', 'ghee', 'milk', 'paneer', 'sarson'],
  'himachal pradesh': ['roti', 'dal', 'potato', 'apple', 'milk', 'curd', 'paneer'],
  'uttarakhand': ['roti', 'dal', 'rice', 'potato', 'milk', 'curd', 'rajma'],
  'jammu and kashmir': ['rice', 'dal', 'paneer', 'milk', 'apple', 'walnut', 'saffron'],
  
  // South India (Rice-belt)
  'karnataka': ['rice', 'dal', 'coconut', 'milk', 'jaggery', 'cardamom', 'coconut oil'],
  'tamil nadu': ['rice', 'dal', 'sesame', 'coconut', 'jaggery', 'tamarind', 'milk'],
  'telangana': ['rice', 'dal', 'sesame', 'coconut', 'milk', 'tamarind', 'chili'],
  'andhra pradesh': ['rice', 'dal', 'sesame', 'peanut', 'coconut', 'milk', 'chili'],
  'kerala': ['rice', 'coconut', 'fish', 'milk', 'banana', 'tapioca', 'spices'],
  
  // East India (Mixed diet)
  'west bengal': ['rice', 'dal', 'fish', 'mustard', 'potato', 'spinach', 'cauliflower'],
  'bihar': ['rice', 'dal', 'lentil', 'potato', 'milk', 'jaggery', 'wheat'],
  'jharkhand': ['rice', 'dal', 'potato', 'millet', 'vegetable', 'milk', 'jaggery'],
  'odisha': ['rice', 'fish', 'dal', 'sesame', 'vegetable', 'milk', 'coconut'],
  'assam': ['rice', 'fish', 'dal', 'ginger', 'turmeric', 'mustard', 'tea'],
  
  // West India (Diverse diet)
  'maharashtra': ['rice', 'dal', 'wheat', 'onion', 'tomato', 'groundnut', 'milk'],
  'gujarat': ['dal', 'milk', 'groundnut', 'sesame', 'jaggery', 'vegetable', 'ghee'],
  'goa': ['rice', 'fish', 'coconut', 'peanut', 'vegetable', 'milk', 'spices'],
};

/**
 * Food pairings for meal balance
 * If user adds X, suggest Y to complement
 */
const MEAL_PAIRINGS = {
  'roti': ['dal', 'paneer', 'aloo sabji', 'spinach', 'cucumber'],
  'rice': ['dal', 'paneer', 'chicken', 'sambar', 'raita'],
  'dal': ['roti', 'rice', 'milk', 'ghee'],
  'paneer': ['roti', 'rice', 'spinach', 'tomato', 'onion'],
  'egg': ['bread', 'toast', 'rice', 'milk'],
  'chicken': ['roti', 'rice', 'salad', 'bread'],
  'milk': ['banana', 'oats', 'parathas'],
  'salad': ['rice', 'roti', 'protein'],
};

/**
 * Nutrient-rich foods for deficiency fixes
 */
const NUTRIENT_FOODS = {
  iron: [
    { name: 'spinach', notes: 'dark leafy green' },
    { name: 'dal', notes: 'protein + iron' },
    { name: 'jaggery', notes: 'traditional iron source' },
    { name: 'pomegranate', notes: 'fruit with iron' },
    { name: 'dates', notes: 'dried fruit, iron' },
  ],
  vitaminB12: [
    { name: 'curd', notes: 'dairy' },
    { name: 'milk', notes: 'dairy' },
    { name: 'egg', notes: 'animal source' },
    { name: 'paneer', notes: 'dairy' },
    { name: 'cheese', notes: 'dairy' },
  ],
  vitaminD: [
    { name: 'milk', notes: 'fortified' },
    { name: 'egg', notes: 'yolk source' },
    { name: 'mushroom', notes: 'sunlight exposure' },
    { name: 'fish', notes: 'fatty fish' },
    { name: 'cheese', notes: 'dairy' },
  ],
  calcium: [
    { name: 'milk', notes: 'primary source' },
    { name: 'curd', notes: 'dairy' },
    { name: 'paneer', notes: 'dairy + protein' },
    { name: 'ragi', notes: 'grain' },
    { name: 'sesame seeds', notes: 'seeds' },
  ],
  vitaminC: [
    { name: 'orange', notes: 'citrus fruit' },
    { name: 'guava', notes: 'high vitamin C' },
    { name: 'lemon', notes: 'citrus' },
    { name: 'tomato', notes: 'vegetable' },
    { name: 'mango', notes: 'seasonal fruit' },
  ],
  protein: [
    { name: 'dal', notes: 'legume' },
    { name: 'paneer', notes: 'dairy' },
    { name: 'egg', notes: 'animal' },
    { name: 'milk', notes: 'dairy' },
    { name: 'nuts', notes: 'seeds' },
  ],
};

/**
 * Get regional food suggestions
 * Used at start of guest mode to show familiar foods
 */
function getRegionalFoods(state) {
  if (!state) return [];
  
  const normalizedState = normalizeStateName(state);
  const foodList = REGIONAL_FOODS[normalizedState] || REGIONAL_FOODS['delhi'];
  
  return foodList.map(food => ({
    name: food,
    category: 'regional',
    reason: `Common in ${state}`,
  }));
}

/**
 * Get complementary food suggestions for current meal
 * If user added dal, suggest roti to complement
 */
function getMealCompletionSuggestions(currentFoods = []) {
  const suggestions = [];
  const seenFoods = new Set(currentFoods.map(f => f.toLowerCase()));

  // Check each current food for pairing suggestions
  currentFoods.forEach(food => {
    const normalized = normalizeFoodName(food);
    const pairs = MEAL_PAIRINGS[normalized];
    
    if (pairs) {
      pairs.forEach(pair => {
        if (!seenFoods.has(pair.toLowerCase())) {
          suggestions.push({
            name: pair,
            category: 'meal_balance',
            reason: `Pairs well with ${food}`,
          });
          seenFoods.add(pair.toLowerCase());
        }
      });
    }
  });

  return suggestions;
}

/**
 * Get foods to fix specific deficiency
 */
function getDeficiencyFixFoods(nutrientKey, dietType = 'non-veg') {
  const foodList = NUTRIENT_FOODS[nutrientKey] || [];
  
  return foodList.map(food => ({
    name: food.name,
    category: 'deficiency_fix',
    reason: `Rich in ${nutrientKey}`,
    notes: food.notes,
  }));
}

/**
 * Get comprehensive suggestions in priority order
 * 
 * Priority:
 * 1. Regional foods (for familiarity)
 * 2. Meal balance (complementary)
 * 3. Deficiencies (if any)
 */
function getSuggestionsForMeal(options = {}) {
  const {
    currentFoods = [],
    region = null,
    deficiencies = [],
    dietType = 'non-veg',
    maxSuggestions = 8,
  } = options;

  const suggestions = [];

  // Stage 1: Regional foods (show first for orientation)
  if (region && currentFoods.length === 0) {
    const regionalSuggestions = getRegionalFoods(region);
    suggestions.push(...regionalSuggestions.slice(0, 4));
  }

  // Stage 2: Meal balance suggestions
  const mealSuggestions = getMealCompletionSuggestions(currentFoods);
  suggestions.push(...mealSuggestions.slice(0, 3));

  // Stage 3: Deficiency fixes
  if (deficiencies.length > 0) {
    const topDeficiency = deficiencies[0];
    const deficiencySuggestions = getDeficiencyFixFoods(topDeficiency.nutrient, dietType);
    suggestions.push(...deficiencySuggestions.slice(0, 2));
  }

  // Remove duplicates and limit
  const seen = new Set();
  const final = suggestions.filter(s => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, maxSuggestions);

  logNutritionAudit('suggestions_generated', {
    suggestionsCount: final.length,
    region,
    deficienciesPresent: deficiencies.length > 0,
  });

  return final;
}

/**
 * Get macro ratio targets based on region
 * For suggesting balanced foods
 */
function getRegionMacroTargets(region) {
  const regionKey = normalizeRegionKey(region);
  return REGION_MACRO_RATIOS[regionKey] || REGION_MACRO_RATIOS.north_india;
}

/**
 * Normalize state name for lookup
 */
function normalizeStateName(state) {
  if (!state) return 'delhi';
  return state.toLowerCase().trim();
}

/**
 * Normalize region key
 */
function normalizeRegionKey(region) {
  if (!region) return 'north_india';
  const lower = region.toLowerCase();
  
  if (lower.includes('north') || lower.includes('punjab') || lower.includes('delhi')) return 'north_india';
  if (lower.includes('south') || lower.includes('karnataka') || lower.includes('tamil')) return 'south_india';
  if (lower.includes('east') || lower.includes('bengal') || lower.includes('assam')) return 'east_india';
  if (lower.includes('west') || lower.includes('maharashtra') || lower.includes('goa')) return 'west_india';
  
  return 'north_india';
}

/**
 * Normalize food name
 */
function normalizeFoodName(food) {
  return food.toLowerCase().replace(/\s+/g, ' ').trim();
}

module.exports = {
  getRegionalFoods,
  getMealCompletionSuggestions,
  getDeficiencyFixFoods,
  getSuggestionsForMeal,
  getRegionMacroTargets,
  normalizeStateName,
};
