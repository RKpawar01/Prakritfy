const DietPlan = require("../models/DietPlan");
const UserProfile = require("../models/UserProfile");
const aiService = require("../services/aiService");

// Validate profile completeness
function checkProfileCompleteness(profile) {
  const missingFields = [];
  if (!profile.height) missingFields.push("Height");
  if (!profile.weight) missingFields.push("Weight");
  if (!profile.age) missingFields.push("Age");
  if (!profile.gender) missingFields.push("Gender");
  if (!profile.activityLevel) missingFields.push("Activity Level");
  if (!profile.dietType) missingFields.push("Diet Type");
  if (!profile.goal) missingFields.push("Goal");
  return missingFields;
}

// Calculate daily calorie target
function calculateDailyCalories(profile) {
  const { height, weight, age, gender, activityLevel, goal } = profile;

  // Mifflin-St Jeor formula
  let bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  // Adjust for activity level
  const activityMultiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very active": 1.9,
  };
  bmr *= activityMultiplier[activityLevel] || 1.2;

  // Adjust for goal
  if (goal === "lose_weight") bmr -= 400;
  if (goal === "gain_weight") bmr += 400;

  return Math.round(bmr);
}

// Calculate macro targets from daily calories based on goal
function calculateDailyTargets(dailyCalories, goal) {
  let proteinPct, carbsPct, fatsPct;

  if (goal === "lose_weight") {
    // Higher protein to preserve muscle, moderate carbs, moderate fats
    proteinPct = 0.30; carbsPct = 0.40; fatsPct = 0.30;
  } else if (goal === "gain_weight") {
    // Higher carbs for energy surplus
    proteinPct = 0.25; carbsPct = 0.50; fatsPct = 0.25;
  } else {
    // Balanced maintenance
    proteinPct = 0.25; carbsPct = 0.45; fatsPct = 0.30;
  }

  return {
    calories: dailyCalories,
    protein: Math.round((dailyCalories * proteinPct) / 4),   // 4 kcal/g
    carbs: Math.round((dailyCalories * carbsPct) / 4),       // 4 kcal/g
    fats: Math.round((dailyCalories * fatsPct) / 9),         // 9 kcal/g
  };
}

// Helper function to generate diet plan logic
async function createDietPlan(userId, profile) {
  const missingFields = checkProfileCompleteness(profile);
  if (missingFields.length > 0) {
    return {
      success: false,
      error: "Please complete your profile to generate a diet plan",
      missingFields,
    };
  }

  const dailyCalories = calculateDailyCalories(profile);
  const dailyTargets = calculateDailyTargets(dailyCalories, profile.goal);

  // Generate diet plan using AI
  const schedule = await aiService.generateDietPlan(profile, dailyCalories);

  const dietPlan = await DietPlan.create({
    userId,
    goal: profile.goal,
    dietType: profile.dietType,
    dailyCalories,
    dailyTargets,
    schedule,
  });

  return {
    success: true,
    dietPlan,
  };
}

// Generate diet plan
exports.generateDietPlan = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(400).json({
        success: false,
        error: "Profile not found. Please create a profile first.",
      });
    }

    console.log("Generating diet plan for user:", userId);
    const result = await createDietPlan(userId, profile);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error("Error generating diet plan with AI:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to generate diet plan",
      details: err.message 
    });
  }
};

// Get latest diet plan for user
exports.getDietPlan = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!dietPlan) {
      return res.status(404).json({ success: false, error: "No diet plan found" });
    }

    res.status(200).json({ success: true, dietPlan });
  } catch (err) {
    console.error("Error fetching diet plan:", err);
    res.status(500).json({ success: false, error: "Failed to fetch diet plan" });
  }
};

// Regenerate diet plan
exports.regenerateDietPlan = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Delete old plan
    await DietPlan.deleteOne({ userId });

    // Fetch user profile
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(400).json({
        success: false,
        error: "Profile not found. Please create a profile first.",
      });
    }

    // Generate new plan
    const result = await createDietPlan(userId, profile);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error("Error regenerating diet plan:", err);
    res.status(500).json({ success: false, error: "Failed to regenerate diet plan" });
  }
};
