/**
 * NUTRITION RESPONSE AGGREGATOR
 * 
 * Converts detailed food analysis to production-grade response
 * - ONLY aggregated nutrition (no item-level breakdown)
 * - Key macros: calories, protein, carbs, fats, fiber, sugar
 * - Key micronutrients: iron, calcium, vitamin D, B12, C
 * - Removes verbose item details
 */

/**
 * Aggregate nutrition data from food analysis
 * Returns COMPLETE nutrition matching Meal.js schema structure
 * - ALL macros, vitamins, and minerals from database
 * - Falls back to AI for missing values
 */
function aggregateNutritionResponse(mealAnalysis) {
  const totals = mealAnalysis.macros || {};
  const vitamins = mealAnalysis.vitamins || {};
  const minerals = mealAnalysis.minerals || {};

  // Return COMPLETE nutrition structure matching Meal.js schema
  return {
    // MACRONUTRIENTS (matching Meal.js)
    macros: {
      calories: Math.round(totals.calories || 0),
      protein: Math.round((totals.protein || 0) * 10) / 10,
      carbs: Math.round((totals.carbs || 0) * 10) / 10,
      fat: Math.round((totals.fat || totals.fats || 0) * 10) / 10,
      fiber: Math.round((totals.fiber || 0) * 10) / 10,
      sugar: Math.round((totals.sugar || 0) * 10) / 10,
      saturatedFat: Math.round((totals.saturatedFat || 0) * 10) / 10,
    },

    // VITAMINS (matching Meal.js)
    vitamins: {
      vitaminA: Math.round((vitamins.vitaminA || 0) * 100) / 100,
      vitaminB1: Math.round((vitamins.vitaminB1 || 0) * 100) / 100,
      vitaminB2: Math.round((vitamins.vitaminB2 || 0) * 100) / 100,
      vitaminB3: Math.round((vitamins.vitaminB3 || 0) * 100) / 100,
      vitaminB6: Math.round((vitamins.vitaminB6 || 0) * 100) / 100,
      vitaminB12: Math.round((vitamins.vitaminB12 || 0) * 100) / 100,
      vitaminC: Math.round((vitamins.vitaminC || 0) * 10) / 10,
      vitaminD: Math.round((vitamins.vitaminD || 0) * 100) / 100,
      vitaminE: Math.round((vitamins.vitaminE || 0) * 100) / 100,
      vitaminK: Math.round((vitamins.vitaminK || 0) * 10) / 10,
      folate: Math.round((vitamins.folate || 0) * 10) / 10,
    },

    // MINERALS (matching Meal.js)
    minerals: {
      calcium: Math.round((minerals.calcium || 0) * 10) / 10,
      iron: Math.round((minerals.iron || 0) * 100) / 100,
      magnesium: Math.round((minerals.magnesium || 0) * 10) / 10,
      potassium: Math.round((minerals.potassium || 0) * 10) / 10,
      sodium: Math.round((minerals.sodium || 0) * 10) / 10,
      zinc: Math.round((minerals.zinc || 0) * 100) / 100,
    },

    // Metadata
    source: mealAnalysis.source || 'database',
    confidence: mealAnalysis.confidence || 'high',
    analysisType: 'AI Nutrition Analysis',
  };
}

/**
 * Clean up response for frontend consumption
 * Removes unnecessary fields and verbose data
 */
function cleanResponseForFrontend(analysisResponse, deficiencies, suggestions) {
  return {
    // User input
    input: analysisResponse.input,

    // Aggregated nutrition ONLY (no item breakdown)
    nutrition: {
      aggregatedNutrition: analysisResponse.aggregatedNutrition,
      keyMicronutrients: analysisResponse.keyMicronutrients,
      source: analysisResponse.source,
      confidence: analysisResponse.confidence,
      analysisType: 'AI Nutrition Analysis', // Replace "Database" label
    },

    // Deficiency analysis
    deficiencies: {
      hasSevereDeficiency: deficiencies?.hasSevereDeficiency || false,
      deficienciesCount: deficiencies?.deficienciesCount || 0,
      // Top 3 deficiencies with actionable suggestions
      deficiencies: (deficiencies?.deficiencies || []).slice(0, 3),
      summary: deficiencies?.summary || '',
    },

    // Smart suggestions (3-tier: region, meal-balance, deficiency)
    suggestions: suggestions || [],

    // Metadata
    timestamp: new Date().toISOString(),
    responseType: 'nutrition_analysis',
  };
}

/**
 * Build recommendation string based on macros and goals
 */
function getMacroRecommendation(nutrition, goal = 'maintain') {
  const calories = nutrition.aggregatedNutrition?.calories || 0;
  const protein = nutrition.aggregatedNutrition?.protein || 0;
  const carbs = nutrition.aggregatedNutrition?.carbs || 0;

  if (goal === 'lose_weight') {
    if (calories < 300) {
      return '✅ Great portion size for weight loss';
    } else if (calories < 500) {
      return '💡 Moderate portion. Consider adding vegetables to increase volume without calories';
    } else {
      return '⚠️ High calories for weight loss. Try reducing portion size';
    }
  }

  if (goal === 'gain_weight') {
    if (calories < 400) {
      return '💡 Consider adding calorie-dense foods like nuts, oils, or dairy';
    } else if (protein < 20) {
      return '⚠️ Low protein for muscle gain. Add proteinsources';
    } else {
      return '✅ Good calorie and protein intake for weight gain';
    }
  }

  // maintain
  const hasBalance = protein > 10 && carbs > 20;
  if (hasBalance) {
    return '✅ Well-balanced meal with good macro distribution';
  }
  return '💡 Tip: Try adding more protein or complex carbs to balance this meal';
}

/**
 * Convert aggregated nutrition to RDA comparison format
 * Used for deficiency detection
 */
function getNutritionForDeficiencyCheck(aggregatedResponse) {
  return {
    calories: aggregatedResponse.macros.calories,
    protein: aggregatedResponse.macros.protein,
    carbohydrates: aggregatedResponse.macros.carbs,
    fat: aggregatedResponse.macros.fat,
    fiber: aggregatedResponse.macros.fiber,
    sugar: aggregatedResponse.macros.sugar,
    
    // Micronutrients
    iron: aggregatedResponse.minerals.iron,
    calcium: aggregatedResponse.minerals.calcium,
    vitaminD: aggregatedResponse.vitamins.vitaminD,
    vitaminB12: aggregatedResponse.vitamins.vitaminB12,
    vitaminC: aggregatedResponse.vitamins.vitaminC,
    zinc: aggregatedResponse.minerals.zinc,
    magnesium: aggregatedResponse.minerals.magnesium,
    potassium: aggregatedResponse.minerals.potassium,
  };
}

module.exports = {
  aggregateNutritionResponse,
  cleanResponseForFrontend,
  getMacroRecommendation,
  getNutritionForDeficiencyCheck,
};
