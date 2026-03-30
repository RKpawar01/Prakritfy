const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    default: "lunch",
  },
  foods: {
    type: [String],
    required: true,
  },
  macros: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    saturatedFat: { type: Number, default: 0 },
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for fast queries by userId and date
mealSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Meal", mealSchema);
