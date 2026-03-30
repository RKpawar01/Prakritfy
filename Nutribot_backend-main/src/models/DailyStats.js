const mongoose = require("mongoose");

const dailyStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  meals: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Meal",
    default: [],
  },
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
  },
  vitamins: {
    vitaminA: { type: Number, default: 0 },
    vitaminB1: { type: Number, default: 0 },
    vitaminB12: { type: Number, default: 0 },
    vitaminC: { type: Number, default: 0 },
    vitaminD: { type: Number, default: 0 },
    calcium: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
  },
  nutritionScore: {
    score: { type: Number, default: 0 }, // 0-100
    breakdown: {
      protein: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
      calories: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
      vitamins: { type: Number, default: 0 },
    },
  },
  mealsLogged: {
    type: Number,
    default: 0,
  },
  streakDays: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
dailyStatsSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("DailyStats", dailyStatsSchema);
