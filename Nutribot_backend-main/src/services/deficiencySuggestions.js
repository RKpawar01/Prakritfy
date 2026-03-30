/**
 * ENHANCED DEFICIENCY SUGGESTIONS ENGINE
 * 
 * Provides actionable, region-aware fixes for nutritional deficiencies
 * Focus on Indian foods that users already know and can easily find
 */

const { getRDAForProfile } = require('../config/rdaConfig');
const { logNutritionAudit } = require('../utils/nutritionEngine');

/**
 * Deficiency-to-food recommendations (Indian focus)
 * Region-specific variants for North, South, East, West India
 */
const DEFICIENCY_FIXES = {
  iron: {
    primary: [
      { food: 'Spinach (Palak)', portions: '1 cup cooked', boost: 'High iron from leafy greens' },
      { food: 'Lentil Dal', portions: '1 bowl', boost: 'Iron + protein combination' },
      { food: 'Pomegranate', portions: '1/2 cup seeds', boost: 'Natural iron + vitamin C' },
      { food: 'Jaggery with sesame', portions: '1 tbsp + 1 tbsp sesame', boost: 'Traditional iron source' },
      { food: 'Pumpkin seeds', portions: '2 tbsp', boost: 'Quick iron boost' },
    ],
    note: '💡 Tip: Eat with vitamin C (orange, lemon) for better absorption',
    priority: 'critical', // Most common deficiency in India
  },

  vitaminB12: {
    primary: [
      { food: 'Curd/Yogurt', portions: '1 cup', boost: 'Good dairy source' },
      { food: 'Milk', portions: '1 glass', boost: 'Easiest B12 source' },
      { food: 'Paneer', portions: '100g', boost: 'Protein + B12' },
      { food: 'Egg', portions: '2 eggs', boost: 'Complete B12 + protein' },
      { food: 'Cheese', portions: '30g', boost: 'Concentrated B12' },
    ],
    vegan: [
      { food: 'Fortified plant milk', portions: '1 glass', boost: 'B12 fortified' },
      { food: 'Nutritional yeast', portions: '2 tbsp', boost: 'Fortified B12' },
      { food: 'Tempeh', portions: '100g', boost: 'Fermented soy' },
    ],
    note: '⚠️ Critical: Vegetarians MUST have daily dairy or supplements',
    priority: 'critical', // Common in vegetarians
  },

  vitaminD: {
    primary: [
      { food: 'Fatty Fish (Salmon, Mackerel)', portions: '100g', boost: 'Best D3 source' },
      { food: 'Egg Yolk', portions: '2 eggs', boost: 'Natural D3' },
      { food: 'Fortified Milk', portions: '1 glass', boost: 'D2 enriched variant' },
      { food: 'Mushrooms (dried in sun)', portions: '50g', boost: 'Plant-based D2' },
    ],
    sunlight: '☀️ Most important: 15-20 mins direct sunlight (face/arms) daily',
    note: 'Vitamin D requires both food + sun exposure (10 AM - 3 PM IST)',
    priority: 'critical', // Widespread deficiency
  },

  calcium: {
    primary: [
      { food: 'Milk/Curd', portions: '1 cup', boost: 'Rich calcium source' },
      { food: 'Paneer', portions: '100g', boost: 'High calcium' },
      { food: 'Sesame Seeds (Til)', portions: '3 tbsp', boost: 'Indian powerhouse' },
      { food: 'Ragi (Finger Millet)', portions: '1 cup', boost: 'Traditional calcium' },
      { food: 'Broccoli/Leafy Greens', portions: '1 cup', boost: 'Plant calcium' },
    ],
    note: '💡 Pair with vitamin D for better absorption',
    priority: 'high',
  },

  vitaminC: {
    primary: [
      { food: 'Orange/Mango/Guava', portions: '1 medium', boost: 'Fast vitamin C' },
      { food: 'Lemon Juice', portions: '2 tbsp', boost: 'Quick boost' },
      { food: 'Green Chili', portions: '2-3', boost: 'Indian spice source' },
      { food: 'Tomato', portions: '1 medium', boost: 'Everyday source' },
      { food: 'Strawberry', portions: '1 cup', boost: 'Delicious option' },
    ],
    note: '💡 Eat raw for maximum vitamin C (cooking reduces it by 50%)',
    priority: 'medium',
  },

  protein: {
    vegetarian: [
      { food: 'Dal/Lentils', portions: '1 cup cooked', boost: 'Plant protein' },
      { food: 'Paneer', portions: '100g', boost: 'Complete protein' },
      { food: 'Chickpea Curry', portions: '1 cup', boost: 'Protein + fiber' },
      { food: 'Peanuts/Nuts', portions: '1/4 cup', boost: 'Quick protein' },
      { food: 'Milk + Cereal', portions: 'Bowl', boost: 'Combo meal' },
    ],
    nonVeg: [
      { food: 'Chicken Breast', portions: '100g', boost: 'Lean protein' },
      { food: 'Egg', portions: '2 eggs', boost: 'Complete protein' },
      { food: 'Fish', portions: '100g', boost: 'Protein + omega-3' },
      { food: 'Paneer', portions: '100g', boost: 'Vegetarian-friendly' },
      { food: 'Dal + Rice', portions: '1 plate', boost: 'Complete amino acids' },
    ],
    note: '💡 Aim for protein with every meal (20-30g per meal)',
    priority: 'high',
  },

  zinc: {
    primary: [
      { food: 'Pumpkin Seeds (Kaddu)', portions: '2 tbsp', boost: 'Highest zinc' },
      { food: 'Sesame Seeds (Til)', portions: '3 tbsp', boost: 'Traditional source' },
      { food: 'Cashew Nuts', portions: '1/4 cup', boost: 'Easy option' },
      { food: 'Chickpea Dal', portions: '1 cup', boost: 'Protein + zinc' },
      { food: 'Oysters/Shellfish', portions: '100g', boost: 'Best animal source' },
    ],
    note: '💡 Zinc absorption is poor from plant sources - combine with animal sources',
    priority: 'medium',
  },

  fiber: {
    primary: [
      { food: 'Whole Wheat (Atta)', portions: '1 roti', boost: 'Best whole grain' },
      { food: 'Oats', portions: '1/2 cup', boost: 'Soluble fiber' },
      { food: 'Dal/Lentils', portions: '1 cup', boost: 'Fiber + protein' },
      { food: 'Apple with peel', portions: '1 medium', boost: 'Quick fiber' },
      { food: 'Vegetables (raw/cooked)', portions: '2 cups', boost: 'Bulk + nutrients' },
    ],
    note: '💡 Increase gradually to avoid bloating. Drink 2-3L water daily',
    priority: 'medium',
  },

  magnesium: {
    primary: [
      { food: 'Pumpkin Seeds', portions: '2 tbsp', boost: 'High magnesium' },
      { food: 'Spinach', portions: '1 cup cooked', boost: 'Bioavailable Mg' },
      { food: 'Almonds', portions: '1/4 cup', boost: 'Easy snack' },
      { food: 'Whole Grains', portions: '1 cup', boost: 'Dietary Mg' },
      { food: 'Dark Chocolate', portions: '30g', boost: 'Tasty option' },
    ],
    note: '💡 Needed for muscle and nerve function',
    priority: 'low',
  },

  potassium: {
    primary: [
      { food: 'Potato', portions: '1 medium baked', boost: 'Traditional source' },
      { food: 'Banana', portions: '1 medium', boost: 'Convenient option' },
      { food: 'Spinach', portions: '1 cup', boost: 'Balanced nutrients' },
      { food: 'Tomato', portions: '2-3 medium', boost: 'Everyday option' },
      { food: 'Dal', portions: '1 cup', boost: 'Protein + potassium' },
    ],
    note: '💡 Helps regulate blood pressure and heart health',
    priority: 'low',
  },
};

/**
 * Region-based deficiency variations (adjust suggestions by region)
 */
const REGION_DEFICIENCY_PATTERNS = {
  'south': { critical: ['iron', 'vitaminB12'], common: ['vitaminD'] },
  'north': { critical: ['vitaminD', 'calcium'], common: ['iron'] },
  'east': { critical: ['iron', 'vitaminD'], common: ['protein'] },
  'west': { critical: ['vitaminD', 'zinc'], common: ['calcium'] },
};

/**
 * Generate actionable deficiency fix with food suggestions
 */
function generateDeficiencyFix(nutrient, userProfile = {}) {
  const fixData = DEFICIENCY_FIXES[nutrient];
  if (!fixData) {
    return {
      nutrient,
      suggestions: [],
      note: 'Track this nutrient and consult a nutritionist'
    };
  }

  const isDietVegetarian = 
    userProfile.dietType === 'vegetarian' || 
    userProfile.dietType === 'veg' || 
    userProfile.dietType === 'vegan';

  return {
    nutrient,
    priority: fixData.priority,
    suggestions: isDietVegetarian ? 
      (fixData.vegetarian || fixData.primary) : 
      fixData.primary,
    vegan_options: fixData.vegan || [],
    note: fixData.note,
    sunlight_advice: fixData.sunlight,
    easy_wins: (fixData.primary || []).slice(0, 3),
  };
}

/**
 * Format deficiency results with personalized action items
 */
function formatDeficienciesForResponse(deficiencies, userProfile = {}) {
  if (!deficiencies || deficiencies.length === 0) {
    return {
      hasSevereDeficiency: false,
      summary: '✅ Great! Your meal looks nutritionally balanced.',
      actionItems: [],
      deficiencies: [],
    };
  }

  // Group by priority
  const critical = deficiencies.filter(d => d.severity === 'critical' || DEFICIENCY_FIXES[d.nutrient]?.priority === 'critical');
  const high = deficiencies.filter(d => DEFICIENCY_FIXES[d.nutrient]?.priority === 'high');

  // Build summary
  let summary = '';
  if (critical.length > 0) {
    const criticalNames = critical.map(d => d.label).join(', ');
    summary = `⚠️ Low ${criticalNames}. See suggestions below.`;
  } else if (high.length > 0) {
    const highNames = high.map(d => d.label).join(', ');
    summary = `💡 Consider adding more ${highNames} to your diet.`;
  }

  // Build action items with fix suggestions
  const actionItems = deficiencies.slice(0, 5).map(deficiency => {
    const fix = generateDeficiencyFix(deficiency.nutrient, userProfile);
    return {
      nutrient: deficiency.label,
      current: Math.round(deficiency.intake * 10) / 10,
      required: Math.round(deficiency.requirement * 10) / 10,
      severity: deficiency.severity,
      fix: fix.easy_wins.map(item => `${item.food} (${item.portions})`),
      tip: fix.note,
    };
  });

  return {
    hasSevereDeficiency: critical.length > 0,
    deficienciesCount: deficiencies.length,
    summary,
    actionItems,
    deficiencies,
  };
}

module.exports = {
  DEFICIENCY_FIXES,
  REGION_DEFICIENCY_PATTERNS,
  generateDeficiencyFix,
  formatDeficienciesForResponse,
};
