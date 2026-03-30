const Meal = require("../models/Meal");

// Helper to safely calculate average for nested nutrition fields
function aggregateNutrition(meals) {
  const totalMeals = meals.length;

  if (totalMeals === 0) {
    return {
      avgMacros: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        saturatedFat: 0,
      },
      avgVitamins: {
        vitaminA: 0,
        vitaminB1: 0,
        vitaminB2: 0,
        vitaminB3: 0,
        vitaminB6: 0,
        vitaminB12: 0,
        vitaminC: 0,
        vitaminD: 0,
        vitaminE: 0,
        vitaminK: 0,
        folate: 0,
      },
      avgMinerals: {
        calcium: 0,
        iron: 0,
        magnesium: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0,
      },
      totalMeals: 0,
    };
  }

  const accumulator = {
    macros: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      saturatedFat: 0,
    },
    vitamins: {
      vitaminA: 0,
      vitaminB1: 0,
      vitaminB2: 0,
      vitaminB3: 0,
      vitaminB6: 0,
      vitaminB12: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
      folate: 0,
    },
    minerals: {
      calcium: 0,
      iron: 0,
      magnesium: 0,
      potassium: 0,
      sodium: 0,
      zinc: 0,
    },
  };

  // Sum all nutrition values from meals
  meals.forEach((meal) => {
    // Aggregate macros
    if (meal.macros) {
      Object.keys(accumulator.macros).forEach((key) => {
        accumulator.macros[key] += meal.macros[key] || 0;
      });
    }

    // Aggregate vitamins
    if (meal.vitamins) {
      Object.keys(accumulator.vitamins).forEach((key) => {
        accumulator.vitamins[key] += meal.vitamins[key] || 0;
      });
    }

    // Aggregate minerals
    if (meal.minerals) {
      Object.keys(accumulator.minerals).forEach((key) => {
        accumulator.minerals[key] += meal.minerals[key] || 0;
      });
    }
  });

  // Calculate averages
  const averages = {
    avgMacros: {},
    avgVitamins: {},
    avgMinerals: {},
  };

  Object.keys(accumulator.macros).forEach((key) => {
    averages.avgMacros[key] = parseFloat(
      (accumulator.macros[key] / totalMeals).toFixed(2)
    );
  });

  Object.keys(accumulator.vitamins).forEach((key) => {
    averages.avgVitamins[key] = parseFloat(
      (accumulator.vitamins[key] / totalMeals).toFixed(2)
    );
  });

  Object.keys(accumulator.minerals).forEach((key) => {
    averages.avgMinerals[key] = parseFloat(
      (accumulator.minerals[key] / totalMeals).toFixed(2)
    );
  });

  return {
    ...averages,
    totalMeals,
  };
}

// @route GET /api/analytics/daily
exports.getDailyAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const meals = await Meal.find({
      userId: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalMeals = meals.length;

    if (totalMeals === 0) {
      return res.status(200).json({
        message: "No meals logged today.",
        date: now.toLocaleDateString(),
        totalMeals: 0,
        avgMacros: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          saturatedFat: 0,
        },
        avgVitamins: {
          vitaminA: 0,
          vitaminB1: 0,
          vitaminB2: 0,
          vitaminB3: 0,
          vitaminB6: 0,
          vitaminB12: 0,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0,
          vitaminK: 0,
          folate: 0,
        },
        avgMinerals: {
          calcium: 0,
          iron: 0,
          magnesium: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
        },
        calorieStatus: "LOW",
        proteinStatus: "LOW",
      });
    }

    // Aggregate nutrition data
    const analytics = aggregateNutrition(meals);

    // Determine calorie status
    let calorieStatus;
    if (analytics.avgMacros.calories < 1800) calorieStatus = "LOW";
    else if (analytics.avgMacros.calories <= 2500) calorieStatus = "NORMAL";
    else calorieStatus = "EXCESS";

    // Determine protein status
    let proteinStatus;
    if (analytics.avgMacros.protein < 40) proteinStatus = "LOW";
    else if (analytics.avgMacros.protein <= 80) proteinStatus = "NORMAL";
    else proteinStatus = "EXCESS";

    res.status(200).json({
      date: now.toLocaleDateString(),
      totalMeals: analytics.totalMeals,
      avgMacros: analytics.avgMacros,
      avgVitamins: analytics.avgVitamins,
      avgMinerals: analytics.avgMinerals,
      calorieStatus,
      proteinStatus,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Server error while computing analytics." });
  }
};

// @route GET /api/analytics/weekly
exports.getWeeklyAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      userId: req.user.id,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const totalMeals = meals.length;

    if (totalMeals === 0) {
      return res.status(200).json({
        message: "No meals logged this week.",
        week: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
        totalMeals: 0,
        avgMacros: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          saturatedFat: 0,
        },
        avgVitamins: {
          vitaminA: 0,
          vitaminB1: 0,
          vitaminB2: 0,
          vitaminB3: 0,
          vitaminB6: 0,
          vitaminB12: 0,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0,
          vitaminK: 0,
          folate: 0,
        },
        avgMinerals: {
          calcium: 0,
          iron: 0,
          magnesium: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
        },
        calorieStatus: "LOW",
        proteinStatus: "LOW",
      });
    }

    // Aggregate nutrition data
    const analytics = aggregateNutrition(meals);

    // Determine calorie status
    let calorieStatus;
    if (analytics.avgMacros.calories < 1800) calorieStatus = "LOW";
    else if (analytics.avgMacros.calories <= 2500) calorieStatus = "NORMAL";
    else calorieStatus = "EXCESS";

    // Determine protein status
    let proteinStatus;
    if (analytics.avgMacros.protein < 40) proteinStatus = "LOW";
    else if (analytics.avgMacros.protein <= 80) proteinStatus = "NORMAL";
    else proteinStatus = "EXCESS";

    res.status(200).json({
      week: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      totalMeals: analytics.totalMeals,
      avgMacros: analytics.avgMacros,
      avgVitamins: analytics.avgVitamins,
      avgMinerals: analytics.avgMinerals,
      calorieStatus,
      proteinStatus,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Server error while computing analytics." });
  }
};

// @route GET /api/analytics/monthly
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const meals = await Meal.find({
      userId: req.user.id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalMeals = meals.length;

    if (totalMeals === 0) {
      return res.status(200).json({
        message: "No meals logged this month.",
        month: now.toLocaleString("default", { month: "long", year: "numeric" }),
        totalMeals: 0,
        avgMacros: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          saturatedFat: 0,
        },
        avgVitamins: {
          vitaminA: 0,
          vitaminB1: 0,
          vitaminB2: 0,
          vitaminB3: 0,
          vitaminB6: 0,
          vitaminB12: 0,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0,
          vitaminK: 0,
          folate: 0,
        },
        avgMinerals: {
          calcium: 0,
          iron: 0,
          magnesium: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
        },
        calorieStatus: "LOW",
        proteinStatus: "LOW",
      });
    }

    // Aggregate nutrition data
    const analytics = aggregateNutrition(meals);

    // Determine calorie status
    let calorieStatus;
    if (analytics.avgMacros.calories < 1800) calorieStatus = "LOW";
    else if (analytics.avgMacros.calories <= 2500) calorieStatus = "NORMAL";
    else calorieStatus = "EXCESS";

    // Determine protein status (daily recommended ~50g average)
    let proteinStatus;
    if (analytics.avgMacros.protein < 40) proteinStatus = "LOW";
    else if (analytics.avgMacros.protein <= 80) proteinStatus = "NORMAL";
    else proteinStatus = "EXCESS";

    res.status(200).json({
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      totalMeals: analytics.totalMeals,
      avgMacros: analytics.avgMacros,
      avgVitamins: analytics.avgVitamins,
      avgMinerals: analytics.avgMinerals,
      calorieStatus,
      proteinStatus,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Server error while computing analytics." });
  }
};
