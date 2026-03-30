const mongoose = require("mongoose");

const nutritionSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  period: {
    type: String,
    enum: ["daily", "weekly"],
    default: "daily",
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  // Aggregated totals for the period
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    saturatedFat: { type: Number, default: 0 },
  },
  // Averaged micronutrients
  vitamins: {
    vitaminA: { type: Number, default: 0 },
    vitaminB1: { type: Number, default: 0 },
    vitaminB2: { type: Number, default: 0 },
    vitaminB3: { type: Number, default: 0 },
    vitaminB6: { type: Number, default: 0 },
    vitaminB12: { type: Number, default: 0 },
    vitaminC: { type: Number, default: 0 },
    vitaminD: { type: Number, default: 0 },
    vitaminE: { type: Number, default: 0 },
    vitaminK: { type: Number, default: 0 },
    folate: { type: Number, default: 0 },
  },
  minerals: {
    calcium: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    magnesium: { type: Number, default: 0 },
    potassium: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    zinc: { type: Number, default: 0 },
  },
  // Daily breakdown for trend analysis (last 7 days)
  dailyBreakdown: [
    {
      date: Date,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
      water: Number,
      mealsLogged: Number,
    },
  ],
  // Current deficiencies
  deficiencies: [
    {
      nutrient: String, // e.g., "protein", "fiber", "vitamin_b12"
      current: Number,
      target: Number,
      percentage: Number, // (current / target) * 100
      status: {
        type: String,
        enum: ["deficient", "low", "optimal", "excess"],
      },
      severity: {
        type: String,
        enum: ["critical", "moderate", "minor"],
      },
    },
  ],
  // Streaks and achievements
  streaks: {
    proteinGoal: { type: Number, default: 0 }, // consecutive days meeting protein goal
    calorieGoal: { type: Number, default: 0 }, // consecutive days meeting calorie goal
    fiberGoal: { type: Number, default: 0 }, // consecutive days meeting fiber goal
    mealsLogged: { type: Number, default: 0 }, // consecutive days with meals logged
  },
  // Alerts
  alerts: [
    {
      type: String,
      enum: [
        "low_calories",
        "low_protein",
        "low_fiber",
        "excess_sugar",
        "excess_fat",
        "low_water",
        "vegetarian_b12",
        "vegetarian_iron",
      ],
      priority: { type: String, enum: ["critical", "warning", "info"] },
      message: String,
      triggeredAt: { type: Date, default: Date.now },
    },
  ],
  // Overall score and metrics
  overallScore: { type: Number, default: 0 }, // 0-100
  nutritionQuality: { type: String, enum: ["excellent", "good", "fair", "poor"] },
  mealsLoggedCount: { type: Number, default: 0 },
  daysWithMeals: { type: Number, default: 0 },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
nutritionSummarySchema.index({ userId: 1, startDate: -1 });
nutritionSummarySchema.index({ userId: 1, period: 1, startDate: -1 });

module.exports = mongoose.model("NutritionSummary", nutritionSummarySchema);
