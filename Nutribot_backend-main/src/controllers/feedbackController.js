const Feedback = require('../models/Feedback');

/**
 * CREATE FEEDBACK
 * POST /api/feedback
 * 
 * Accepts feedback on meal analysis
 */
exports.createFeedback = async (req, res) => {
  try {
    const { mealId, helpful, rating, type, issueCategory, message } = req.body;
    const userId = req.user ? req.user.id : null; // Optional for guest users

    // Validation: Required fields
    if (!mealId) {
      return res.status(400).json({
        success: false,
        error: 'Meal ID is required',
      });
    }

    if (helpful === undefined || helpful === null) {
      return res.status(400).json({
        success: false,
        error: 'Please indicate if the feedback was helpful',
      });
    }

    // Note: We don't validate that meal exists because:
    // 1. Guests don't have saved meals (use temporary IDs)
    // 2. This allows feedback collection for analytics even for guest analyses

    // Validate optional fields
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    if (type && !['ai_issue', 'bug', 'general'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback type',
      });
    }

    if (
      issueCategory &&
      ![
        'wrong_calories',
        'wrong_food_detection',
        'missing_nutrients',
        'incorrect_quantity',
        'slow_analysis',
        'app_crash',
        'other',
      ].includes(issueCategory)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid issue category',
      });
    }

    if (message && message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot exceed 1000 characters',
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId,
      mealId: String(mealId), // Ensure mealId is stored as string
      helpful,
      rating: rating || null,
      type: type || 'general',
      issueCategory: issueCategory || null,
      message: message || null,
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback saved successfully',
      feedback: {
        id: feedback._id,
        helpful: feedback.helpful,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Create Feedback Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback. Please try again.',
    });
  }
};

/**
 * GET FEEDBACK FOR A MEAL
 * GET /api/feedback/meal/:mealId
 * 
 * Retrieve all feedback for a specific meal (for analytics)
 */
exports.getFeedbackForMeal = async (req, res) => {
  try {
    const { mealId } = req.params;

    const feedback = await Feedback.find({ mealId })
      .select('-__v')
      .sort({ createdAt: -1 });

    const helpful = feedback.filter((f) => f.helpful).length;
    const unhelpful = feedback.filter((f) => !f.helpful).length;
    const avgRating =
      feedback.length > 0
        ? (
            feedback
              .filter((f) => f.rating)
              .reduce((sum, f) => sum + f.rating, 0) / feedback.filter((f) => f.rating).length
          ).toFixed(2)
        : null;

    res.status(200).json({
      success: true,
      totalFeedback: feedback.length,
      helpful,
      unhelpful,
      avgRating,
      feedbackList: feedback,
    });
  } catch (error) {
    console.error('❌ Get Feedback Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback',
    });
  }
};

/**
 * GET USER'S FEEDBACK
 * GET /api/feedback/user
 * 
 * Retrieve all feedback from authenticated user
 */
exports.getUserFeedback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const feedback = await Feedback.find({ userId: req.user.id })
      .populate('mealId', 'input createdAt')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error('❌ Get User Feedback Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve your feedback',
    });
  }
};

/**
 * GET FEEDBACK STATS (ADMIN)
 * GET /api/feedback/stats
 * 
 * Get overall feedback analytics
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const helpfulCount = await Feedback.countDocuments({ helpful: true });
    const unhelpfulCount = await Feedback.countDocuments({ helpful: false });

    const issueBreakdown = await Feedback.aggregate([
      { $match: { helpful: false } },
      { $group: { _id: '$issueCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const typeBreakdown = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalFeedback,
        helpful: helpfulCount,
        unhelpful: unhelpfulCount,
        helpfulPercentage: totalFeedback > 0 ? ((helpfulCount / totalFeedback) * 100).toFixed(2) : 0,
        issueBreakdown,
        typeBreakdown,
      },
    });
  } catch (error) {
    console.error('❌ Get Feedback Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback stats',
    });
  }
};
