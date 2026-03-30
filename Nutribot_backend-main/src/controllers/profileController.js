const UserProfile = require("../models/UserProfile");
const User = require("../models/User");

// Get or create user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Get user's nutrition goal
exports.getUserGoal = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await UserProfile.findOne({ userId });
    const goal = profile?.goal || "maintain";
    res.status(200).json({ success: true, goal });
  } catch (err) {
    console.error("Error fetching user goal:", err);
    res.status(500).json({ error: "Failed to fetch user goal" });
  }
};

// POST Onboarding - Save initial profile setup after registration
exports.onboarding = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let {
      height,
      weight,
      age,
      gender,
      activityLevel,
      goal,
      dietType,
      allergies,
      foodPreferences,
      region,
      healthConditions,
      waterGoal,
      proteinTarget,
      carbsTarget,
      fatsTarget,
    } = req.body;

    console.log('🎯 Onboarding setup started for user:', userId);

    // Validation
    if (!height || !weight || !age || !gender) {
      return res.status(400).json({ error: "Body metrics are required" });
    }
    if (!activityLevel || !goal) {
      return res.status(400).json({ error: "Activity level and goal are required" });
    }
    if (!dietType) {
      return res.status(400).json({ error: "Diet type is required" });
    }

    // Convert numeric fields
    height = Number(height);
    weight = Number(weight);
    age = Number(age);
    waterGoal = Number(waterGoal) || 2000;
    if (proteinTarget) proteinTarget = Number(proteinTarget);
    if (carbsTarget) carbsTarget = Number(carbsTarget);
    if (fatsTarget) fatsTarget = Number(fatsTarget);

    // Update User document with region
    if (region && region.state) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          region: {
            country: region.country || 'India',
            state: region.state.toLowerCase(),
            city: region.city || null,
          },
        },
        { new: true }
      );
      console.log('✅ User region updated:', updatedUser.region);
    }

    // Create or update UserProfile
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        height,
        weight,
        age,
        gender,
        activityLevel,
        goal,
        dietType,
        allergies,
        foodPreferences,
        healthConditions,
        waterGoal,
        proteinTarget,
        carbsTarget,
        fatsTarget,
      });
      console.log('✅ Profile created during onboarding');
    } else {
      profile.height = height;
      profile.weight = weight;
      profile.age = age;
      profile.gender = gender;
      profile.activityLevel = activityLevel;
      profile.goal = goal;
      profile.dietType = dietType;
      profile.allergies = allergies || '';
      profile.foodPreferences = foodPreferences || '';
      profile.healthConditions = healthConditions || '';
      profile.waterGoal = waterGoal;
      if (proteinTarget) profile.proteinTarget = proteinTarget;
      if (carbsTarget) profile.carbsTarget = carbsTarget;
      if (fatsTarget) profile.fatsTarget = fatsTarget;
      await profile.save();
      console.log('✅ Profile updated during onboarding');
    }

    res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      profile,
    });
  } catch (err) {
    console.error('❌ Onboarding error:', err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let {
      height,
      weight,
      age,
      gender,
      activityLevel,
      goal,
      dietType,
      allergies,
      foodPreferences,
      region,
      healthConditions,
      waterGoal,
      proteinTarget,
      carbsTarget,
      fatsTarget,
      goalIntake,
    } = req.body;

    console.log('📥 Profile update request received for user:', userId);
    console.log('Request body:', req.body);

    // Convert numeric fields to numbers to avoid string storage
    if (height !== undefined && height !== '') height = Number(height);
    if (weight !== undefined && weight !== '') weight = Number(weight);
    if (age !== undefined && age !== '') age = Number(age);
    if (waterGoal !== undefined && waterGoal !== '') waterGoal = Number(waterGoal);
    if (proteinTarget !== undefined && proteinTarget !== '') proteinTarget = Number(proteinTarget);
    if (carbsTarget !== undefined && carbsTarget !== '') carbsTarget = Number(carbsTarget);
    if (fatsTarget !== undefined && fatsTarget !== '') fatsTarget = Number(fatsTarget);

    if (region && region.state) {
      await User.findByIdAndUpdate(userId, {
        region: {
          country: region.country || "India",
          state: region.state.toLowerCase(),
          city: region.city || null,
        },
      });
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      console.log('Creating new profile for user:', userId);
      profile = await UserProfile.create({
        userId,
        height,
        weight,
        age,
        gender,
        activityLevel,
        goal,
        dietType,
        allergies,
        foodPreferences,
        healthConditions,
        waterGoal,
        proteinTarget,
        carbsTarget,
        fatsTarget,
        goalIntake,
      });
      console.log('✅ Profile created:', profile);
    } else {
      console.log('Updating existing profile for user:', userId);
      if (height !== undefined) profile.height = height;
      if (weight !== undefined) profile.weight = weight;
      if (age !== undefined) profile.age = age;
      if (gender !== undefined) profile.gender = gender;
      if (activityLevel !== undefined) profile.activityLevel = activityLevel;
      if (goal !== undefined) profile.goal = goal;
      if (dietType !== undefined) profile.dietType = dietType;
      if (allergies !== undefined) profile.allergies = allergies;
      if (foodPreferences !== undefined) profile.foodPreferences = foodPreferences;
      if (healthConditions !== undefined) profile.healthConditions = healthConditions;
      if (waterGoal !== undefined) profile.waterGoal = waterGoal;
      if (proteinTarget !== undefined) profile.proteinTarget = proteinTarget;
      if (carbsTarget !== undefined) profile.carbsTarget = carbsTarget;
      if (fatsTarget !== undefined) profile.fatsTarget = fatsTarget;
      if (goalIntake !== undefined) profile.goalIntake = goalIntake;
      profile.updatedAt = Date.now();
      await profile.save();
      console.log('✅ Profile updated:', profile);
    }

    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Check if profile is complete
exports.isProfileComplete = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(200).json({
        complete: false,
        missingFields: ["height", "weight", "age", "gender"],
      });
    }

    const missingFields = [];
    if (!profile.height) missingFields.push("height");
    if (!profile.weight) missingFields.push("weight");
    if (!profile.age) missingFields.push("age");
    if (!profile.gender) missingFields.push("gender");

    res.status(200).json({
      complete: missingFields.length === 0,
      missingFields,
    });
  } catch (err) {
    console.error("Error checking profile:", err);
    res.status(500).json({ error: "Failed to check profile" });
  }
};

// Calculate daily calorie requirement (Mifflin-St Jeor formula)
exports.calculateCalories = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile || !profile.weight || !profile.height || !profile.age || !profile.gender) {
      return res.status(400).json({
        error: "Please complete your profile (height, weight, age, gender) first",
      });
    }

    const { weight, height, age, gender, activityLevel } = profile;

    // Mifflin-St Jeor Formula
    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

    res.status(200).json({ success: true, tdee: Math.round(tdee) });
  } catch (err) {
    console.error("Error calculating calories:", err);
    res.status(500).json({ error: "Failed to calculate calorie requirement" });
  }
};
