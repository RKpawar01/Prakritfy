require("dotenv").config(); // MUST BE FIRST

const app = require("./app");
const connectDB = require("./src/config/db");
const { preloadCacheWithFastFoods } = require("./src/services/cacheService");
const { FAST_FOODS } = require("./src/services/fastFoodMap");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    // ===== PERFORMANCE: Preload cache with fast foods on startup =====
    preloadCacheWithFastFoods(FAST_FOODS);
    console.log(`✅ Nutrition cache preloaded with ${Object.keys(FAST_FOODS).length} fast foods`);

    app.listen(PORT, () => {
      console.log(`\n🚀 NutriBot server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
      console.log(`📊 Production Features:`);
      console.log(`   ✓ Fast food cache (< 5ms lookup)`);
      console.log(`   ✓ In-memory nutrition cache`);
      console.log(`   ✓ Food name normalization`);
      console.log(`   ✓ AI-powered nutrition analysis\n`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
