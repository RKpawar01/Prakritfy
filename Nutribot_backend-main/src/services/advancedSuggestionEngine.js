/**
 * ENHANCED SUGGESTION ENGINE - 3-TIER SMART RECOMMENDATIONS
 * 
 * Tier 1: Region-based (before user input)
 * Tier 2: Meal-balance suggestions (during analysis)
 * Tier 3: Deficiency-fixing (after deficiency analysis)
 */

const { logNutritionAudit } = require('../utils/nutritionEngine');

/**
 * TIER 1: REGION-SPECIFIC FOODS
 * Suggests foods based on user's state/region
 */
const REGION_STAPLES = {
  // NORTH INDIA
  'punjab': {
    foods: ['Roti', 'Dal', 'Paneer', 'Lassi', 'Ghee', 'Milk', 'Curd', 'Rajma'],
    description: 'Punjabi cuisine - high protein, dairy-rich',
    seasonal: ['Sarson (mustard greens)', 'Til (sesame seeds)']
  },
  'haryana': {
    foods: ['Roti', 'Dal', 'Milk', 'Paneer', 'Kadhi', 'Rajma', 'Curd'],
    description: 'Haryanvi diet - balanced protein and grains',
    seasonal: ['Methi (fenugreek)', 'Bajra (millet)']
  },
  'delhi': {
    foods: ['Roti', 'Dal', 'Paneer', 'Paratha', 'Egg', 'Curd', 'Milk'],
    description: 'Delhi blend - North Indian + street food classics',
    seasonal: ['Chikhalwali squash', 'Seasonal vegetables']
  },
  'uttar pradesh': {
    foods: ['Roti', 'Dal', 'Paneer', 'Milk', 'Curd', 'Rice', 'Potato'],
    description: 'UP cuisine - wheat and dal dominant',
    seasonal: ['Potato', 'Loki (bottle gourd)']
  },

  // SOUTH INDIA
  'karnataka': {
    foods: ['Rice', 'Dal', 'Coconut', 'Milk', 'Jaggery', 'Cardamom'],
    description: 'Kannada cuisine - rice, coconut, and spices',
    seasonal: ['Ragi (finger millet)', 'Coffee']
  },
  'tamil nadu': {
    foods: ['Rice', 'Idli', 'Dosa', 'Dal', 'Coconut', 'Tamarind', 'Sesame'],
    description: 'Tamil cuisine - rice, fermented foods, sesame',
    seasonal: ['Jackfruit', 'Coconut']
  },
  'telangana': {
    foods: ['Rice', 'Dal', 'Sesame', 'Peanut', 'Coconut', 'Milk', 'Spices'],
    description: 'Telugu cuisine - rice and pulses combo',
    seasonal: ['Groundnut', 'Sesame seeds']
  },
  'andhra pradesh': {
    foods: ['Rice', 'Dal', 'Peanut', 'Sesame', 'Milk', 'Chili', 'Coconut'],
    description: 'Andhra cuisine - rice, peanut, and spicy',
    seasonal: ['Groundnut', 'Sesame']
  },
  'kerala': {
    foods: ['Rice', 'Coconut', 'Fish', 'Milk', 'Banana', 'Tapioca', 'Spices'],
    description: 'Kerala cuisine - coconut, fish, and tropical fruits',
    seasonal: ['Coconut', 'Tapioca', 'Banana', 'Fish']
  },

  // EAST INDIA
  'west bengal': {
    foods: ['Rice', 'Dal', 'Fish', 'Potato', 'Spinach', 'Mustard'],
    description: 'Bengali cuisine - fish and vegetable rich',
    seasonal: ['Fish', 'Spinach', 'Potato']
  },

  // WEST INDIA
  'maharashtra': {
    foods: ['Rice', 'Dal', 'Wheat', 'Groundnut', 'Onion', 'Tomato', 'Milk'],
    description: 'Marathi cuisine - balanced grains and pulses',
    seasonal: ['Jowar (sorghum)', 'Groundnut']
  },
  'gujarat': {
    foods: ['Dal', 'Milk', 'Groundnut', 'Sesame', 'Jaggery', 'Vegetables'],
    description: 'Gujarati cuisine - dairy and groundnut dominant',
    seasonal: ['Groundnut', 'Sesame']
  },
};

/**
 * TIER 2: MEAL-BALANCE SUGGESTIONS
 * Suggest complementary foods to complete the meal
 */
const MEAL_COMPLETIONS = {
  'roti': {
    lacks: ['protein', 'vegetables'],
    suggest: [
      { food: 'Dal', boost: 'Adds protein & iron' },
      { food: 'Paneer Curry', boost: 'Complete protein' },
      { food: 'Chicken', boost: 'High protein' },
      { food: 'Vegetable Curry', boost: 'Fiber & minerals' },
    ]
  },
  'rice': {
    lacks: ['protein'],
    suggest: [
      { food: 'Dal', boost: 'Complete amino acids when combined' },
      { food: 'Paneer', boost: 'Protein + calcium' },
      { food: 'Fish/Chicken', boost: 'Lean protein' },
      { food: 'Vegetable', boost: 'Fiber & vitamins' },
    ]
  },
  'dal': {
    lacks: ['calories', 'fat'],
    suggest: [
      { food: 'Ghee/Oil', boost: 'Adds healthy fats' },
      { food: 'Rice/Roti', boost: 'Completes carbs' },
      { food: 'Paneer/Egg', boost: 'Boosts protein' },
    ]
  },
  'salad': {
    lacks: ['protein', 'carbs'],
    suggest: [
      { food: 'Paneer', boost: 'Protein & calcium' },
      { food: 'Egg', boost: 'Complete protein' },
      { food: 'Chickpea', boost: 'Plant protein' },
      { food: 'Bread/Rice', boost: 'Carbohydrates' },
    ]
  },
  'egg': {
    lacks: ['vegetables', 'carbs'],
    suggest: [
      { food: 'Bread/Toast', boost: 'Carbs' },
      { food: 'Vegetables', boost: 'Fiber & vitamins' },
      { food: 'Milk', boost: 'Calcium boost' },
    ]
  },
  'milk': {
    lacks: ['carbs', 'fiber'],
    suggest: [
      { food: 'Cereal/Oats', boost: 'Carbs & fiber' },
      { food: 'Banana', boost: 'Potassium & carbs' },
      { food: 'Fruit', boost: 'Vitamins & fiber' },
    ]
  },
  'chicken': {
    lacks: ['vegetables', 'carbs'],
    suggest: [
      { food: 'Rice', boost: 'Carbohydrates' },
      { food: 'Roti', boost: 'Fiber carbs' },
      { food: 'Salad', boost: 'Vegetables & fiber' },
      { food: 'Dal', boost: 'Additional protein & iron' },
    ]
  },
  'fish': {
    lacks: ['vegetables', 'carbs'],
    suggest: [
      { food: 'Rice', boost: 'Carbs + omega-3 combo' },
      { food: 'Vegetables', boost: 'Fiber & minerals' },
      { food: 'Lemon/Lime', boost: 'Vitamin C for absorption' },
    ]
  }
};

/**
 * Get regional suggestions (TIER 1)
 */
function getRegionalSuggestions(region = null, maxSuggestions = 3) {
  if (!region) {
    return [];
  }

  const regionLower = (region || '').toLowerCase().trim();
  const regionData = REGION_STAPLES[regionLower];

  if (!regionData) {
    return [];
  }

  return [
    {
      type: 'region_based',
      title: `Popular in ${region}`,
      description: regionData.description,
      foods: regionData.foods.slice(0, maxSuggestions).map(food => ({
        name: food,
        reason: 'Popular local choice',
        onClick: `+${food}` // For UI: clicking adds this food
      })),
      seasonal: regionData.seasonal ? `Try seasonal: ${regionData.seasonal.join(', ')}` : null,
      emoji: '🌏'
    }
  ];
}

/**
 * Get meal-balance suggestions (TIER 2)
 */
function getMealBalanceSuggestions(currentFoods = [], maxSuggestions = 4) {
  if (!currentFoods || currentFoods.length === 0) {
    return [];
  }

  const suggestions = new Set();
  const mealScore = analyzeMealComponents(currentFoods);

  // Iterate through each food and get completion suggestions
  currentFoods.forEach(foodName => {
    const normalized = (foodName || '').toLowerCase().trim();
    const completion = MEAL_COMPLETIONS[normalized];

    if (completion && completion.suggest) {
      completion.suggest.forEach(suggestion => {
        suggestions.add(JSON.stringify(suggestion));
      });
    }
  });

  // Convert set back to objects and limit
  const suggestionArray = Array.from(suggestions)
    .map(s => JSON.parse(s))
    .slice(0, maxSuggestions);

  if (suggestionArray.length === 0) {
    return [];
  }

  return [
    {
      type: 'meal_balance',
      title: 'Complete your meal',
      description: mealScore.recommendation,
      foods: suggestionArray.map(s => ({
        name: s.food,
        reason: s.boost,
        onClick: `+${s.food}`
      })),
      emoji: '⚖️'
    }
  ];
}

/**
 * Analyze meal components and give recommendation
 */
function analyzeMealComponents(foods = []) {
  let hasProtein = false;
  let hasCarbs = false;
  let hasVegetables = false;
  let hasFat = false;

  const proteinFoods = ['dal', 'paneer', 'egg', 'chicken', 'fish', 'milk', 'curd', 'tofu'];
  const carbFoods = ['roti', 'rice', 'bread', 'oats', 'pasta', 'potato'];
  const vegFoods = ['salad', 'vegetable', 'curry', 'spinach', 'broccoli', 'tomato', 'onion', 'carrot', 'cauliflower'];
  const fatFoods = ['ghee', 'oil', 'butter', 'nuts', 'cheese', 'avocado'];

  foods.forEach(food => {
    const lower = (food || '').toLowerCase();
    if (proteinFoods.some(p => lower.includes(p))) hasProtein = true;
    if (carbFoods.some(c => lower.includes(c))) hasCarbs = true;
    if (vegFoods.some(v => lower.includes(v))) hasVegetables = true;
    if (fatFoods.some(f => lower.includes(f))) hasFat = true;
  });

  const missing = [
    !hasProtein ? 'protein' : null,
    !hasCarbs ? 'carbs' : null,
    !hasVegetables ? 'vegetables' : null,
    !hasFat ? 'healthy fats' : null
  ].filter(Boolean);

  let recommendation = '';
  if (missing.length === 0) {
    recommendation = 'Your meal looks well-balanced!';
  } else if (missing.length === 1) {
    recommendation = `Add ${missing[0]} to balance this meal`;
  } else {
    recommendation = `Consider adding ${missing.join(', ')}`;
  }

  return { hasProtein, hasCarbs, hasVegetables, hasFat, missing, recommendation };
}

/**
 * Get deficiency-fixing suggestions (TIER 3)
 */
function getDeficiencySuggestions(deficiencies = [], maxSuggestions = 3) {
  if (!deficiencies || deficiencies.length === 0) {
    return [];
  }

  const deficiencyFoodMap = {
    iron: ['Spinach', 'Dal', 'Jaggery', 'Pomegranate'],
    vitaminB12: ['Curd', 'Milk', 'Egg', 'Paneer'],
    vitaminD: ['Fish', 'Egg', 'Fortified Milk', 'Mushroom'],
    calcium: ['Milk', 'Curd', 'Paneer', 'Sesame Seeds'],
    vitaminC: ['Orange', 'Mango', 'Guava', 'Tomato'],
    protein: ['Dal', 'Paneer', 'Egg', 'Chicken'],
    zinc: ['Pumpkin Seeds', 'Sesame', 'Cashew', 'Lentils'],
    fiber: ['Oats', 'Whole Wheat', 'Vegetables', 'Fruits'],
  };

  const suggestions = [];
  
  deficiencies.slice(0, 2).forEach(deficiency => {
    const nutrientKey = deficiency.nutrient || deficiency.key;
    const foods = deficiencyFoodMap[nutrientKey] || [];

    if (foods.length > 0) {
      suggestions.push({
        type: 'deficiency_fix',
        title: `Boost ${deficiency.label || nutrientKey}`,
        subtitle: `Your ${deficiency.label || nutrientKey} seems low`,
        foods: foods.slice(0, maxSuggestions).map(food => ({
          name: food,
          reason: `High in ${deficiency.label || nutrientKey}`,
          onClick: `+${food}`
        })),
        emoji: '💪'
      });
    }
  });

  return suggestions;
}

/**
 * MAIN: Get all 3-tier suggestions
 */
function getAllSuggestions(
  region = null,
  currentFoods = [],
  deficiencies = [],
  options = {}
) {
  const maxPerTier = options.maxPerTier || 3;
  const maxTotal = options.maxTotal || 8;

  logNutritionAudit('suggestions_processing', {
    region,
    foodCount: currentFoods.length,
    deficiencyCount: deficiencies.length,
  });

  const suggestions = [];

  // TIER 1: Region-based (always first if region provided)
  if (region) {
    const regionSuggestions = getRegionalSuggestions(region, maxPerTier);
    suggestions.push(...regionSuggestions);
  }

  // TIER 2: Meal-balance (suggest complementary foods)
  if (currentFoods.length > 0) {
    const balanceSuggestions = getMealBalanceSuggestions(currentFoods, maxPerTier);
    suggestions.push(...balanceSuggestions);
  }

  // TIER 3: Deficiency-fixing
  if (deficiencies.length > 0) {
    const deficiencySuggestions = getDeficiencySuggestions(deficiencies, maxPerTier);
    suggestions.push(...deficiencySuggestions);
  }

  // Flatten and limit total suggestions
  const flattenedSuggestions = [];
  suggestions.forEach(tier => {
    if (tier.foods) {
      tier.foods.slice(0, maxPerTier).forEach(food => {
        flattenedSuggestions.push({
          name: food.name,
          reason: food.reason,
          tier: tier.type,
          emoji: tier.emoji,
          onClick: food.onClick
        });
      });
    }
  });

  return flattenedSuggestions.slice(0, maxTotal);
}

module.exports = {
  REGION_STAPLES,
  MEAL_COMPLETIONS,
  getRegionalSuggestions,
  getMealBalanceSuggestions,
  getDeficiencySuggestions,
  getAllSuggestions,
  analyzeMealComponents,
};
