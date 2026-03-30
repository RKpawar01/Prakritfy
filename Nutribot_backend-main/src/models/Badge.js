const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  badgeType: {
    type: String,
    enum: [
      "protein-master", // Consistently high protein intake
      "healthy-week", // 7 days of meals logged
      "consistent-tracker", // 14 days streak
      "water-warrior", // 7 days of hydration goal
      "fiber-friend", // High fiber intake
      "nutrient-champion", // All nutrition goals met
      "first-meal", // Logged first meal
      "meal-milestone-10", // 10 meals logged
      "meal-milestone-50", // 50 meals logged
      "perfect-day", // Perfect nutrition score (95+)
    ],
    required: true,
  },
  earned: {
    type: Boolean,
    default: false,
  },
  earnedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

badgeSchema.index({ userId: 1, badgeType: 1 });

module.exports = mongoose.model("Badge", badgeSchema);
