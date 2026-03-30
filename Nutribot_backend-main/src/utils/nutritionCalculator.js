/**
 * Nutrition Calculation Utilities
 * Includes TDEE, target calculation, deficiency logic, and recommendation generation
 */

/**
 * Calculate TDEE using Mifflin-St Jeor equation
 * @param {number} height - Height in cm
 * @param {number} weight - Weight in kg
 * @param {number} age - Age in years
 * @param {string} gender - "male" or "female"
 * @param {string} activityLevel - "sedentary" | "light" | "moderate" | "active" | "veryActive"
 * @returns {number} Daily calorie requirement
 */
const calculateTDEE = (height, weight, age, gender, activityLevel = "moderate") => {
  if (!height || !weight || !age) return 2000; // Default fallback

  // Mifflin-St Jeor BMR calculation
  let BMR;
  if (gender === "male") {
    BMR = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    BMR = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,       // Little or no exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    active: 1.725,        // Hard exercise 6-7 days/week
    veryActive: 1.9,      // Very hard exercise, physical job
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const TDEE = BMR * multiplier;

  return Math.round(TDEE);
};

/**
 * Calculate goal-based nutrition targets
 * @param {object} profile - User profile with height, weight, age, gender, goal, dietType
 * @param {number} tdee - Total Daily Energy Expenditure
 * @returns {object} Target macronutrients and micronutrients
 */
const calculateGoalTargets = (profile, tdee = null) => {
  const {
    height,
    weight,
    age,
    gender,
    goal,
    dietType,
    activityLevel = "moderate",
  } = profile;

  // Calculate TDEE if not provided
  const calculatedTDEE = tdee || calculateTDEE(height, weight, age, gender, activityLevel);

  const targets = {
    dailyCalories: calculatedTDEE,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 25,
    water: 2000,
    sugar: 25, // Max recommended
    saturatedFat: 20, // Max recommended
    // Micronutrients (RDA values)
    vitaminA: 900, // mcg for males, 700 for females
    vitaminC: 90, // mg for males, 75 for females
    vitaminD: 20, // mcg
    vitaminB12: 2.4, // mcg
    calcium: 1000, // mg
    iron: gender === "male" ? 8 : 18, // mg
    zinc: gender === "male" ? 11 : 8, // mg
    magnesium: gender === "male" ? 400 : 310, // mg
  };

  // Adjust for goal
  if (goal === "lose_weight") {
    // 15-20% calorie deficit
    targets.dailyCalories = Math.round(calculatedTDEE * 0.85);
    // High protein to preserve muscle: 2.0g per kg body weight
    targets.protein = Math.round(weight * 2.0);
    // Carbs: 35-40% of calories
    targets.carbs = Math.round((targets.dailyCalories * 0.375) / 4);
    // Fats: 25-30% of calories
    targets.fats = Math.round((targets.dailyCalories * 0.275) / 9);
    // High fiber for satiety
    targets.fiber = 30;
    // Low sugar target
    targets.sugar = 20;
  } else if (goal === "gain_weight") {
    // 10-15% calorie surplus
    targets.dailyCalories = Math.round(calculatedTDEE * 1.12);
    // High protein for muscle building: 2.2g per kg body weight
    targets.protein = Math.round(weight * 2.2);
    // Carbs: 45-55% of calories
    targets.carbs = Math.round((targets.dailyCalories * 0.50) / 4);
    // Fats: 20-25% of calories
    targets.fats = Math.round((targets.dailyCalories * 0.225) / 9);
    // Higher magnesium and zinc for recovery
    targets.magnesium = gender === "male" ? 420 : 320;
    targets.zinc = gender === "male" ? 15 : 12;
  } else {
    // Maintain: balanced macros
    targets.dailyCalories = calculatedTDEE;
    // Protein: 1.6g per kg body weight for maintenance
    targets.protein = Math.round(weight * 1.6);
    // Carbs: 45-65% of calories
    targets.carbs = Math.round((targets.dailyCalories * 0.55) / 4);
    // Fats: 20-35% of calories
    targets.fats = Math.round((targets.dailyCalories * 0.275) / 9);
  }

  // Diet-type specific adjustments
  if (dietType === "vegan" || dietType === "veg") {
    // Increase iron target for plant-based sources
    targets.iron = gender === "male" ? 16 : 32;
    // Highlight B12 need
    targets.vitaminB12 = 2.4;
    // Increase calcium if vegan
    if (dietType === "vegan") {
      targets.calcium = 1200;
    }
  }

  return targets;
};

/**
 * Calculate nutrient deficiency status
 * @param {number} actual - Actual intake
 * @param {number} target - Target intake
 * @returns {object} Status object with percentage, status, and severity
 */
const calculateDeficiencyStatus = (actual, target) => {
  if (!target || target === 0) {
    return { percentage: 0, status: "low", severity: "minor" };
  }

  const percentage = (actual / target) * 100;

  let status = "optimal";
  let severity = "minor";

  if (percentage < 60) {
    status = "deficient";
    severity = "critical";
  } else if (percentage < 85) {
    status = "low";
    severity = "moderate";
  } else if (percentage > 115) {
    status = "excess";
    severity = "minor";
  }

  return {
    percentage: Math.round(percentage),
    status,
    severity,
    actual: Math.round(actual * 10) / 10,
    target: Math.round(target * 10) / 10,
  };
};

/**
 * Check for dietary alerts
 * @param {object} totals - Current day totals
 * @param {object} targets - Target values
 * @param {array} dailyBreakdown - Last 7 days of data
 * @param {string} dietType - User's diet type
 * @returns {array} Array of alerts
 */
const generateAlerts = (totals, targets, dailyBreakdown = [], dietType = "non-veg") => {
  const alerts = [];

  // Check current day deficiencies
  const caloriePercent = (totals.calories / targets.dailyCalories) * 100;
  const proteinPercent = (totals.protein / targets.protein) * 100;
  const fiberPercent = (totals.fiber / targets.fiber) * 100;
  const waterPercent = (totals.water / targets.water) * 100;

  // Current day alerts
  if (totals.calories < 800) {
    alerts.push({
      type: "low_calories",
      priority: "critical",
      message: "⚠️ Critical: You've logged less than 800 calories today. This is dangerously low.",
    });
  } else if (caloriePercent < 50) {
    alerts.push({
      type: "low_calories",
      priority: "warning",
      message: `🔥 You are only at ${Math.round(caloriePercent)}% of your calorie goal.`,
    });
  }

  if (proteinPercent < 50) {
    alerts.push({
      type: "low_protein",
      priority: "critical",
      message: `💪 Critical: You are only at ${Math.round(proteinPercent)}% of your protein goal. This impacts muscle preservation.`,
    });
  } else if (proteinPercent < 75) {
    alerts.push({
      type: "low_protein",
      priority: "warning",
      message: `💪 You are at ${Math.round(proteinPercent)}% of your protein goal. Try to increase it.`,
    });
  }

  if (fiberPercent < 50) {
    alerts.push({
      type: "low_fiber",
      priority: "warning",
      message: `🌾 You are at ${Math.round(fiberPercent)}% of your fiber goal. Add whole grains or vegetables.`,
    });
  }

  if (totals.sugar > targets.sugar) {
    const sugarOverage = totals.sugar - targets.sugar;
    alerts.push({
      type: "excess_sugar",
      priority: "info",
      message: `🍬 You've consumed ${Math.round(sugarOverage)}g above your recommended sugar limit.`,
    });
  }

  if (totals.fats > targets.fats * 1.2) {
    alerts.push({
      type: "excess_fat",
      priority: "info",
      message: `🫒 Fat intake is above target. Consider choosing healthier fat sources.`,
    });
  }

  if (waterPercent < 50) {
    alerts.push({
      type: "low_water",
      priority: "info",
      message: `💧 You are only at ${Math.round(waterPercent)}% of your water goal. Drink more water!`,
    });
  }

  // Diet-specific alerts
  if (dietType === "veg" || dietType === "vegan") {
    alerts.push({
      type: "vegetarian_b12",
      priority: "info",
      message: "💊 As a vegetarian, ensure you have adequate B12 (fortified milk, supplements, or eggs).",
    });

    if (dietType === "vegan") {
      alerts.push({
        type: "vegetarian_iron",
        priority: "info",
        message: "🥗 Pair plant-based iron sources with vitamin C for better absorption.",
      });
    }
  }

  // Check multi-day patterns in dailyBreakdown
  if (dailyBreakdown && dailyBreakdown.length >= 3) {
    const last3Days = dailyBreakdown.slice(-3);
    const lowCalorieCount = last3Days.filter(
      (d) => (d.calories / targets.dailyCalories) * 100 < 60
    ).length;

    if (lowCalorieCount >= 2) {
      alerts.push({
        type: "low_calories",
        priority: "critical",
        message: `⚠️ You've been below calorie target for ${lowCalorieCount} of the last 3 days. This can impact your goals.`,
      });
    }

    const lowProteinCount = last3Days.filter(
      (d) => (d.protein / targets.protein) * 100 < 40
    ).length;

    if (lowProteinCount >= 3) {
      alerts.push({
        type: "low_protein",
        priority: "critical",
        message: `💪 Critical: You've been below 40% of protein target for 3 consecutive days.`,
      });
    }
  }

  return alerts;
};

/**
 * Calculate achievement streaks
 * @param {array} dailyBreakdown - Last 7-30 days of data
 * @param {object} targets - Target values
 * @returns {object} Streak counts
 */
const calculateStreaks = (dailyBreakdown = [], targets = {}) => {
  const streaks = {
    proteinGoal: 0,
    calorieGoal: 0,
    fiberGoal: 0,
    mealsLogged: 0,
  };

  if (!dailyBreakdown || dailyBreakdown.length === 0) {
    return streaks;
  }

  // Sort by date descending (most recent first)
  const sortedDays = [...dailyBreakdown].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Count consecutive days from most recent going backwards
  for (const day of sortedDays) {
    // Protein streak
    if ((day.protein / targets.protein) * 100 >= 85) {
      streaks.proteinGoal++;
    } else {
      break; // Break streak
    }
  }

  // Reset for next metric
  let streak = 0;
  for (const day of sortedDays) {
    // Calorie streak (within 10% of target)
    const calorieVariance = Math.abs(day.calories - targets.dailyCalories) / targets.dailyCalories;
    if (calorieVariance <= 0.1) {
      streak++;
    } else {
      break;
    }
  }
  streaks.calorieGoal = streak;

  // Fiber streak
  streak = 0;
  for (const day of sortedDays) {
    if ((day.fiber / targets.fiber) * 100 >= 85) {
      streak++;
    } else {
      break;
    }
  }
  streaks.fiberGoal = streak;

  // Meals logged streak
  streak = 0;
  for (const day of sortedDays) {
    if (day.mealsLogged > 0) {
      streak++;
    } else {
      break;
    }
  }
  streaks.mealsLogged = streak;

  return streaks;
};

/**
 * Calculate overall nutrition score
 * @param {object} totals - Daily totals
 * @param {object} targets - Target values
 * @param {string} goal - User's goal
 * @returns {object} Score and quality level
 */
const calculateNutritionScore = (totals, targets, goal = "maintain") => {
  let score = 0;

  // Protein: 25 points
  const proteinPercent = Math.min((totals.protein / targets.protein) * 100, 100);
  score += (proteinPercent / 100) * 25;

  // Fiber: 20 points
  const fiberPercent = Math.min((totals.fiber / targets.fiber) * 100, 100);
  score += (fiberPercent / 100) * 20;

  // Calories: 25 points (bonus for being within 5-10% of target)
  const calorieVariance = Math.abs(totals.calories - targets.dailyCalories) / targets.dailyCalories;
  let calorieScore = 0;
  if (calorieVariance <= 0.05) {
    calorieScore = 25;
  } else if (calorieVariance <= 0.1) {
    calorieScore = 20;
  } else if (calorieVariance <= 0.2) {
    calorieScore = 15;
  }
  score += calorieScore;

  // Water: 15 points
  const waterPercent = Math.min((totals.water / targets.water) * 100, 100);
  score += (waterPercent / 100) * 15;

  // Vitamins/Minerals variety: 15 points
  // This would require tracking if vitamins exist in totals
  score += 15; // Simplified for now

  const finalScore = Math.round(Math.min(score, 100));

  // Determine quality level
  let nutritionQuality = "poor";
  if (finalScore >= 85) nutritionQuality = "excellent";
  else if (finalScore >= 70) nutritionQuality = "good";
  else if (finalScore >= 50) nutritionQuality = "fair";

  return {
    score: finalScore,
    quality: nutritionQuality,
  };
};

/**
 * Generate dynamic recommendations
 * @param {object} deficiencies - Array of deficiency objects
 * @param {string} goal - User's goal
 * @param {string} dietType - User's diet type
 * @returns {array} Array of recommendation objects
 */
const generateRecommendations = (deficiencies = [], goal = "maintain", dietType = "non-veg") => {
  const recommendations = [];
  const deficientNutrients = deficiencies.filter((d) => d.status === "deficient");
  const lowNutrients = deficiencies.filter((d) => d.status === "low");

  // Goal-specific recommendations
  if (goal === "lose_weight") {
    if (deficientNutrients.some((d) => d.nutrient === "protein")) {
      if (dietType === "vegan") {
        recommendations.push({
          nutrient: "protein",
          priority: "high",
          tip: "🥗 Add more plant-based proteins: lentils, tofu, tempeh, quinoa, chickpeas. Combine grains + legumes for complete proteins.",
          foods: ["lentils", "tofu", "tempeh", "quinoa", "chickpeas", "nuts"],
        });
      } else if (dietType === "veg") {
        recommendations.push({
          nutrient: "protein",
          priority: "high",
          tip: "🥚 Increase protein with eggs, Greek yogurt, paneer, dal, and legumes. Aim for 30-40g per meal.",
          foods: ["eggs", "paneer", "yogurt", "dal", "legumes"],
        });
      } else {
        recommendations.push({
          nutrient: "protein",
          priority: "high",
          tip: "💪 Lean proteins preserve muscle while losing weight: chicken breast, fish, lean beef. Aim for 30-40g per meal.",
          foods: ["chicken", "fish", "lean_beef", "turkey", "shrimp"],
        });
      }
    }

    if (deficientNutrients.some((d) => d.nutrient === "fiber")) {
      recommendations.push({
        nutrient: "fiber",
        priority: "high",
        tip: "🌾 Fiber keeps you full longer: whole grains, vegetables, fruits, beans. Aim for 30g+ daily.",
        foods: ["whole_wheat", "oats", "broccoli", "spinach", "berries", "beans"],
      });
    }

    if (lowNutrients.some((d) => d.nutrient === "sugar")) {
      recommendations.push({
        nutrient: "sugar",
        priority: "medium",
        tip: "🍬 Reduce added sugars to avoid energy crashes. Choose water over sugary drinks and eat whole fruits instead of processed sweets.",
        foods: ["water", "green_tea", "whole_fruits"],
      });
    }
  } else if (goal === "gain_weight") {
    if (deficientNutrients.some((d) => d.nutrient === "protein")) {
      recommendations.push({
        nutrient: "protein",
        priority: "high",
        tip: "💪 Eat more protein to build muscle: spread 25-40g across 4-5 meals daily, especially post-workout.",
        foods: ["chicken", "fish", "eggs", "paneer", "nuts", "protein_powder"],
      });
    }

    if (deficientNutrients.some((d) => d.nutrient === "calories")) {
      recommendations.push({
        nutrient: "calories",
        priority: "high",
        tip: "🔥 Add 300-500 calories daily: nuts, nut butters, whole milk, avocados, olive oil, dried fruits.",
        foods: ["nuts", "nut_butter", "avocado", "olive_oil", "whole_milk", "dried_fruits"],
      });
    }

    if (deficientNutrients.some((d) => d.nutrient === "zinc")) {
      recommendations.push({
        nutrient: "zinc",
        priority: "medium",
        tip: "⚡ Zinc supports testosterone and recovery: oysters, beef, pumpkin seeds, cashews, chickpeas.",
        foods: ["oysters", "beef", "pumpkin_seeds", "cashews", "chickpeas"],
      });
    }

    if (deficientNutrients.some((d) => d.nutrient === "magnesium")) {
      recommendations.push({
        nutrient: "magnesium",
        priority: "medium",
        tip: "🧲 Magnesium aids muscle recovery: spinach, almonds, pumpkin seeds, dark chocolate, whole grains.",
        foods: ["spinach", "almonds", "pumpkin_seeds", "dark_chocolate", "oats"],
      });
    }
  }

  // Diet-specific recommendations
  if (dietType === "vegan" || dietType === "veg") {
    if (deficientNutrients.some((d) => d.nutrient === "vitamin_b12")) {
      recommendations.push({
        nutrient: "vitamin_b12",
        priority: "high",
        tip: "💊 B12 is not naturally in plant foods. Use fortified plant milk, nutritional yeast, or take a supplement (2.4mcg daily).",
        foods: ["fortified_milk", "nutritional_yeast", "b12_supplement"],
      });
    }

    if (
      deficientNutrients.some((d) => d.nutrient === "iron") ||
      lowNutrients.some((d) => d.nutrient === "iron")
    ) {
      recommendations.push({
        nutrient: "iron",
        priority: "high",
        tip: "🥬 Plant-based iron is absorbed better with vitamin C. Pair: spinach + orange, lentils + tomato sauce.",
        foods: ["spinach", "lentils", "beans", "tofu", "pumpkin_seeds", "orange"],
      });
    }

    if (dietType === "vegan") {
      if (deficientNutrients.some((d) => d.nutrient === "calcium")) {
        recommendations.push({
          nutrient: "calcium",
          priority: "medium",
          tip: "🥛 Vegan calcium sources: fortified plant milk, tofu, sesame seeds, almonds, leafy greens (spinach, kale).",
          foods: ["fortified_milk", "tofu", "sesame_seeds", "almonds", "kale"],
        });
      }
    }
  }

  // Non-veg specific
  if (dietType === "non-veg") {
    if (lowNutrients.some((d) => d.nutrient === "saturated_fat")) {
      recommendations.push({
        nutrient: "saturated_fat",
        priority: "low",
        tip: "🫒 Your fat intake is high. Choose leaner meats, reduce fried foods, use oils instead of butter.",
        foods: ["chicken_breast", "fish", "olive_oil", "nuts"],
      });
    }
  }

  // General recommendations
  if (deficientNutrients.some((d) => d.nutrient === "water")) {
    recommendations.push({
      nutrient: "water",
      priority: "medium",
      tip: "💧 Drink more water: aim for 8-10 cups daily. Flavored water or herbal tea can help.",
      foods: ["water", "herbal_tea", "coconut_water"],
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

module.exports = {
  calculateTDEE,
  calculateGoalTargets,
  calculateDeficiencyStatus,
  generateAlerts,
  calculateStreaks,
  calculateNutritionScore,
  generateRecommendations,
};
