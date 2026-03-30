const mongoose = require("mongoose");

const scheduleMealSchema = {
  name: String,
  description: String,
  quantity: String,
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
};

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  goal: {
    type: String,
    enum: ["lose_weight", "gain_weight", "maintain"],
    required: true,
  },
  dietType: {
    type: String,
    enum: ["veg", "non-veg", "vegan"],
    default: "non-veg",
  },
  duration: {
    type: Number, // days
    default: 7,
  },
  dailyCalories: {
    type: Number,
  },
  dailyTargets: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
  },
  schedule: [
    {
      day: String, // "Monday", "Tuesday", etc.
      breakfast: mongoose.Schema.Types.Mixed, // Can be string or object
      lunch: mongoose.Schema.Types.Mixed,
      dinner: mongoose.Schema.Types.Mixed,
      snack: mongoose.Schema.Types.Mixed,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DietPlan", dietPlanSchema);
