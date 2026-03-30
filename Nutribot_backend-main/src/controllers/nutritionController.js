const DailyStats = require("../models/DailyStats");
const UserProfile = require("../models/UserProfile");
const NutritionSummary = require("../models/NutritionSummary");
const {
  calculateTDEE,
  calculateGoalTargets,
  calculateDeficiencyStatus,
  generateAlerts,
  calculateStreaks,
  calculateNutritionScore,
  generateRecommendations,
} = require("../utils/nutritionCalculator");

/**
 * GET /api/nutrition/summary
 * Fetch aggregated nutrition data with deficiency analysis
 * Query params: period (today|week|month), startDate, endDate
 */
const getNutritionSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let { period = "week", startDate, endDate } = req.query;

    // Normalize period parameter
    if (period === "daily") period = "today";
    if (period === "weekly") period = "week";
    if (period === "monthly") period = "month";

    // Fetch user profile for targets
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please complete onboarding.",
      });
    }

    // Calculate date range based on period
    let queryStartDate, queryEndDate;
    const now = new Date();
    queryEndDate = new Date(now);
    queryEndDate.setHours(23, 59, 59, 999);

    if (period === "today") {
      // Today only
      queryStartDate = new Date(now);
      queryStartDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      // Last 7 days (including today)
      queryStartDate = new Date(queryEndDate);
      queryStartDate.setDate(queryStartDate.getDate() - 6);
      queryStartDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      // Last 30 days (including today)
      queryStartDate = new Date(queryEndDate);
      queryStartDate.setDate(queryStartDate.getDate() - 29);
      queryStartDate.setHours(0, 0, 0, 0);
    } else {
      // Default to week
      queryStartDate = new Date(queryEndDate);
      queryStartDate.setDate(queryStartDate.getDate() - 6);
      queryStartDate.setHours(0, 0, 0, 0);
    }

    // Override with custom dates if provided
    if (startDate) queryStartDate = new Date(startDate);
    if (endDate) queryEndDate = new Date(endDate);

    // Fetch daily stats for the period
    const dailyStatsArray = await DailyStats.find({
      userId,
      date: {
        $gte: queryStartDate,
        $lt: queryEndDate,
      },
    }).sort({ date: -1 });

    console.log(`\n📊 Period: ${period}`);
    console.log(`📅 Date Range: ${queryStartDate.toDateString()} to ${queryEndDate.toDateString()}`);
    console.log(`📈 Stats found: ${dailyStatsArray.length} days`);
    
    // Detailed meal count logging
    const detailedStats = dailyStatsArray.map(s => ({
      date: s.date,
      calories: s.totals?.calories,
      mealsLogged: s.mealsLogged,
      mealIds: s.meals?.length || 0
    }));
    console.log(`💾 Daily Stats:`, detailedStats);
    
    // Total meal count
    const totalMealsInPeriod = dailyStatsArray.reduce((sum, s) => sum + (s.mealsLogged || 0), 0);
    console.log(`🍽️ TOTAL MEALS IN PERIOD: ${totalMealsInPeriod}`);

    // Calculate targets
    const TDEE = calculateTDEE(
      userProfile.height,
      userProfile.weight,
      userProfile.age,
      userProfile.gender,
      userProfile.activityLevel
    );

    const targets = calculateGoalTargets(userProfile, TDEE);

    // Aggregate data - use the actual period value
    const aggregated = aggregateNutritionData(dailyStatsArray, period);

    // Get daily breakdown for trends
    const dailyBreakdown = dailyStatsArray
      .reverse()
      .map((stat) => ({
        date: stat.date,
        calories: stat.totals.calories,
        protein: stat.totals.protein,
        carbs: stat.totals.carbs,
        fats: stat.totals.fats,
        fiber: stat.totals.fiber,
        water: stat.totals.water,
        mealsLogged: stat.mealsLogged,
      }));

    // Calculate deficiencies
    const deficiencies = calculateDeficiencies(aggregated, targets);

    // Generate alerts
    const alerts = generateAlerts(
      aggregated,
      targets,
      dailyBreakdown,
      userProfile.dietType
    );

    // Calculate streaks
    const streaks = calculateStreaks(dailyBreakdown, targets);

    // Calculate nutrition score
    const scoreData = calculateNutritionScore(aggregated, targets, userProfile.goal);

    // Generate recommendations
    const recommendations = generateRecommendations(
      deficiencies,
      userProfile.goal,
      userProfile.dietType
    );

    // Build response
    const summary = {
      userId,
      period,
      startDate: queryStartDate,
      endDate: queryEndDate,
      userProfile: {
        goal: userProfile.goal,
        dietType: userProfile.dietType,
        activityLevel: userProfile.activityLevel,
        height: userProfile.height,
        weight: userProfile.weight,
      },
      targets,
      aggregated,
      dailyBreakdown,
      deficiencies,
      alerts,
      streaks,
      overallScore: scoreData.score,
      nutritionQuality: scoreData.quality,
      recommendations,
      metricsCount: {
        deficienciesCount: deficiencies.filter((d) => d.status === "deficient").length,
        lowCount: deficiencies.filter((d) => d.status === "low").length,
        optimalCount: deficiencies.filter((d) => d.status === "optimal").length,
        excessCount: deficiencies.filter((d) => d.status === "excess").length,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching nutrition summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nutrition summary",
      error: error.message,
    });
  }
};

/**
 * Helper: Aggregate nutrition data for a period
 */
function aggregateNutritionData(dailyStatsArray, period) {
  const aggregated = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    water: 0,
    saturatedFat: 0,
    vitaminA: 0,
    vitaminB12: 0,
    vitaminC: 0,
    vitaminD: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0,
    mealsLogged: 0,
  };

  if (dailyStatsArray.length === 0) {
    return aggregated; // Return zeros if no data
  }

  // Sum all days
  dailyStatsArray.forEach((stat) => {
    aggregated.calories += stat.totals.calories || 0;
    aggregated.protein += stat.totals.protein || 0;
    aggregated.carbs += stat.totals.carbs || 0;
    aggregated.fats += stat.totals.fats || 0;
    aggregated.fiber += stat.totals.fiber || 0;
    aggregated.sugar += stat.totals.sugar || 0;
    aggregated.water += stat.totals.water || 0;
    aggregated.saturatedFat += stat.totals.saturatedFat || 0;
    aggregated.mealsLogged += stat.mealsLogged || 0;

    // Vitamins and minerals
    Object.keys(stat.vitamins || {}).forEach((key) => {
      aggregated[key] = (aggregated[key] || 0) + (stat.vitamins[key] || 0);
    });
    
    // Also sum minerals properly
    Object.keys(stat.minerals || {}).forEach((key) => {
      aggregated[key] = (aggregated[key] || 0) + (stat.minerals[key] || 0);
    });
  });

  // For daily view, return just today's totals (no averaging)
  // For weekly and monthly, return the sum of all days (not averaged)
  // This way users see: Today's total < Week's total < Month's total
  
  console.log(`\n🔢 AGGREGATION RESULT:`);
  console.log(`   Period: ${period}`);
  console.log(`   Days included: ${dailyStatsArray.length}`);
  console.log(`   Total Calories: ${aggregated.calories}`);
  console.log(`   Total Protein: ${aggregated.protein}g`);
  console.log(`   Total Carbs: ${aggregated.carbs}g`);
  console.log(`   🍽️ TOTAL MEALS LOGGED: ${aggregated.mealsLogged}`);
  console.log(`\n   Breakdown by day:`);
  dailyStatsArray.forEach(stat => {
    console.log(`      ${stat.date.toDateString()}: ${stat.mealsLogged} meals (IDs: ${stat.meals?.length || 0})`);
  });
  console.log(`\n`);

  return aggregated;
}

/**
 * Helper: Calculate deficiencies
 */
function calculateDeficiencies(aggregated, targets) {
  const nutrientMap = [
    { key: "calories", label: "Calories", icon: "🔥" },
    { key: "protein", label: "Protein", icon: "💪" },
    { key: "carbs", label: "Carbs", icon: "🌾" },
    { key: "fats", label: "Fats", icon: "🫒" },
    { key: "fiber", label: "Fiber", icon: "🌱" },
    { key: "sugar", label: "Sugar", icon: "🍬" },
    { key: "water", label: "Water", icon: "💧" },
    { key: "vitaminA", label: "Vitamin A", icon: "👁️" },
    { key: "vitaminB12", label: "Vitamin B12", icon: "🥚" },
    { key: "vitaminC", label: "Vitamin C", icon: "🍊" },
    { key: "vitaminD", label: "Vitamin D", icon: "☀️" },
    { key: "calcium", label: "Calcium", icon: "🥛" },
    { key: "iron", label: "Iron", icon: "🥩" },
    { key: "magnesium", label: "Magnesium", icon: "🧲" },
    { key: "zinc", label: "Zinc", icon: "⚡" },
  ];

  return nutrientMap
    .map((nutrient) => {
      const actual = aggregated[nutrient.key] || 0;
      let targetKey = nutrient.key;
      if (nutrient.key === "calories") {
        targetKey = "dailyCalories";
      }
      const target = targets[targetKey] || 0;

      // Special handling for nutrients where lower is better (sugar)
      let status = "optimal";
      let severity = "minor";
      let percentage = 0;

      if (nutrient.key === "sugar") {
        // For sugar: below target = optimal, above = excess
        percentage = (actual / target) * 100;
        if (actual > target * 1.2) {
          status = "excess";
          severity = "moderate";
        } else if (actual > target) {
          status = "low";
          severity = "minor";
        } else {
          status = "optimal";
        }
      } else {
        // Normal logic: actual vs target
        percentage = target > 0 ? (actual / target) * 100 : 0;

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
      }

      return {
        nutrient: nutrient.key,
        label: nutrient.label,
        icon: nutrient.icon,
        actual: Math.round(actual * 10) / 10,
        target: Math.round(target * 10) / 10,
        percentage: Math.round(percentage),
        status,
        severity,
      };
    })
    .filter((n) => n.target > 0); // Filter out nutrients with no target
}

/**
 * POST /api/nutrition/suggestions
 * Get personalized meal suggestions based on deficiencies
 */
const getMealSuggestions = async (req, res) => {
  try {
    const { deficientNutrients = [], goal = "maintain", dietType = "omnivore" } = req.body;

    if (!deficientNutrients || deficientNutrients.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No deficiencies detected",
      });
    }

    // Meal suggestion database
    const mealSuggestions = {
      // Protein-rich meals
      protein: {
        omnivore: [
          {
            icon: "🍗",
            title: "Grilled Chicken Breast with Quinoa",
            description: "Lean protein source paired with complete amino acid profile from quinoa. Perfect for muscle building.",
            nutrients_addressed: ["protein", "carbs", "fiber"],
            diet_flags: ["High Protein", "Lean"],
          },
          {
            icon: "🐟",
            title: "Salmon with Sweet Potato",
            description: "Rich in omega-3 fatty acids and vitamin D. Great for recovery and overall health.",
            nutrients_addressed: ["protein", "vitaminD", "fats"],
            diet_flags: ["Omega-3", "Vitamin D"],
          },
          {
            icon: "🐢",
            title: "Turkey Meatballs with Brown Rice",
            description: "Lean turkey protein with complex carbs. Low in fat, high in satiety.",
            nutrients_addressed: ["protein", "carbs", "iron"],
            diet_flags: ["Iron-Rich", "Lean"],
          },
        ],
        veg: [
          {
            icon: "🥚",
            title: "Egg Scramble with Spinach & Cheese",
            description: "Complete protein with iron and calcium. Quick and versatile.",
            nutrients_addressed: ["protein", "iron", "calcium"],
            diet_flags: ["Complete Protein", "Iron-Rich"],
          },
          {
            icon: "🧀",
            title: "Greek Yogurt with Granola",
            description: "Protein-rich probiotic food. Add berries for vitamin C.",
            nutrients_addressed: ["protein", "calcium"],
            diet_flags: ["Probiotic", "Calcium-Rich"],
          },
          {
            icon: "🍲",
            title: "Dal with Basmati Rice",
            description: "Traditional lentil curry providing plant-based protein and iron.",
            nutrients_addressed: ["protein", "fiber", "iron"],
            diet_flags: ["Plant-Based", "Iron-Rich"],
          },
        ],
        vegan: [
          {
            icon: "🫘",
            title: "Roasted Chickpeas with Tahini Wrap",
            description: "Plant-based protein with healthy fats. Rich in fiber.",
            nutrients_addressed: ["protein", "fiber", "fats"],
            diet_flags: ["Plant-Based", "High Fiber"],
          },
          {
            icon: "🥦",
            title: "Tofu Stir-Fry with Broccoli",
            description: "Complete protein with bioavailable iron and vitamin C together.",
            nutrients_addressed: ["protein", "iron", "vitaminC"],
            diet_flags: ["Complete Protein", "Iron-Rich"],
          },
          {
            icon: "🌾",
            title: "Quinoa Buddha Bowl with Pumpkin Seeds",
            description: "Complete amino acid profile with minerals. Seeds provide zinc.",
            nutrients_addressed: ["protein", "fiber", "zinc"],
            diet_flags: ["Complete Protein", "Zinc-Rich"],
          },
        ],
      },

      // Fiber-rich meals
      fiber: {
        omnivore: [
          {
            icon: "🥗",
            title: "Garden Salad with Chickpeas & Chicken",
            description: "High fiber from vegetables and legumes. Lean protein source.",
            nutrients_addressed: ["fiber", "protein", "vitaminC"],
            diet_flags: ["High Fiber", "Balanced"],
          },
          {
            icon: "🥣",
            title: "Steel-Cut Oats with Berries",
            description: "Soluble fiber for satiety and heart health. Antioxidant-rich berries.",
            nutrients_addressed: ["fiber", "vitaminC", "carbs"],
            diet_flags: ["High Fiber", "Antioxidant"],
          },
          {
            icon: "🌽",
            title: "Corn & Black Bean Burrito Bowl",
            description: "Legume and whole grain combo with fiber and minerals.",
            nutrients_addressed: ["fiber", "iron", "carbs"],
            diet_flags: ["High Fiber", "Iron-Rich"],
          },
        ],
        veg: [
          {
            icon: "🥕",
            title: "Vegetable Soup with Whole Grain Bread",
            description: "Diverse vegetable nutrients with satisfying whole grains.",
            nutrients_addressed: ["fiber", "vitaminA", "vitaminC"],
            diet_flags: ["High Fiber", "Vitamin-Rich"],
          },
          {
            icon: "🍏",
            title: "Apple with Almond Butter",
            description: "Natural fiber with healthy fats and protein.",
            nutrients_addressed: ["fiber", "fats", "vitaminC"],
            diet_flags: ["Simple & Healthy", "Portable"],
          },
        ],
        vegan: [
          {
            icon: "🥑",
            title: "Avocado Toast on Whole Wheat",
            description: "Healthy fats and fiber rich. Add tomato for vitamin C.",
            nutrients_addressed: ["fiber", "fats", "vitaminC"],
            diet_flags: ["Plant-Based", "Healthy Fats"],
          },
        ],
      },

      // Iron-rich meals
      iron: {
        omnivore: [
          {
            icon: "🥩",
            title: "Lean Beef Steak with Spinach",
            description: "Highly bioavailable iron (heme). Vitamin C from side vegetables aids absorption.",
            nutrients_addressed: ["iron", "protein", "vitaminC"],
            diet_flags: ["Iron-Rich", "High Protein"],
          },
          {
            icon: "🦪",
            title: "Oyster Rice Bowl",
            description: "Extremely high in iron and zinc. Ocean-source nutrients.",
            nutrients_addressed: ["iron", "zinc", "protein"],
            diet_flags: ["Iron-Rich", "Zinc-Rich"],
          },
        ],
        veg: [
          {
            icon: "🧀",
            title: "Paneer with Tomato Curry & Brown Rice",
            description: "Plant-based iron with vitamin C for absorption. Calcium from paneer.",
            nutrients_addressed: ["iron", "vitaminC", "calcium"],
            diet_flags: ["Iron-Rich", "Vitamin C Source"],
          },
        ],
        vegan: [
          {
            icon: "🍅",
            title: "Lentil Soup with Citrus Dressing",
            description: "Plant-based iron boosted by vitamin C from lemon/orange dressing.",
            nutrients_addressed: ["iron", "fiber", "vitaminC"],
            diet_flags: ["Iron-Rich", "Plant-Based"],
          },
          {
            icon: "🥬",
            title: "Fortified Cereal with Orange Juice",
            description: "Fortified iron with immediate vitamin C boost for absorption.",
            nutrients_addressed: ["iron", "vitaminC", "fiber"],
            diet_flags: ["Iron-Rich", "Quick Option"],
          },
        ],
      },

      // Calcium-rich meals
      calcium: {
        omnivore: [
          {
            icon: "🥛",
            title: "Milk-based Cereal Bowl",
            description: "Classic calcium source. Whole grain cereals add fiber.",
            nutrients_addressed: ["calcium", "fiber"],
            diet_flags: ["Calcium-Rich", "Simple"],
          },
          {
            icon: "🧠",
            title: "Salmon with Broccoli",
            description: "Both salmon bones (if consumed) and broccoli provide calcium.",
            nutrients_addressed: ["calcium", "protein", "vitaminD"],
            diet_flags: ["Calcium-Rich", "Vitamin D"],
          },
        ],
        veg: [
          {
            icon: "🧀",
            title: "Cheese & Whole Wheat Bread",
            description: "Dairy calcium with whole grain minerals.",
            nutrients_addressed: ["calcium", "fiber"],
            diet_flags: ["Calcium-Rich", "Simple"],
          },
          {
            icon: "🥛",
            title: "Greek Yogurt Parfait",
            description: "Calcium-rich with probiotics. Add almonds for more minerals.",
            nutrients_addressed: ["calcium", "fiber"],
            diet_flags: ["Probiotic", "Calcium-Rich"],
          },
        ],
        vegan: [
          {
            icon: "🥬",
            title: "Fortified Plant Milk with Chia Seeds",
            description: "Commercial fortified milk with omega-3 rich seeds.",
            nutrients_addressed: ["calcium", "fats", "fiber"],
            diet_flags: ["Vegan", "Fortified"],
          },
          {
            icon: "🥬",
            title: "Tofu with Sesame & Dark Leafy Greens",
            description: "Firm tofu and seeds provide bioavailable calcium.",
            nutrients_addressed: ["calcium", "iron"],
            diet_flags: ["Plant-Based", "Calcium-Rich"],
          },
        ],
      },

      // Vitamin D meals
      vitaminD: {
        omnivore: [
          {
            icon: "🐟",
            title: "Tuna Sandwich",
            description: "Vitamin D and omega-3s in easily absorbable form.",
            nutrients_addressed: ["vitaminD", "protein"],
            diet_flags: ["Portable", "Omega-3"],
          },
          {
            icon: "🧈",
            title: "Egg Salad with Sunflower Seeds",
            description: "Egg yolk is natural Vitamin D source.",
            nutrients_addressed: ["vitaminD", "protein"],
            diet_flags: ["Natural Source", "Complete Protein"],
          },
        ],
        veg: [
          {
            icon: "🐟",
            title: "Fortified Plant-Based Milk",
            description: "Commercial fortification with added vitamin D.",
            nutrients_addressed: ["vitaminD", "calcium"],
            diet_flags: ["Fortified", "Easy"],
          },
        ],
        vegan: [
          {
            icon: "🍄",
            title: "Mushroom & Fortified Milk Smoothie",
            description: "UV-exposed mushrooms plus fortified plant milk.",
            nutrients_addressed: ["vitaminD", "calcium"],
            diet_flags: ["Plant-Based", "Fortified"],
          },
        ],
      },

      // Vitamin C meals
      vitaminC: {
        omnivore: [
          {
            icon: "🍊",
            title: "Orange Chicken",
            description: "Vitamin C from orange juice sauce aids iron absorption.",
            nutrients_addressed: ["vitaminC", "protein"],
            diet_flags: ["Tasty", "Balanced"],
          },
          {
            icon: "🌶️",
            title: "Bell Pepper Steak Fajitas",
            description: "Peppers are vitamin C powerhouses. Great with lean protein.",
            nutrients_addressed: ["vitaminC", "protein"],
            diet_flags: ["Vitamin C-Rich", "Colorful"],
          },
        ],
        veg: [
          {
            icon: "😂",
            title: "Strawberry Yogurt Parfait",
            description: "Berries provide vitamin C with probiotic benefits.",
            nutrients_addressed: ["vitaminC", "calcium"],
            diet_flags: ["Antioxidant", "Probiotic"],
          },
          {
            icon: "🥒",
            title: "Kiwi & Almond Smoothie",
            description: "Kiwi is vitamin C rich. Almonds add minerals.",
            nutrients_addressed: ["vitaminC", "fats"],
            diet_flags: ["Refreshing", "Complete Nutrition"],
          },
        ],
        vegan: [
          {
            icon: "🍅",
            title: "Tomato Chickpea Curry",
            description: "Vitamin C from tomatoes, protein from chickpeas.",
            nutrients_addressed: ["vitaminC", "protein", "fiber"],
            diet_flags: ["Plant-Based", "Flavorful"],
          },
        ],
      },

      // Goals
      "lose weight": {
        omnivore: [
          {
            icon: "🥗",
            title: "Turkey Lettuce Wraps",
            description: "High protein, low calorie. Satisfying with minimal energy.",
            nutrients_addressed: ["protein", "fiber"],
            diet_flags: ["Low Calorie", "High Protein"],
          },
        ],
        veg: [
          {
            icon: "🍲",
            title: "Vegetable Soup with Legumes",
            description: "Filling with fiber and plant protein. Low energy density.",
            nutrients_addressed: ["fiber", "protein"],
            diet_flags: ["Low Calorie", "Filling"],
          },
        ],
        vegan: [
          {
            icon: "🥦",
            title: "Tofu Stir-Fry Noodles",
            description: "Protein from tofu, low calorie density, satisfying.",
            nutrients_addressed: ["protein", "fiber"],
            diet_flags: ["Low Calorie", "Plant-Based"],
          },
        ],
      },

      "build muscle": {
        omnivore: [
          {
            icon: "🍗",
            title: "Chicken & Rice with Broccoli",
            description: "Perfect post-workout meal for protein synthesis.",
            nutrients_addressed: ["protein", "carbs"],
            diet_flags: ["Post-Workout", "Muscle Building"],
          },
        ],
        veg: [
          {
            icon: "🥚",
            title: "Egg & Potato Omelette",
            description: "Complete protein with carbs for muscle recovery.",
            nutrients_addressed: ["protein", "carbs", "calcium"],
            diet_flags: ["Complete Protein", "Post-Workout"],
          },
        ],
        vegan: [
          {
            icon: "🌾",
            title: "Quinoa & Black Bean Bowl",
            description: "Complete amino acid profile supports muscle development.",
            nutrients_addressed: ["protein", "carbs", "fiber"],
            diet_flags: ["Complete Protein", "Plant-Based"],
          },
        ],
      },
    };

    // Get suggestions based on deficiencies
    const suggestions = [];
    const allNutrients = ["protein", "fiber", "iron", "calcium", "vitaminD", "vitaminC"];
    
    // Prioritize suggestions for detected deficiencies
    for (const nutrient of deficientNutrients.slice(0, 2)) {
      const nutrientKey = nutrient.toLowerCase();
      if (mealSuggestions[nutrientKey] && mealSuggestions[nutrientKey][dietType]) {
        const meals = mealSuggestions[nutrientKey][dietType];
        suggestions.push(meals[Math.floor(Math.random() * meals.length)]);
      }
    }

    // Add goal-appropriate suggestion if not enough
    if (suggestions.length < 3 && goal && mealSuggestions[goal] && mealSuggestions[goal][dietType]) {
      const goalMeals = mealSuggestions[goal][dietType];
      suggestions.push(goalMeals[0]);
    }

    // Fill remaining with random general suggestions
    while (suggestions.length < 3) {
      const general = ["protein", "fiber", "vitaminC"];
      const nutrientKey = general[Math.floor(Math.random() * general.length)];
      if (mealSuggestions[nutrientKey] && mealSuggestions[nutrientKey][dietType]) {
        const meals = mealSuggestions[nutrientKey][dietType];
        suggestions.push(meals[Math.floor(Math.random() * meals.length)]);
      }
    }

    res.status(200).json({
      success: true,
      data: suggestions.slice(0, 3),
    });
  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate meal suggestions",
      error: error.message,
    });
  }
};

module.exports = {
  getNutritionSummary,
  getMealSuggestions,
};
