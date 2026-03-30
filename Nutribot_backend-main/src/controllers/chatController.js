const { analyzeMeal, isFoodInput, getGoalFeedback, searchFoodAndAnalyze } = require("../services/aiService");
const { analyzeDailyDeficiencies, checkMealBalance, getDeficiencyFix } = require("../services/deficiencyEngine");
const { getSuggestionsForMeal } = require("../services/suggestionEngine");
const { getAllSuggestions } = require("../services/advancedSuggestionEngine");
const { formatDeficienciesForResponse } = require("../services/deficiencySuggestions");
const {
  aggregateNutritionResponse,
  cleanResponseForFrontend,
  getNutritionForDeficiencyCheck,
} = require("../services/nutritionResponseAggregator");
const UserProfile = require("../models/UserProfile");
const User = require("../models/User");
const { logNutritionAudit } = require("../utils/nutritionEngine");

// @route POST /api/chat
// PRODUCTION-GRADE ENDPOINT with guest mode, aggregated nutrition, and smart suggestions
exports.chatWithAI = async (req, res) => {
  const startTime = performance.now();
  
  try {
    const { message, userRegion, guestMode } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // ===== PHASE 1: INTENT DETECTION =====
    if (!isFoodInput(message)) {
      return res.status(200).json({
        input: message,
        type: "chat",
        reply: "Hello! 👋 Tell me what you ate today and I'll analyze your nutrition.",
      });
    }

    logNutritionAudit("chat_session_start", {
      guestMode,
      hasRegion: !!userRegion,
    });

    // ===== PHASE 2: ANALYZE MEAL NUTRITION =====
    const nutrition = await searchFoodAndAnalyze(message);

    // ===== PHASE 3: AGGREGATE RESPONSE (NO ITEM BREAKDOWN) =====
    const aggregatedNutrition = aggregateNutritionResponse(nutrition);

    // ===== PHASE 4: GET USER PROFILE =====
    let userProfile = {
      region: userRegion || null,
      dietType: 'non-veg',
      goal: 'maintain',
      age: null,
      gender: null,
      state: userRegion,
    };

    if (req.user && req.user.id && !guestMode) {
      try {
        const fullUser = await User.findById(req.user.id);
        if (fullUser && fullUser.region) {
          userProfile.region = fullUser.region.state;
          userProfile.state = fullUser.region.state;
        }

        const profile = await UserProfile.findOne({ userId: req.user.id });
        if (profile) {
          userProfile.dietType = profile.dietType || 'non-veg';
          userProfile.goal = profile.goal || 'maintain';
          userProfile.age = profile.age;
          userProfile.gender = profile.gender;
        }
      } catch (err) {
        logNutritionAudit("profile_fetch_error", { error: err.message });
      }
    }

    // ===== PHASE 5: CALCULATE DEFICIENCIES WITH ENHANCED ENGINE =====
    let deficiencies = {
      deficiencies: [],
      summary: '✅ Your meal looks well-balanced!',
      actionItems: [],
      hasSevereDeficiency: false,
    };

    try {
      const nutritionForCheck = getNutritionForDeficiencyCheck(aggregatedNutrition);
      const rawDeficiencies = analyzeDailyDeficiencies(nutritionForCheck, userProfile);
      
      // Format with actionable suggestions
      deficiencies = formatDeficienciesForResponse(
        rawDeficiencies.deficiencies,
        userProfile
      );

      logNutritionAudit("deficiency_analysis_complete", {
        count: deficiencies.deficienciesCount,
        hasSevere: deficiencies.hasSevereDeficiency,
      });
    } catch (err) {
      logNutritionAudit("deficiency_analysis_error", { error: err.message });
    }

    // ===== PHASE 6: GENERATE 3-TIER SUGGESTIONS =====
    let suggestions = [];
    try {
      suggestions = getAllSuggestions(
        userProfile.region,
        nutrition.items?.map(i => i.name) || [],
        deficiencies.deficiencies || [],
        { maxPerTier: 3, maxTotal: 8 }
      );

      logNutritionAudit("suggestions_generated", {
        count: suggestions.length,
        types: [...new Set(suggestions.map(s => s.tier))],
      });
    } catch (err) {
      logNutritionAudit("suggestions_error", { error: err.message });
    }

    // ===== PHASE 7: BUILD PRODUCTION RESPONSE =====
    const cleanedResponse = {
      input: message,
      type: "nutrition_analysis",
      analysisType: "AI Nutrition Analysis",
      
      // COMPLETE NUTRITION STRUCTURE (matching Meal.js model)
      nutrition: {
        macros: aggregatedNutrition.macros,
        vitamins: aggregatedNutrition.vitamins,
        minerals: aggregatedNutrition.minerals,
        source: aggregatedNutrition.source,
        confidence: aggregatedNutrition.confidence,
      },

      // Deficiency analysis with actionable suggestions
      deficiencies: {
        hasSevereDeficiency: deficiencies.hasSevereDeficiency,
        deficienciesCount: deficiencies.deficienciesCount,
        summary: deficiencies.summary,
        actionItems: deficiencies.actionItems?.slice(0, 3) || [],
      },

      // 3-TIER SMART SUGGESTIONS
      suggestions: suggestions,

      // Metadata
      timestamp: new Date().toISOString(),
      userRegion: userProfile.region,
      userState: userProfile.state,
      responseTime: Math.round(performance.now() - startTime),
      guestMode,
    };

    logNutritionAudit("chat_session_complete", {
      responseTime: cleanedResponse.responseTime,
      deficienciesCount: cleanedResponse.deficiencies.deficienciesCount,
      suggestionsCount: cleanedResponse.suggestions.length,
    });

    res.status(200).json(cleanedResponse);

  } catch (error) {
    console.error("Chat error:", error.message);
    logNutritionAudit("chat_session_error", {
      error: error.message,
      stack: error.stack?.substring(0, 200),
    });

    if (error instanceof SyntaxError) {
      return res.status(502).json({
        error: "AI returned an unexpected response. Please rephrase your input.",
        type: "parse_error",
      });
    }

    const errorMessage = error.message || "Server error while analyzing meal";
    const statusCode = error.message?.includes("timeout") ? 504 : 500;
    
    res.status(statusCode).json({ 
      error: errorMessage,
      type: "server_error",
      recovery: "Try again with a simpler food description"
    });
  }
};

// @route POST /api/chat/quick-analysis
// Fast endpoint for guest mode (minimal processing)
exports.quickAnalysis = async (req, res) => {
  try {
    const { message, userRegion } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Quick analysis without full deficiency/suggestion processing
    const nutrition = await searchFoodAndAnalyze(message);
    const aggregatedNutrition = aggregateNutritionResponse(nutrition);

    res.status(200).json({
      input: message,
      type: "quick_analysis",
      nutrition: aggregatedNutrition,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
