const router = require("express").Router();
const { 
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics 
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.get("/daily", protect, getDailyAnalytics);
router.get("/weekly", protect, getWeeklyAnalytics);
router.get("/monthly", protect, getMonthlyAnalytics);

module.exports = router;
