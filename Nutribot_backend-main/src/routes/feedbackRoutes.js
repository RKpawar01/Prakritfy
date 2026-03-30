const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const { protect: authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * FEEDBACK ROUTES
 */

// POST: Create feedback (public - guests can provide feedback)
router.post('/', feedbackController.createFeedback);

// GET: Feedback stats (admin analytics)
router.get('/stats', feedbackController.getFeedbackStats);

// GET: Feedback for a specific meal
router.get('/meal/:mealId', feedbackController.getFeedbackForMeal);

// GET: User's feedback history (protected route)
router.get('/user', authMiddleware, feedbackController.getUserFeedback);

module.exports = router;
