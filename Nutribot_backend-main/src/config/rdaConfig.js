/**
 * Indian RDA (Recommended Dietary Allowances) Configuration
 * Based on ICMR (Indian Council of Medical Research) standards
 * 
 * Reference: ICMR-NINS Guidelines 2020
 */

/**
 * Default RDA baseline for average adult male
 * Used when user profile not available (guest mode)
 */
const DEFAULT_RDA = {
  calories: 2200,        // kcal/day
  protein: 60,           // grams/day
  carbohydrates: 270,    // grams/day
  fat: 70,               // grams/day
  fiber: 30,             // grams/day
  
  // Key micronutrients (for deficiency tracking)
  iron: 17,              // mg/day (adult male)
  calcium: 600,          // mg/day
  vitaminD: 10,          // mcg/day
  vitaminB12: 1,         // mcg/day
  vitaminC: 40,          // mg/day
  
  // Additional important nutrients
  zinc: 11,              // mg/day
  magnesium: 400,        // mg/day
  potassium: 2000,       // mg/day
  folate: 200,           // mcg/day
};

/**
 * Thresholds for deficiency detection
 * < 70% = "Low"
 * < 50% = "Critical Deficiency"
 */
const DEFICIENCY_THRESHOLDS = {
  low: 0.70,             // 70% of RDA
  critical: 0.50,        // 50% of RDA
};

/**
 * Age-adjusted RDA values (ICMR standards)
 * Uses one baseline; adjusted by age, gender, activity
 */
const RDA_BY_AGE_GENDER = {
  // Children (6-12 years)
  child_male: {
    calories: 1680,
    protein: 25,
    iron: 10,
    calcium: 600,
    vitaminD: 10,
  },
  child_female: {
    calories: 1680,
    protein: 25,
    iron: 10,
    calcium: 600,
    vitaminD: 10,
  },
  
  // Adolescents (13-18 years)
  teen_male: {
    calories: 2380,
    protein: 56,
    iron: 13,
    calcium: 800,
    vitaminD: 10,
  },
  teen_female: {
    calories: 2060,
    protein: 55,
    iron: 21,           // Higher for menstruating women
    calcium: 800,
    vitaminD: 10,
  },
  
  // Adults (19-50 years)
  adult_male: {
    calories: 2200,
    protein: 60,
    iron: 17,
    calcium: 600,
    vitaminD: 10,
  },
  adult_female: {
    calories: 1900,
    protein: 55,
    iron: 21,           // Higher for menstruating women
    calcium: 600,
    vitaminD: 10,
  },
  
  // Seniors (50+ years)
  senior_male: {
    calories: 2000,
    protein: 60,
    iron: 8,            // Lower for post-menopausal women
    calcium: 800,
    vitaminD: 15,
  },
  senior_female: {
    calories: 1900,
    protein: 55,
    iron: 8,            // Lower for post-menopausal women
    calcium: 800,
    vitaminD: 15,
  },
};

/**
 * Activity level multipliers for TDEE calculation
 * Used to adjust calorie requirements
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // Little exercise
  light: 1.375,         // 1-3 days/week
  moderate: 1.55,       // 3-5 days/week
  active: 1.725,        // 6-7 days/week
  veryActive: 1.9,      // Physical job + heavy exercise
};

/**
 * Goal-based adjustments (relative to baseline)
 */
const GOAL_ADJUSTMENTS = {
  lose_weight: {
    calories: 0.85,     // 15% deficit
    protein: 1.1,       // Increase protein to preserve muscle
  },
  gain_weight: {
    calories: 1.15,     // 15% surplus
    protein: 1.2,       // Increase protein for muscle growth
  },
  maintain: {
    calories: 1.0,      // No change
    protein: 1.0,       // No change
  },
};

/**
 * Regional diet adjustments (macro ratios)
 * Indian diets are typically high-carb, moderate protein, lower fat
 */
const REGION_MACRO_RATIOS = {
  // North India: High wheat, dal, paneer
  north_india: {
    carbs: 0.55,        // 55% of calories
    protein: 0.15,      // 15% of calories
    fat: 0.30,          // 30% of calories
  },
  
  // South India: Higher rice, coconut
  south_india: {
    carbs: 0.60,        // 60% of calories
    protein: 0.12,      // 12% of calories
    fat: 0.28,          // 28% of calories (coconut oil)
  },
  
  // East India: Mix of rice, vegetables
  east_india: {
    carbs: 0.58,        // 58% of calories
    protein: 0.13,      // 13% of calories
    fat: 0.29,          // 29% of calories
  },
  
  // West India: Diverse, moderate macros
  west_india: {
    carbs: 0.53,        // 53% of calories
    protein: 0.16,      // 16% of calories
    fat: 0.31,          // 31% of calories
  },
};

/**
 * Key micronutrient thresholds for deficiency alerts
 * Ordered by priority (most common deficiencies first)
 */
const DEFICIENCY_PRIORITIES = [
  'iron',           // Most common in India
  'vitaminB12',     // Especially for vegetarians
  'vitaminD',       // Insufficient sunlight exposure
  'calcium',        // Low dairy regions
  'vitaminC',       // Varies by season
  'zinc',           // Limited sources in vegetarian diets
];

/**
 * Get RDA values for a specific user profile
 * @param {Object} profile - { age, gender, activityLevel, goal, region }
 * @returns {Object} Adjusted RDA values
 */
function getRDAForProfile(profile = {}) {
  const {
    age = null,
    gender = null,
    activityLevel = 'moderate',
    goal = 'maintain',
    region = null,
  } = profile;

  // Start with default baseline
  let rda = JSON.parse(JSON.stringify(DEFAULT_RDA));

  // Adjust for age & gender if provided
  if (age && gender) {
    const ageGroup = getAgeGroup(age);
    const key = `${ageGroup}_${gender}`;
    const ageGenderRDA = RDA_BY_AGE_GENDER[key];
    
    if (ageGenderRDA) {
      rda = { ...rda, ...ageGenderRDA };
    }
  }

  // Adjust for activity level
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  rda.calories = Math.round(rda.calories * activityMultiplier);

  // Adjust for goal
  const goalAdjustment = GOAL_ADJUSTMENTS[goal] || GOAL_ADJUSTMENTS.maintain;
  rda.calories = Math.round(rda.calories * goalAdjustment.calories);
  rda.protein = Math.round(rda.protein * goalAdjustment.protein);

  // Add regional macro ratio info (for suggestions)
  if (region) {
    const regionKey = normalizeRegion(region);
    rda.macroRatios = REGION_MACRO_RATIOS[regionKey] || REGION_MACRO_RATIOS.north_india;
  }

  return rda;
}

/**
 * Map age to age group for RDA lookup
 */
function getAgeGroup(age) {
  if (age < 13) return 'child';
  if (age < 19) return 'teen';
  if (age < 51) return 'adult';
  return 'senior';
}

/**
 * Normalize region name to RDA key
 */
function normalizeRegion(region) {
  if (!region) return 'north_india';
  
  const lower = region.toLowerCase();
  
  // Map states to regions
  const stateToRegion = {
    // North
    'punjab': 'north_india',
    'haryana': 'north_india',
    'delhi': 'north_india',
    'uttar pradesh': 'north_india',
    'rajasthan': 'north_india',
    'himachal pradesh': 'north_india',
    'uttarakhand': 'north_india',
    'jammu and kashmir': 'north_india',
    
    // South
    'karnataka': 'south_india',
    'tamil nadu': 'south_india',
    'telangana': 'south_india',
    'andhra pradesh': 'south_india',
    'kerala': 'south_india',
    
    // East
    'west bengal': 'east_india',
    'bihar': 'east_india',
    'jharkhand': 'east_india',
    'odisha': 'east_india',
    'assam': 'east_india',
    
    // West
    'maharashtra': 'west_india',
    'gujarat': 'west_india',
    'goa': 'west_india',
  };

  return stateToRegion[lower] || 'north_india';
}

/**
 * Calculate deficiency level for a nutrient
 * @param {number} intake - Actual intake value
 * @param {number} requirement - RDA value
 * @returns {Object} { level: 'ok|low|critical', percentage: number }
 */
function calculateDeficiencyLevel(intake, requirement) {
  if (!requirement || requirement === 0) {
    return { level: 'ok', percentage: 100 };
  }

  const percentage = Math.round((intake / requirement) * 100);

  if (percentage >= DEFICIENCY_THRESHOLDS.low * 100) {
    return { level: 'ok', percentage };
  } else if (percentage >= DEFICIENCY_THRESHOLDS.critical * 100) {
    return { level: 'low', percentage };
  } else {
    return { level: 'critical', percentage };
  }
}

/**
 * Get user-friendly nutrient name
 */
function getNutrientLabel(nutrientKey) {
  const labels = {
    calories: 'Calories',
    protein: 'Protein',
    carbohydrates: 'Carbohydrates',
    fat: 'Fat',
    fiber: 'Fiber',
    iron: 'Iron',
    calcium: 'Calcium',
    vitaminD: 'Vitamin D',
    vitaminB12: 'Vitamin B12',
    vitaminC: 'Vitamin C',
    zinc: 'Zinc',
    magnesium: 'Magnesium',
    potassium: 'Potassium',
    folate: 'Folate',
  };

  return labels[nutrientKey] || nutrientKey;
}

module.exports = {
  DEFAULT_RDA,
  RDA_BY_AGE_GENDER,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  REGION_MACRO_RATIOS,
  DEFICIENCY_THRESHOLDS,
  DEFICIENCY_PRIORITIES,
  
  getRDAForProfile,
  calculateDeficiencyLevel,
  getNutrientLabel,
  normalizeRegion,
  getAgeGroup,
};
