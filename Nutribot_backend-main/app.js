const express = require("express");
const cors = require("cors");

const { apiLimiter, authLimiter } = require("./src/middleware/rateLimiter");

const authRoutes = require("./src/routes/authRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const mealRoutes = require("./src/routes/mealRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const dietPlanRoutes = require("./src/routes/dietPlanRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const foodRoutes = require("./src/routes/foodRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");
const whatsAppRoutes = require("./src/routes/whatsAppRoutes");
const nutritionRoutes = require("./src/routes/nutritionRoutes");
const questionnaireRoutes = require("./src/routes/questionnaireRoutes");

const app = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Global Middlewares
app.use(cors());
app.use(express.json());

app.use("/webhook", whatsAppRoutes);

// Apply general rate limiter to all API routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authLimiter, authRoutes); // stricter limit on auth
app.use("/api/chat", chatRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/diet-plan", dietPlanRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/questionnaire", questionnaireRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Server running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "NutriBot API" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

module.exports = app;
