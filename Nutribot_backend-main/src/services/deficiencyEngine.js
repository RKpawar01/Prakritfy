/**
 * Deficiency Engine
 * 
 * Analyzes daily nutrition intake against ICMR RDA standards
 * Returns actionable deficiencies and severity levels
 */

const {
  getRDAForProfile,
  calculateDeficiencyLevel,
  getNutrientLabel,
  DEFICIENCY_PRIORITIES,
  DEFICIENCY_THRESHOLDS,
} = require('../config/rdaConfig');
const { logNutritionAudit } = require('../utils/nutritionEngine');

/**
 * Analyze nutrition data for deficiencies
 * 
 * @param {Object} nutrition - Daily nutrition totals
 *   - calories, protein, carbohydrates, fat, fiber
 *   - iron, calcium, vitaminD, vitaminB12, vitaminC, zinc, magnesium, potassium, folate
 * @param {Object} userProfile - User profile for RDA calculation
 *   - age, gender, activityLevel, goal, region
 * @returns {Object} Deficiency analysis with recommendations
 */
function analyzeDailyDeficiencies(nutrition = {}, userProfile = {}) {
  const startTime = performance.now();
  
  try {
    // Get RDA values for this user
    const rda = getRDAForProfile(userProfile);

    const deficiencies = [];
    const deficiencyDetails = {};

    // Check only key macros + priority micronutrients
    const nutrientsToCheck = [
      // Macronutrients
      { key: 'protein', threshold: rda.protein },
      { key: 'carbohydrates', threshold: rda.carbohydrates },
      { key: 'fat', threshold: rda.fat },
      { key: 'fiber', threshold: rda.fiber },
      
      // Priority micronutrients (in order of deficiency priority)
      { key: 'iron', threshold: rda.iron },
      { key: 'vitaminB12', threshold: rda.vitaminB12 },
      { key: 'vitaminD', threshold: rda.vitaminD },
      { key: 'calcium', threshold: rda.calcium },
      { key: 'vitaminC', threshold: rda.vitaminC },
      { key: 'zinc', threshold: rda.zinc },
    ];

    // Analyze each nutrient
    nutrientsToCheck.forEach(({ key, threshold }) => {
      const intake = nutrition[key] || 0;
      const analysis = calculateDeficiencyLevel(intake, threshold);

      deficiencyDetails[key] = {
        intake,
        requirement: threshold,
        percentage: analysis.percentage,
        level: analysis.level,
        label: getNutrientLabel(key),
      };

      // Only flag if deficient
      if (analysis.level !== 'ok') {
        deficiencies.push({
          nutrient: key,
          label: getNutrientLabel(key),
          intake,
          requirement: threshold,
          percentage: analysis.percentage,
          severity: analysis.level, // 'low' or 'critical'
          unit: getUnit(key),
        });
      }
    });

    // Sort by severity (critical first) then by priority
    deficiencies.sort((a, b) => {
      // Critical before low
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1;
      }
      // Then by priority
      const aPriority = DEFICIENCY_PRIORITIES.indexOf(a.nutrient);
      const bPriority = DEFICIENCY_PRIORITIES.indexOf(b.nutrient);
      return aPriority - bPriority;
    });

    logNutritionAudit('deficiency_analysis_complete', {
      deficiencyCount: deficiencies.length,
      userRegion: userProfile.region,
      time_ms: performance.now() - startTime,
    });

    return {
      hasSevereDeficiency: deficiencies.some(d => d.severity === 'critical'),
      deficienciesCount: deficiencies.length,
      deficiencies: deficiencies.slice(0, 5), // Top 5 deficiencies
      allDeficiencies: deficiencies,
      details: deficiencyDetails,
      rda,
      summary: generateDeficiencySummary(deficiencies),
    };
  } catch (error) {
    logNutritionAudit('deficiency_analysis_error', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Check single meal for macronutrient balance
 * Returns warnings if imbalanced
 */
function checkMealBalance(mealNutrition = {}) {
  const warnings = [];

  const protein = mealNutrition.protein || 0;
  const carbs = mealNutrition.carbohydrates || 0;
  const fat = mealNutrition.fat || 0;
  const calories = mealNutrition.calories || 0;

  if (calories === 0) return warnings;

  const proteinPercent = (protein * 4) / calories * 100;
  const carbsPercent = (carbs * 4) / calories * 100;
  const fatPercent = (fat * 9) / calories * 100;

  // ICMR target: ~15% protein, ~60% carbs, ~25% fat (typical for Indian diet)
  // But allow flexibility: protein 10-25%, carbs 45-65%, fat 20-35%

  if (proteinPercent < 10) {
    warnings.push({
      type: 'low_protein',
      message: 'This meal is low in protein. Consider adding eggs, dal, or paneer.',
      severity: 'warning',
    });
  }

  if (carbsPercent > 70) {
    warnings.push({
      type: 'high_carbs',
      message: 'This meal is very high in carbs. Balance with protein or vegetables.',
      severity: 'info',
    });
  }

  if (fatPercent < 15) {
    warnings.push({
      type: 'low_fat',
      message: 'This meal is low in healthy fats. Add nuts, ghee, or oil.',
      severity: 'info',
    });
  }

  return warnings;
}

/**
 * Get food recommendations to fix specific deficiency
 */
function getDeficiencyFix(nutrientKey, userProfile = {}) {
  const foodRecommendations = {
    iron: {
      vegetarian: ['spinach', 'dal', 'jaggery', 'pomegranate', 'fortified cereals'],
      nonVeg: ['red meat', 'chicken liver', 'fish', 'eggs', 'oysters'],
    },
    vitaminB12: {
      vegetarian: ['fortified milk', 'curd', 'paneer', 'fortified cereals'],
      nonVeg: ['eggs', 'chicken', 'fish', 'beef', 'dairy products'],
    },
    vitaminD: {
      vegetarian: ['fortified milk', 'mushrooms', 'fortified cereals'],
      nonVeg: ['fatty fish', 'salmon', 'mackerel', 'egg yolks', 'dairy'],
    },
    calcium: {
      vegetarian: ['milk', 'curd', 'paneer', 'ragi', 'sesame seeds'],
      nonVeg: ['milk', 'curd', 'fish with bones', 'salmon'],
    },
    vitaminC: {
      vegetarian: ['orange', 'lemon', 'mango', 'guava', 'kiwi', 'tomato'],
      nonVeg: ['orange', 'lemon', 'mango', 'guava', 'kiwi', 'tomato'],
    },
    zinc: {
      vegetarian: ['pumpkin seeds', 'sesame seeds', 'cashew', 'lentils', 'oats'],
      nonVeg: ['red meat', 'chicken', 'shellfish', 'eggs', 'dairy'],
    },
    protein: {
      vegetarian: ['dal', 'paneer', 'milk', 'curd', 'nuts', 'seeds'],
      nonVeg: ['chicken', 'fish', 'eggs', 'beef', 'milk', 'curd'],
    },
    fiber: {
      vegetarian: ['whole grains', 'dal', 'vegetables', 'fruits', 'oats'],
      nonVeg: ['whole grains', 'dal', 'vegetables', 'fruits', 'oats'],
    },
  };

  const dietType = userProfile.dietType === 'veg' || userProfile.dietType === 'vegetarian' ? 'vegetarian' : 'nonVeg';
  
  return {
    nutrient: nutrientKey,
    label: getNutrientLabel(nutrientKey),
    suggestions: foodRecommendations[nutrientKey]?.[dietType] || [],
    advice: getDeficiencyAdvice(nutrientKey),
  };
}

/**
 * Get personalized advice for deficiency
 */
function getDeficiencyAdvice(nutrientKey) {
  const advice = {
    iron: '🩸 Iron deficiency is common in India. Include iron-rich foods daily and pair with vitamin C for better absorption.',
    vitaminB12: '💊 B12 is crucial for nerve health. Vegetarians especially need fortified foods or supplements.',
    vitaminD: '☀️ Get 15-20 minutes of sunlight daily. Vitamin D regulates calcium absorption and immune function.',
    calcium: '🥛 Strong bones need calcium. Include dairy or fortified alternatives daily.',
    vitaminC: '🍊 Vitamin C boosts immunity and iron absorption. Fresh fruits and vegetables are best.',
    zinc: '⚙️ Zinc supports immunity and growth. Plant-based sources are less absorbable; may need higher intake.',
    protein: '💪 Protein is essential for muscle, hair, and immune health. Include at every meal.',
    fiber: '🌾 Fiber aids digestion and heart health. Include whole grains, vegetables, and fruits.',
  };

  return advice[nutrientKey] || '';
}

/**
 * Generate human-readable summary
 */
function generateDeficiencySummary(deficiencies) {
  if (deficiencies.length === 0) {
    return "✅ Great! Your nutrition is well-balanced.";
  }

  const critical = deficiencies.filter(d => d.severity === 'critical');
  const low = deficiencies.filter(d => d.severity === 'low');

  let summary = '';

  if (critical.length > 0) {
    const nutrients = critical.map(d => d.label).join(', ');
    summary += `⚠️ Critical deficiency: ${nutrients}. `;
  }

  if (low.length > 0) {
    const nutrients = low.map(d => d.label).join(', ');
    summary += `⚡ Low intake: ${nutrients}.`;
  }

  return summary.trim();
}

/**
 * Get unit for nutrient display
 */
function getUnit(nutrientKey) {
  const units = {
    calories: 'kcal',
    protein: 'g',
    carbohydrates: 'g',
    fat: 'g',
    fiber: 'g',
    iron: 'mg',
    calcium: 'mg',
    vitaminD: 'mcg',
    vitaminB12: 'mcg',
    vitaminC: 'mg',
    zinc: 'mg',
    magnesium: 'mg',
    potassium: 'mg',
    folate: 'mcg',
  };

  return units[nutrientKey] || '';
}

module.exports = {
  analyzeDailyDeficiencies,
  checkMealBalance,
  getDeficiencyFix,
  getDeficiencyAdvice,
  getUnit,
};
