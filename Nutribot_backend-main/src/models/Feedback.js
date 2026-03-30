const mongoose = require('mongoose');

/**
 * FEEDBACK MODEL
 * 
 * Stores user feedback on meal analysis
 * Links feedback to specific meal analysis for improvement tracking
 */

const FeedbackSchema = new mongoose.Schema(
  {
    // User who provided feedback (optional for guests)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Reference to the meal analysis (can be ObjectId or string for guest analytics)
    mealId: {
      type: String,
      required: [true, 'Meal ID is required'],
    },

    // Basic feedback: was analysis helpful?
    helpful: {
      type: Boolean,
      required: [true, 'Helpful status is required'],
    },

    // Optional rating (1-5 stars)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // Type of feedback
    type: {
      type: String,
      enum: ['ai_issue', 'bug', 'general'],
      default: 'general',
    },

    // Issue category (only if helpful = false)
    issueCategory: {
      type: String,
      enum: [
        'wrong_calories',
        'wrong_food_detection',
        'missing_nutrients',
        'incorrect_quantity',
        'slow_analysis',
        'app_crash',
        'other',
        null,
      ],
      default: null,
    },

    // Detailed message from user
    message: {
      type: String,
      maxlength: 1000,
      default: null,
    },

    // Timestamp
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index on mealId for efficient queries
FeedbackSchema.index({ mealId: 1 });

// Index on userId for user-specific feedback
FeedbackSchema.index({ userId: 1 });

// Index on createdAt for time-based queries
FeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
