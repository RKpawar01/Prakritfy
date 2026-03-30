const Meal = require("../models/Meal");
const DailyStats = require("../models/DailyStats");

// Determine meal type based on current hour
function detectMealType() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 20) return "snack";
  return "dinner"; // 20:00 - 4:59
}

// Helper function to ensure all nutrition fields exist with valid numbers
// CHANGED: Now preserves null values for unknown nutrients instead of defaulting to 0
function normalizeNutrition(macros = {}, vitamins = {}, minerals = {}) {
  // Preserve whatever is passed, don't force defaults
  const normalizedMacros = {
    calories: macros.calories || macros.calorie || 0,
    protein: macros.protein || 0,
    carbs: macros.carbs || macros.carbohydrates || 0,
    fat: macros.fat || macros.fats || 0,
    fiber: macros.fiber || 0,
    sugar: macros.sugar || 0,
    saturatedFat: macros.saturatedFat || 0,
  };

  // Vitamins: keep as-is
  const normalizedVitamins = vitamins || {};

  // Minerals: keep as-is
  const normalizedMinerals = minerals || {};

  console.log('🔧 Normalized nutrition:', { normalizedMacros, normalizedVitamins, normalizedMinerals });

  return {
    macros: normalizedMacros,
    vitamins: normalizedVitamins,
    minerals: normalizedMinerals,
  };
}

// @route POST /api/meals/save
exports.saveMeal = async (req, res) => {
  try {
    const { foods, macros, vitamins, minerals, mealType } = req.body;

    console.log('💾 Meal Save Request:', { foods, macros, vitamins, minerals, mealType });

    // Validate foods array
    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ error: "Foods array is required." });
    }

    // Validate userId from JWT
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User ID is required." });
    }

    // Normalize nutrition data
    const nutrition = normalizeNutrition(macros, vitamins, minerals);
    console.log('✅ Normalized nutrition:', nutrition);

    // Create meal with nested nutrition structure
    const meal = await Meal.create({
      userId: req.user.id,
      mealType: mealType || detectMealType(),
      foods,
      macros: nutrition.macros,
      vitamins: nutrition.vitamins,
      minerals: nutrition.minerals,
    });

    console.log('✨ Meal created in DB:', meal);

    // Update daily stats using the meal's actual date (from createdAt or mealDate param)
    let mealDate = req.body.mealDate ? new Date(req.body.mealDate) : new Date(meal.createdAt);
    mealDate.setHours(0, 0, 0, 0);

    console.log(`💾 Saving meal for date: ${mealDate.toDateString()} (Meal created: ${meal.createdAt.toDateString()})`);

    let dailyStats = await DailyStats.findOne({
      userId: req.user.id,
      date: {
        $gte: mealDate,
        $lt: new Date(mealDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // ===== CALCULATE STREAK BEFORE CREATING/UPDATING DAILY STATS =====
    // Check if previous day has meals
    const yesterday = new Date(mealDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStats = await DailyStats.findOne({
      userId: req.user.id,
      date: {
        $gte: yesterday,
        $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Calculate streak for today
    let todayStreak = 1; // Default: first meal of a new streak
    if (yesterdayStats && yesterdayStats.mealsLogged > 0) {
      // Continue streak from yesterday
      todayStreak = (yesterdayStats.streakDays || 0) + 1;
      console.log(`✅ Streak continued from yesterday: ${todayStreak} days`);
    } else {
      // Start a new streak (no meals yesterday or first time ever)
      todayStreak = 1;
      console.log(`🔄 New streak started: 1 day`);
    }

    if (!dailyStats) {
      dailyStats = await DailyStats.create({
        userId: req.user.id,
        date: mealDate,
        meals: [meal._id],
        totals: {
          calories: nutrition.macros.calories,
          protein: nutrition.macros.protein,
          carbs: nutrition.macros.carbs,
          fats: nutrition.macros.fat,  // Keep DailyStats using "fats" for backward compatibility
          fiber: nutrition.macros.fiber,
          sugar: nutrition.macros.sugar,
          water: 0,
        },
        vitamins: nutrition.vitamins,
        mealsLogged: 1,
        streakDays: todayStreak, // Set calculated streak
      });
    } else {
      // Update existing daily stats
      dailyStats.meals.push(meal._id);
      dailyStats.totals.calories += nutrition.macros.calories;
      dailyStats.totals.protein += nutrition.macros.protein;
      dailyStats.totals.carbs += nutrition.macros.carbs;
      dailyStats.totals.fats += nutrition.macros.fat;  // Keep DailyStats using "fats"
      dailyStats.totals.fiber += nutrition.macros.fiber;
      dailyStats.totals.sugar += nutrition.macros.sugar;

      // Update vitamins
      Object.keys(nutrition.vitamins).forEach((key) => {
        dailyStats.vitamins[key] = (dailyStats.vitamins[key] || 0) + nutrition.vitamins[key];
      });

      dailyStats.mealsLogged += 1;
      // Keep existing streak if already set for today
      if (dailyStats.streakDays === 0) {
        dailyStats.streakDays = todayStreak;
      }
    }

    console.log(`📅 Streak for ${new Date(today).toDateString()}: ${todayStreak} days`, {
      todayDate: today,
      yesterdayDate: yesterday,
      yesterdayMealsLogged: yesterdayStats?.mealsLogged || 0,
      todayStreakCalculated: todayStreak,
    });

    await dailyStats.save();

    res.status(201).json({
      message: "Meal saved successfully.",
      meal,
      dailyStats,
      streakDays: dailyStats.streakDays, // Also return streak separately for easy access
    });
  } catch (error) {
    console.error("Save meal error:", error);
    res.status(500).json({ error: "Server error while saving meal." });
  }
};

// @route GET /api/meals/my
exports.getMyMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: meals.length,
      meals,
    });
  } catch (error) {
    console.error("Get meals error:", error);
    res.status(500).json({ error: "Server error while fetching meals." });
  }
};

/**
 * Admin endpoint - Rebuild all DailyStats from Meals
 * GET /api/meals/rebuild-all-stats
 */
exports.rebuildAllStats = async (req, res) => {
  try {
    console.log(`🔧 Starting full DailyStats rebuild for ALL USERS...`);

    // Get all unique users who have meals
    const usersWithMeals = await Meal.distinct("userId");
    console.log(`👥 Found ${usersWithMeals.length} users with meals`);

    let totalRebuilt = 0;
    let totalMeals = 0;

    for (const userId of usersWithMeals) {
      // Get all meals for this user
      const userMeals = await Meal.find({ userId }).sort({ createdAt: 1 });
      console.log(`📋 User ${userId}: ${userMeals.length} meals`);

      // Delete existing DailyStats for this user
      await DailyStats.deleteMany({ userId });

      // Group meals by date
      const mealsByDate = {};
      userMeals.forEach((meal) => {
        const mealDate = new Date(meal.createdAt);
        mealDate.setHours(0, 0, 0, 0);
        const dateKey = mealDate.toISOString();

        if (!mealsByDate[dateKey]) {
          mealsByDate[dateKey] = {
            date: mealDate,
            meals: [],
          };
        }
        mealsByDate[dateKey].meals.push(meal);
      });

      // Create DailyStats for each date
      for (const [dateKey, data] of Object.entries(mealsByDate)) {
        const { date, meals: mealsForDay } = data;

        let totals = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
          sugar: 0,
          water: 0,
        };

        let vitamins = {
          vitaminA: 0,
          vitaminB1: 0,
          vitaminB12: 0,
          vitaminC: 0,
          vitaminD: 0,
          calcium: 0,
          iron: 0,
        };

        // Aggregate all meals for this day
        mealsForDay.forEach((meal) => {
          totals.calories += meal.macros?.calories || 0;
          totals.protein += meal.macros?.protein || 0;
          totals.carbs += meal.macros?.carbs || 0;
          totals.fats += meal.macros?.fat || 0;
          totals.fiber += meal.macros?.fiber || 0;
          totals.sugar += meal.macros?.sugar || 0;

          // Sum vitamins
          Object.keys(meal.vitamins || {}).forEach((key) => {
            vitamins[key] = (vitamins[key] || 0) + (meal.vitamins[key] || 0);
          });
        });

        // Create DailyStats entry
        await DailyStats.create({
          userId,
          date,
          meals: mealsForDay.map((m) => m._id),
          totals,
          vitamins,
          mealsLogged: mealsForDay.length,
          streakDays: 0,
        });

        totalRebuilt++;
      }

      totalMeals += userMeals.length;
    }

    console.log(`✅ REBUILD COMPLETE: ${totalRebuilt} days rebuilt, ${totalMeals} meals processed`);

    res.status(200).json({
      success: true,
      message: `Rebuilt DailyStats for all users`,
      usersProcessed: usersWithMeals.length,
      daysRebuilt: totalRebuilt,
      totalMeals,
    });
  } catch (error) {
    console.error("Rebuild all stats error:", error);
    res.status(500).json({ error: "Server error while rebuilding DailyStats." });
  }
};

/**
 * POST /api/meals/rebuild-daily-stats
 * Rebuild single user's DailyStats from Meal collection (fix historical data)
 */
exports.rebuildDailyStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    console.log(`🔧 Rebuilding DailyStats for user: ${userId}`);

    // Get all meals for this user
    const allMeals = await Meal.find({ userId }).sort({ createdAt: 1 });
    console.log(`📋 Found ${allMeals.length} meals to process`);

    // Delete all existing DailyStats for this user
    await DailyStats.deleteMany({ userId });
    console.log(`🗑️ Cleared existing DailyStats`);

    // Group meals by date
    const mealsByDate = {};
    allMeals.forEach((meal) => {
      const mealDate = new Date(meal.createdAt);
      mealDate.setHours(0, 0, 0, 0);
      const dateKey = mealDate.toISOString();
      
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = {
          date: mealDate,
          meals: [],
        };
      }
      mealsByDate[dateKey].meals.push(meal);
    });

    // Create DailyStats for each date
    for (const [dateKey, data] of Object.entries(mealsByDate)) {
      const { date, meals: mealsForDay } = data;
      
      let totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        water: 0,
      };
      
      let vitamins = {
        vitaminA: 0,
        vitaminB1: 0,
        vitaminB12: 0,
        vitaminC: 0,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
      };

      // Aggregate all meals for this day
      mealsForDay.forEach((meal) => {
        totals.calories += meal.macros?.calories || 0;
        totals.protein += meal.macros?.protein || 0;
        totals.carbs += meal.macros?.carbs || 0;
        totals.fats += meal.macros?.fat || 0;
        totals.fiber += meal.macros?.fiber || 0;
        totals.sugar += meal.macros?.sugar || 0;

        // Sum vitamins
        Object.keys(meal.vitamins || {}).forEach((key) => {
          vitamins[key] = (vitamins[key] || 0) + (meal.vitamins[key] || 0);
        });
      });

      // Create DailyStats entry
      await DailyStats.create({
        userId,
        date,
        meals: mealsForDay.map((m) => m._id),
        totals,
        vitamins,
        mealsLogged: mealsForDay.length,
        streakDays: 0,
      });

      console.log(`✅ Created DailyStats for ${date.toDateString()} with ${mealsForDay.length} meals`);
    }

    res.status(200).json({
      success: true,
      message: `Rebuilt DailyStats for ${Object.keys(mealsByDate).length} days`,
      daysRebuilt: Object.keys(mealsByDate).length,
      totalMeals: allMeals.length,
    });
  } catch (error) {
    console.error("Rebuild DailyStats error:", error);
    res.status(500).json({ error: "Server error while rebuilding DailyStats." });
  }
};

/**
 * Diagnostic endpoint to count meals from Meal collection vs DailyStats
 * GET /api/meals/diagnostic/meal-count
 */
exports.diagnosticMealCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Count total meals in Meal collection
    const totalMealsInCollection = await Meal.countDocuments({ userId });
    
    // Get all DailyStats and count mealsLogged
    const dailyStatsArray = await DailyStats.find({ userId });
    const totalMealsInDailyStats = dailyStatsArray.reduce((sum, s) => sum + (s.mealsLogged || 0), 0);
    const totalMealRefsInDailyStats = dailyStatsArray.reduce((sum, s) => sum + (s.meals?.length || 0), 0);
    
    // Get meals grouped by actual creation date
    const allMeals = await Meal.find({ userId }).sort({ createdAt: 1 });
    const mealsByDate = {};
    allMeals.forEach((meal) => {
      const mealDate = new Date(meal.createdAt);
      mealDate.setHours(0, 0, 0, 0);
      const dateKey = mealDate.toISOString().split('T')[0];
      
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = 0;
      }
      mealsByDate[dateKey]++;
    });
    
    console.log(`\n🔍 DIAGNOSTIC MEAL COUNT:`);
    console.log(`   Total Meals in Meal collection: ${totalMealsInCollection}`);
    console.log(`   Total mealsLogged in DailyStats: ${totalMealsInDailyStats}`);
    console.log(`   Total meal references in DailyStats.meals: ${totalMealRefsInDailyStats}`);
    console.log(`   Meals by actual date:`);
    Object.entries(mealsByDate).forEach(([date, count]) => {
      console.log(`      ${date}: ${count} meals`);
    });
    console.log(`\n`);
    
    res.status(200).json({
      success: true,
      diagnostic: {
        totalMealsInCollection,
        totalMealsInDailyStats,
        totalMealRefsInDailyStats,
        mealsByDate,
        dailyStatsCount: dailyStatsArray.length,
        mismatchDetected: totalMealsInCollection !== totalMealsInDailyStats
      }
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    res.status(500).json({ error: "Server error while running diagnostic." });
  }
};
