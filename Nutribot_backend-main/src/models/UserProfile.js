const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  // Basic Metrics (Required)
  height: {
    type: Number, // in cm
    default: null,
  },
  weight: {
    type: Number, // in kg
    default: null,
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: null,
  },
  // Lifestyle
  activityLevel: {
    type: String,
    enum: ["sedentary", "light", "moderate", "active", "veryActive"],
    default: "moderate",
  },
  // Nutrition Goal
  goal: {
    type: String,
    enum: ["lose_weight", "gain_weight", "maintain"],
    default: "maintain",
  },
  // Diet Preferences
  dietType: {
    type: String,
    enum: ["veg", "non-veg", "vegan"],
    default: "non-veg",
  },
  allergies: {
    type: String,
    default: "",
  },
  foodPreferences: {
    type: String,
    default: "",
  },
  // Health Information
  healthConditions: {
    type: String,
    default: "",
  },
  waterGoal: {
    type: Number, // in ml
    default: 2000,
  },
  // Nutrition Targets
  proteinTarget: {
    type: Number, // in grams
    default: null,
  },
  carbsTarget: {
    type: Number, // in grams
    default: null,
  },
  fatsTarget: {
    type: Number, // in grams
    default: null,
  },
  // Goal Intake (for backward compatibility)
  goalIntake: {
    dailyCalories: { type: Number, default: 2000 },
    protein: { type: Number, default: 150 }, // grams
    carbs: { type: Number, default: 250 }, // grams
    fats: { type: Number, default: 65 }, // grams
    fiber: { type: Number, default: 25 }, // grams
    water: { type: Number, default: 2000 }, // ml
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
