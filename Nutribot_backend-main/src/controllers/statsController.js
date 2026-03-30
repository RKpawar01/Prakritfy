const DailyStats = require("../models/DailyStats");
const Meal = require("../models/Meal");
const UserProfile = require("../models/UserProfile");
const Badge = require("../models/Badge");

// Get or create daily stats
exports.getDailyStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { date } = req.query; // YYYY-MM-DD format

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let dailyStats = await DailyStats.findOne({
      userId,
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!dailyStats) {
      // Create new daily stats
      dailyStats = await DailyStats.create({
        userId,
        date: queryDate,
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
          sugar: 0,
          water: 0,
        },
        vitamins: {},
        nutritionScore: { score: 0, breakdown: {} },
        mealsLogged: 0,
        streakDays: 0,
      });
    }

    res.status(200).json({ success: true, dailyStats });
  } catch (err) {
    console.error("Error fetching daily stats:", err);
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
};

// Calculate nutrition score (0-100)
exports.calculateNutritionScore = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    // Get daily stats
    const dailyStats = await DailyStats.findOne({
      userId,
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!dailyStats) {
      return res.status(200).json({ score: 0, breakdown: {} });
    }

    // Get user profile for targets
    const profile = await UserProfile.findOne({ userId });
    const targets = profile?.goalIntake || {
      dailyCalories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      fiber: 25,
      water: 2000,
    };

    const breakdown = {
      protein: 0,
      fiber: 0,
      calories: 0,
      water: 0,
      vitamins: 0,
    };

    // Score protein (max 25 points)
    if (dailyStats.totals.protein >= targets.protein) {
      breakdown.protein = 25;
    } else {
      breakdown.protein = Math.round((dailyStats.totals.protein / targets.protein) * 25);
    }

    // Score fiber (max 20 points)
    if (dailyStats.totals.fiber >= targets.fiber) {
      breakdown.fiber = 20;
    } else {
      breakdown.fiber = Math.round((dailyStats.totals.fiber / targets.fiber) * 20);
    }

    // Score calories (max 25 points - within 10% of target)
    const calorieVariance = Math.abs(dailyStats.totals.calories - targets.dailyCalories) / targets.dailyCalories;
    if (calorieVariance <= 0.1) {
      breakdown.calories = 25;
    } else if (calorieVariance <= 0.2) {
      breakdown.calories = 15;
    } else if (calorieVariance <= 0.3) {
      breakdown.calories = 10;
    } else {
      breakdown.calories = 0;
    }

    // Score water (max 15 points)
    if (dailyStats.totals.water >= targets.water) {
      breakdown.water = 15;
    } else {
      breakdown.water = Math.round((dailyStats.totals.water / targets.water) * 15);
    }

    // Score vitamins (max 15 points based on variety)
    let vitaminsConsumed = 0;
    const requiredVitamins = ["vitaminA", "vitaminB12", "vitaminC", "vitaminD", "calcium", "iron"];
    requiredVitamins.forEach((vitamin) => {
      if (dailyStats.vitamins[vitamin] > 0) vitaminsConsumed++;
    });
    breakdown.vitamins = Math.round((vitaminsConsumed / requiredVitamins.length) * 15);

    const totalScore = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));

    res.status(200).json({
      score: totalScore,
      breakdown,
    });
  } catch (err) {
    console.error("Error calculating nutrition score:", err);
    res.status(500).json({ error: "Failed to calculate nutrition score" });
  }
};

// Get smart suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    // Get daily stats
    const dailyStats = await DailyStats.findOne({
      userId,
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!dailyStats) {
      return res.status(200).json({
        suggestions: ["Start logging your meals to get personalized suggestions"],
      });
    }

    const profile = await UserProfile.findOne({ userId });
    const targets = profile?.goalIntake || {
      dailyCalories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      fiber: 25,
      water: 2000,
    };

    const suggestions = [];

    // Normalise diet type — profile stores "veg", "non-veg", "vegan"
    console.log("📋 Suggestions: userId =", userId, "| profile =", profile ? `found (dietType: ${profile.dietType})` : "NOT FOUND");
    const dietType = (profile?.dietType ?? "non-veg").toLowerCase();
    const isVegan = dietType === "vegan";
    const isVeg = dietType === "veg" || dietType === "vegetarian" || isVegan;
    const isVegOrVegan = isVeg || isVegan;

    // Protein suggestions
    if (dailyStats.totals.protein < targets.protein * 0.7) {
      const proteinFoods = isVegan
        ? "tofu, tempeh, lentils, chickpeas, edamame, nuts, seeds, quinoa"
        : isVeg
        ? "paneer, tofu, lentils, chickpeas, Greek yogurt, cottage cheese, nuts, eggs"
        : "chicken, fish, eggs, lean beef, turkey, lentils";
      suggestions.push(`Your protein intake is low today. Try eating ${proteinFoods}.`);
    }

    // Water suggestions
    if (dailyStats.totals.water < targets.water * 0.5) {
      suggestions.push(`You need more water today. Aim for ${targets.water}ml daily.`);
    }

    // Fiber suggestions
    if (dailyStats.totals.fiber < targets.fiber * 0.7) {
      suggestions.push(
        "Your fiber intake is low. Add more vegetables, whole grains, fruits, and legumes."
      );
    }

    // Iron suggestions
    if (dailyStats.vitamins.iron < 8) {
      const ironFoods = isVegOrVegan
        ? "spinach, lentils, chickpeas, pumpkin seeds, fortified cereals, dry fruits"
        : "red meat, chicken, fish, spinach, lentils";
      suggestions.push(`Iron intake is low. Include ${ironFoods} in your diet.`);
    }

    // Vitamin D suggestions
    if (dailyStats.vitamins.vitaminD < 15) {
      const vitDFoods = isVegOrVegan
        ? "fortified plant milk, fortified cereals, mushrooms exposed to sunlight, or a vitamin D supplement"
        : "fortified milk, eggs, fatty fish, or a vitamin D supplement";
      suggestions.push(`Ensure adequate vitamin D intake. Include ${vitDFoods}.`);
    }

    // Meal count suggestions
    if (dailyStats.mealsLogged === 0) {
      suggestions.push("Don't forget to log your first meal of the day!");
    } else if (dailyStats.mealsLogged === 1) {
      suggestions.push("Keep tracking! Log your lunch to maintain consistency.");
    } else if (dailyStats.mealsLogged === 2) {
      suggestions.push("Great progress! Log your dinner to complete the day.");
    }

    // Positivity suggestions
    if (suggestions.length === 0) {
      suggestions.push("Excellent! You're doing great with your nutrition today. Keep it up! 🎉");
    }

    res.status(200).json({ success: true, suggestions });
  } catch (err) {
    console.error("Error generating suggestions:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
};

// Get streak count
exports.getStreak = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get TODAY's stats only
    const todayStats = await DailyStats.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Return streak only if meals logged today
    if (todayStats && todayStats.mealsLogged > 0) {
      const streakDays = todayStats.streakDays || 1;
      console.log(`✅ User ${userId} has ${streakDays} day streak (logged today)`);
      return res.status(200).json({ success: true, streakDays });
    }

    // User hasn't logged today - streak is 0
    console.log(`❌ User ${userId} has no streak (no meals logged today)`);
    res.status(200).json({ success: true, streakDays: 0 });
  } catch (err) {
    console.error("Error getting streak:", err);
    res.status(500).json({ error: "Failed to get streak" });
  }
};

// Get period analytics
exports.getPeriodAnalytics = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period } = req.query; // daily, weekly, monthly

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let label = "Today";

    if (period === "weekly") {
      startDate.setDate(startDate.getDate() - 6);
      label = "This Week";
    } else if (period === "monthly") {
      startDate.setDate(startDate.getDate() - 29);
      label = "This Month";
    }

    const stats = await DailyStats.find({
      userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Aggregate data
    const aggregated = {
      label,
      period,
      totalMeals: 0,
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFats: 0,
      averageScore: 0,
      daysLogged: 0,
      dailyData: [],
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalScore = 0;

    stats.forEach((stat) => {
      if (stat.mealsLogged > 0) {
        aggregated.daysLogged++;
        aggregated.totalMeals += stat.mealsLogged;
        totalCalories += stat.totals.calories;
        totalProtein += stat.totals.protein;
        totalCarbs += stat.totals.carbs;
        totalFats += stat.totals.fats;
        totalScore += stat.nutritionScore.score;

        aggregated.dailyData.push({
          date: stat.date,
          calories: stat.totals.calories,
          protein: stat.totals.protein,
          carbs: stat.totals.carbs,
          fats: stat.totals.fats,
          score: stat.nutritionScore.score,
          meals: stat.mealsLogged,
        });
      }
    });

    if (aggregated.daysLogged > 0) {
      aggregated.averageCalories = Math.round(totalCalories / aggregated.daysLogged);
      aggregated.averageProtein = Math.round(totalProtein / aggregated.daysLogged);
      aggregated.averageCarbs = Math.round(totalCarbs / aggregated.daysLogged);
      aggregated.averageFats = Math.round(totalFats / aggregated.daysLogged);
      aggregated.averageScore = Math.round(totalScore / aggregated.daysLogged);
    }

    res.status(200).json({ success: true, analytics: aggregated });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// Check and award badges
exports.checkAndAwardBadges = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const earnedBadges = [];

    // Get or create badges for user
    const badges = await Badge.findOne({ userId });

    // Check protein achievement
    const sevenDaysProtein = await DailyStats.find({
      userId,
      "totals.protein": { $gte: 150 },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (sevenDaysProtein.length >= 5) {
      // 5 out of 7 days
      earnedBadges.push("protein-master");
    }

    // Check healthy week (7 meals logged)
    const weekMeals = await DailyStats.find({
      userId,
      mealsLogged: { $gt: 0 },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (weekMeals.length >= 7) {
      earnedBadges.push("healthy-week");
    }

    // Update badges
    for (const badge of earnedBadges) {
      await Badge.findOneAndUpdate(
        { userId, badgeType: badge },
        { earned: true, earnedAt: new Date() },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, earnedBadges });
  } catch (err) {
    console.error("Error checking badges:", err);
    res.status(500).json({ error: "Failed to check badges" });
  }
};

// Get user badges
exports.getBadges = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const badges = await Badge.find({ userId, earned: true });

    res.status(200).json({ success: true, badges });
  } catch (err) {
    console.error("Error fetching badges:", err);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
};
