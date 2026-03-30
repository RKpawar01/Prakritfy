const axios = require("axios");
const Food = require("../models/Food");
const {
  parseFoodInput,
  convertToGrams,
  validatePer100Nutrition,
  scalePer100ToWeight,
  detectCategory,
  normalizeFoodName,
  logNutritionAudit,
  parseFoodItem,
} = require("../utils/nutritionEngine");
const { getSearchTerms } = require("../utils/ingredientExtractor");
const {
  mapDbFoodToCanonical,
  mapAiResponseToCanonical,
  safeMergeNutrients,
  scaleNutrientsByWeight,
  aggregateNutrients,
  recalculateCalories,
  formatNutrientForDisplay,
  validateNutrientValues,
} = require("../utils/nutrientTransformer");
const {
  detectCookingMethod,
  extractBaseFoodName,
  adjustForCookingMethod,
  generateFoodSearchPatterns,
  createCookingMetadata,
} = require("../utils/cookingMethodHandler");
const {
  analyzeMealComplete,
  findBestFoodMatch,
} = require("./fixedNutritionPipeline");

/**
 * Detects whether the user message is a greeting/general chat or actual food input.
 * Returns true if it looks like food input.
 */
function isFoodInput(message) {
  const trimmed = message.trim().toLowerCase();

  // Common greetings and non-food patterns
  const greetingPatterns = [
    /^(hi|hello|hey|hola|howdy|yo|sup|hii+|helo+|namaste)\b/,
    /^(good\s*(morning|afternoon|evening|night|day))/,
    /^(what's up|whats up|wassup|how are you|how r u)/,
    /^(thanks|thank you|thx|ty)\b/,
    /^(bye|goodbye|see you|cya|ttyl)\b/,
    /^(ok|okay|sure|yes|no|yep|nope|yeah|nah)\b$/,
    /^(help|who are you|what can you do|what do you do)\b/,
  ];

  for (const pattern of greetingPatterns) {
    if (pattern.test(trimmed)) return false;
  }

  // If it's very short (1-2 words) and doesn't look like food, treat as chat
  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    const foodIndicators = /\d|gram|cup|bowl|plate|piece|slice|glass|mg|ml|oz|tbsp|tsp|kg|g\b/;
    const commonFoods = /rice|chicken|egg|milk|bread|banana|apple|dal|roti|paneer|salad|oats|fish|meat|butter|cheese|yogurt|tea|coffee|juice|water|nuts|almond/;
    if (!foodIndicators.test(trimmed) && !commonFoods.test(trimmed)) {
      return false;
    }
  }

  return true;
}

/**
 * Generates goal-based feedback for a meal's nutrition.
 * @param {Object} macros
 * @param {string} goal - lose_weight | gain_weight | maintain
 * @param {string} dietType - veg | vegetarian | vegan | non-veg | non-vegetarian
 */
function getGoalFeedback(macros, goal, dietType) {
  const calories = macros.calories || 0;
  const protein = macros.protein || 0;

  const dt = (dietType || "non-veg").toLowerCase();
  const isVegan = dt === "vegan";
  const isVeg = dt === "veg" || dt === "vegetarian" || isVegan;

  const proteinFoodsGain = isVegan
    ? "tofu, tempeh, lentils, chickpeas, edamame, quinoa, nuts"
    : isVeg
    ? "paneer, tofu, lentils, chickpeas, Greek yogurt, cottage cheese, nuts"
    : "eggs, chicken, lentils, Greek yogurt, cottage cheese";

  const denseFoodsGain = isVegan
    ? "nuts, nut butter, avocado, brown rice, oats, seeds"
    : isVeg
    ? "nuts, avocado, brown rice, paneer, cheese, oats"
    : "nuts, eggs, rice, healthy fats, whole milk";

  if (goal === "gain_weight") {
    if (calories < 300) {
      return `⚠️ This meal may not be enough for your weight gain goal. Consider adding calorie-dense foods like ${denseFoodsGain}.`;
    }
    if (protein < 15) {
      return `⚠️ This meal is low in protein for muscle gain. Consider adding protein-rich foods like ${proteinFoodsGain}.`;
    }
    return "✅ Good meal for your weight gain goal! Keep up the calorie and protein intake.";
  }

  if (goal === "lose_weight") {
    if (calories > 600) {
      return "⚠️ This meal is high in calories for a weight loss goal. You may want to reduce portion size or add more vegetables and lean protein.";
    }
    if (macros.fat > 25) {
      return "⚠️ This meal is high in fats. Consider choosing leaner options for better weight loss results.";
    }
    return "✅ Good choice for your weight loss goal! This meal is reasonably portioned.";
  }

  // maintain
  const hasProtein = protein >= 10;
  const hasCarbs = (macros.carbs || 0) >= 15;
  const hasFat = (macros.fat || 0) >= 5;
  if (hasProtein && hasCarbs && hasFat) {
    return "✅ This meal looks balanced. Good combination of protein, carbs, and fats.";
  }
  return "💡 Consider adding more variety to balance protein, carbs, and fats in this meal.";
}

/**
 * Analyzes one food and returns JSON nutrition data per 100g or 100ml.
 * @param {string} foodInput - e.g "milk"
 * @returns {Promise<Object>} { macros: {...}, vitamins: {...}, minerals: {...} } per-100 basis
 */
async function analyzeMeal(foodInput) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: `You are a professional nutrition calculator with expertise in macronutrients, vitamins, and minerals.
The user will provide ONE food item. Return values strictly PER 100g (or PER 100ml for liquids).
You MUST return ONLY valid JSON — no extra text, no markdown, no explanation.

Required JSON format:
{
  "macros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "saturatedFat": number
  },
  "vitamins": {
    "vitaminA": number,
    "vitaminB1": number,
    "vitaminB2": number,
    "vitaminB3": number,
    "vitaminB6": number,
    "vitaminB12": number,
    "vitaminC": number,
    "vitaminD": number,
    "vitaminE": number,
    "vitaminK": number,
    "folate": number
  },
  "minerals": {
    "calcium": number,
    "iron": number,
    "magnesium": number,
    "potassium": number,
    "sodium": number,
    "zinc": number
  }
}

Rules:
- All values must be numbers (not strings), or omit the field entirely if unknown.
- Values are per 100g / per 100ml only.
- If you cannot determine a value, OMIT THE FIELD ENTIRELY. Do NOT use 0.
- CRITICAL: Do NOT use 0 for unknown values. Unknown values should be omitted.
- Do NOT include any extra fields beyond the above.
- Do NOT wrap the JSON in backticks or markdown.
- Return ONLY the JSON object, nothing else.`,
        },
        {
          role: "user",
          content: `Provide nutrition per 100g (or per 100ml for liquids) for: ${foodInput}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const rawContent = response.data.choices[0].message.content;

  // Safely parse JSON – strip any accidental markdown fences
  const cleaned = rawContent.replace(/```json|```/g, "").trim();
  const nutrition = JSON.parse(cleaned);

  // Ensure all required fields exist and are numbers
  const requiredMacros = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "saturatedFat"];
  const requiredVitamins = ["vitaminA", "vitaminB1", "vitaminB2", "vitaminB3", "vitaminB6", "vitaminB12", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "folate"];
  const requiredMinerals = ["calcium", "iron", "magnesium", "potassium", "sodium", "zinc"];

  // Validate and normalize macros
  // CRITICAL: Use null for missing/unknown values, NOT 0
  // Only 0 is acceptable if the source explicitly states the nutrient is zero
  if (!nutrition.macros) nutrition.macros = {};
  requiredMacros.forEach((field) => {
    if (typeof nutrition.macros[field] !== "number") {
      const parsed = parseFloat(nutrition.macros[field]);
      // If parsing fails or value is NaN, use null (unknown) instead of 0
      nutrition.macros[field] = isFinite(parsed) ? parsed : null;
    }
  });

  // Validate and normalize vitamins
  // IMPORTANT: Micronutrients should be null if unknown, never false-zero
  if (!nutrition.vitamins) nutrition.vitamins = {};
  requiredVitamins.forEach((field) => {
    if (typeof nutrition.vitamins[field] !== "number") {
      const parsed = parseFloat(nutrition.vitamins[field]);
      nutrition.vitamins[field] = isFinite(parsed) ? parsed : null;
    }
  });

  // Validate and normalize minerals
  // IMPORTANT: Minerals should be null if unknown, never false-zero
  if (!nutrition.minerals) nutrition.minerals = {};
  requiredMinerals.forEach((field) => {
    if (typeof nutrition.minerals[field] !== "number") {
      const parsed = parseFloat(nutrition.minerals[field]);
      nutrition.minerals[field] = isFinite(parsed) ? parsed : null;
    }
  });

  return nutrition;
}

/**
 * Legacy chat function — returns raw AI text (kept for backward compatibility).
 */
async function generateResponse(message) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: `You are a certified professional nutrition assistant.
Only answer food and nutrition related questions. If asked something unrelated, respond:
"I am a nutrition chatbot. Please ask me about diet, food, or nutrients."`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.choices[0].message.content;
}

/**
 * Generates a personalized weekly diet plan using AI.
 * Each meal includes name, quantity, and estimated macros.
 * @param {Object} profile - User profile with height, weight, age, gender, activityLevel, dietType, goal
 * @param {number} dailyCalories - Target daily calories
 * @returns {Promise<Array>} Array of day plans with structured meal objects
 */
async function generateDietPlan(profile, dailyCalories) {
  const dietTypeMap = {
    veg: "vegetarian",
    vegetarian: "vegetarian",
    "non-veg": "non-vegetarian",
    "non-vegetarian": "non-vegetarian",
    vegan: "vegan",
  };

  const goalMap = {
    lose_weight: "weight loss",
    gain_weight: "weight gain",
    maintain: "maintenance",
  };

  const activityLevelMap = {
    sedentary: "sedentary",
    light: "lightly active",
    moderate: "moderately active",
    active: "very active",
    "very active": "extremely active",
  };

  const dietType = dietTypeMap[profile.dietType?.toLowerCase()] || profile.dietType;
  const goal = goalMap[profile.goal] || profile.goal;
  const activityLevel = activityLevelMap[profile.activityLevel?.toLowerCase()] || profile.activityLevel;

  const prompt = `Create a personalized 7-day diet plan.

User profile:
Height: ${profile.height} cm
Weight: ${profile.weight} kg
Age: ${profile.age}
Gender: ${profile.gender}
Activity Level: ${activityLevel}
Diet Type: ${dietType}
Goal: ${goal}
Daily Calories Target: ${dailyCalories} kcal

Rules:
- Strictly follow the diet type (${dietType}). No meat/fish for vegetarian or vegan.
- Include breakfast, lunch, dinner, and snack for every day.
- Each meal must include a food name, quantity, and estimated macros (calories, protein, carbs, fats).
- Do NOT repeat the same meal on consecutive days. Vary meals across the week.
- Total macros per day should sum close to the daily calorie target.

Return ONLY a valid JSON array with exactly 7 elements. No markdown, no explanation, no extra text.

Use this exact JSON structure:
[
  {
    "day": "Monday",
    "breakfast": {
      "name": "Oats with banana and milk",
      "quantity": "80g oats, 1 banana, 200ml milk",
      "calories": 350,
      "protein": 12,
      "carbs": 58,
      "fats": 7
    },
    "lunch": {
      "name": "Grilled chicken with brown rice",
      "quantity": "150g chicken, 200g brown rice, 100g vegetables",
      "calories": 520,
      "protein": 38,
      "carbs": 62,
      "fats": 10
    },
    "dinner": {
      "name": "Paneer stir fry with roti",
      "quantity": "120g paneer, 2 rotis, 100g vegetables",
      "calories": 450,
      "protein": 22,
      "carbs": 48,
      "fats": 18
    },
    "snack": {
      "name": "Greek yogurt with almonds",
      "quantity": "150g yogurt, 15g almonds",
      "calories": 200,
      "protein": 12,
      "carbs": 14,
      "fats": 10
    }
  }
]`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a professional nutritionist and dietitian AI. You generate structured, personalized 7-day diet plans in valid JSON format. You always return ONLY a JSON array — no markdown, no explanation, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const rawResponse = response.data.choices[0].message.content;
  console.log("Diet plan AI response (first 400 chars):", rawResponse.substring(0, 400));

  // Strip markdown fences and extract JSON array
  let cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let schedule;
  try {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      schedule = JSON.parse(match[0]);
    } else {
      schedule = JSON.parse(cleaned);
    }
  } catch (err) {
    console.error("JSON parse failed:", err.message);
    console.error("Raw AI response:", rawResponse);
    throw new Error(`Failed to parse diet plan JSON: ${err.message}`);
  }

  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw new Error("AI returned an invalid or empty diet plan structure");
  }

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  // Normalize each day and each meal into the expected object shape
  schedule = schedule.map((day) => {
    const normalizedDay = { day: day.day || "Unknown" };
    mealTypes.forEach((mealType) => {
      const meal = day[mealType];
      if (!meal) {
        normalizedDay[mealType] = { name: "Not specified", quantity: "Not specified", calories: 0, protein: 0, carbs: 0, fats: 0 };
      } else if (typeof meal === "string") {
        normalizedDay[mealType] = { name: meal, quantity: "Not specified", calories: 0, protein: 0, carbs: 0, fats: 0 };
      } else {
        normalizedDay[mealType] = {
          name: meal.name || "Not specified",
          quantity: meal.quantity || "Not specified",
          calories: typeof meal.calories === "number" ? meal.calories : parseFloat(meal.calories) || 0,
          protein: typeof meal.protein === "number" ? meal.protein : parseFloat(meal.protein) || 0,
          carbs: typeof meal.carbs === "number" ? meal.carbs : parseFloat(meal.carbs) || 0,
          fats: typeof meal.fats === "number" ? meal.fats : parseFloat(meal.fats) || 0,
        };
      }
    });
    return normalizedDay;
  });

  console.log("Successfully parsed diet plan with", schedule.length, "days");
  return schedule;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findBestDatabaseFood(foodName) {
  const normalized = normalizeFoodName(foodName);
  const escaped = escapeRegex(normalized);
  const mainKeyword = normalized.split(/\s+/)[0];

  // Step 1: Try exact name match
  const exact = await Food.findOne({ name: new RegExp(`^${escapeRegex(foodName)}$`, "i") });
  if (exact && isReasonableMatch(exact.name, foodName)) {
    logNutritionAudit("db_search_exact_match", { foodName, matched: exact.name });
    return exact;
  }

  // Step 1b: Try alias match (NEW - using new schema aliases)
  const byAlias = await Food.findOne({ aliases: { $in: [new RegExp(`^${escaped}$`, "i")] } });
  if (byAlias) {
    logNutritionAudit("db_search_alias_match", { foodName, matched: byAlias.name, alias: foodName });
    return byAlias;
  }

  // Step 2: Try ingredient-based search (NEW)
  // Extract main ingredient and try searching for it
  // Example: "chicken curry" → try searching for "chicken"
  const searchTerms = getSearchTerms(foodName);
  for (const searchTerm of searchTerms) {
    if (searchTerm === foodName) continue; // Skip if same as original (already tried)
    
    const searchEscaped = escapeRegex(searchTerm);
    
    // Try word boundary match for this ingredient
    const ingredientSearch = await Food.find({
      name: new RegExp(`(^|\\s)${searchEscaped}(\\s|,|$)`, "i")
    }).limit(20);

    const validMatches = ingredientSearch.filter(f => isReasonableMatch(f.name, searchTerm));
    if (validMatches.length > 0) {
      // Sort by name length (prefer shorter, more generic names)
      validMatches.sort((a, b) => a.name.length - b.name.length);
      logNutritionAudit("db_search_ingredient_match", { 
        originalFood: foodName, 
        searchedIngredient: searchTerm,
        matched: validMatches[0].name 
      });
      return validMatches[0];
    }
  }

  // Step 3: Try word boundary match with original food name
  // This prioritizes foods where the main keyword is a PRIMARY subject, not secondary
  const wordBoundarySearch = await Food.find({ 
    name: new RegExp(`(^|\\s)${escaped}(\\s|,|$)`, "i") 
  }).limit(20);

  const validWB = wordBoundarySearch.filter(f => isReasonableMatch(f.name, foodName));
  if (validWB.length > 0) {
    validWB.sort((a, b) => {
      // Prefer shorter names (more generic)
      if (a.name.length !== b.name.length) {
        return a.name.length - b.name.length;
      }
      // Prefer exact word match at start
      const aStartsWith = new RegExp(`^${escaped}`, "i").test(a.name);
      const bStartsWith = new RegExp(`^${escaped}`, "i").test(b.name);
      return bStartsWith - aStartsWith;
    });
    logNutritionAudit("db_search_word_boundary_match", { foodName, matched: validWB[0].name });
    return validWB[0];
  }

  // Step 4: Try text search as fallback
  try {
    const textResults = await Food.find({ $text: { $search: mainKeyword } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(5);
    
    const validText = textResults.filter(f => isReasonableMatch(f.name, foodName));
    if (validText.length > 0) {
      logNutritionAudit("db_search_text_match", { foodName, matched: validText[0].name });
      return validText[0];
    }
  } catch (err) {
    logNutritionAudit("db_search_text_failed", { foodName, error: err.message });
  }

  // Step 5: No good match found; return null to force AI fallback
  logNutritionAudit("db_search_no_good_match", { foodName, message: "Forcing AI fallback - no suitable database match found" });
  return null;
}

/**
 * Checks if a database food name is a reasonable match for the user's input.
 * For common foods, we require a strong match (name starts with food item).
 * For less common foods, we allow word-contains matches.
 * 
 * ALSO validates that nutritional composition matches the food type requested.
 * Example: "grilled lamb" should have near-zero carbs, not 15+ grams.
 */
function isReasonableMatch(dbFoodName, userInput) {
  const db = dbFoodName.toLowerCase();
  const user = userInput.toLowerCase();
  const mainKeyword = user.split(/\s+/)[0];

  // REJECT: Supplements, powders, processed derivatives
  const rejectPatterns = [
    /supplement|powder|mix|drink\s*mix|shake|bar\b|flavored|fortified|enriched|instant|processed|artificial|frozen|dessert|candy|cookie|cake|pie|tart|brownie|pudding|mousse|gelatin|custard|crepe|pancake|waffle|donut|biscuit|imitation|meatless|breaded|fried/i,
  ];

  for (const pattern of rejectPatterns) {
    if (pattern.test(db)) {
      return false;
    }
  }

  // For common foods, require strict match: must START with the food name
  const commonFoods = ["milk", "chicken", "egg", "bread", "rice"];
  if (commonFoods.includes(mainKeyword)) {
    // Must start with the keyword (e.g., "Milk, whole" but not "Potatoes with milk")
    const startsWithKeyword = new RegExp(`^${mainKeyword}\\b`, "i").test(db);
    if (!startsWithKeyword) {
      return false;
    }
  }

  return true;
}

/**
 * VALIDATION: Ensures food nutrition composition matches the requested food type
 * Catches matches where carbs/protein/fat ratios are unrealistic for the food category
 * 
 * Examples:
 * - Plain meat should have ~0g carbs (rejects Lamb Keema with 15g carbs)
 * - Rice should have ~28g carbs per 100g (rejects substitutes)
 * - Eggs should be high protein, not high carb
 */
function validateNutritionComposition(userInput, dbFoodName, nutrition_per_100g) {
  const user = userInput.toLowerCase();
  const db = dbFoodName.toLowerCase();
  const carbs = Number(nutrition_per_100g.carbs) || 0;
  const protein = Number(nutrition_per_100g.protein) || 0;
  const fat = Number(nutrition_per_100g.fat) || 0;
  const fiber = Number(nutrition_per_100g.fiber) || 0;

  // PLAIN MEAT RULE: meat without mixed dishes should have <5g carbs
  const isMeatRequest = /\b(meat|lamb|chicken|beef|fish|egg|turkey|pork)\b/.test(user) &&
                       !/\b(curry|keema|biryani|kabab|kebab|masala|fry|sauce|gravy)\b/.test(user);
  if (isMeatRequest && carbs > 4) {
    logNutritionAudit("validation_fail_high_carb_meat", {
      userInput,
      matchedFood: dbFoodName,
      carbs,
      reason: "Plain meat should have near-zero carbs, but this has high carbs"
    });
    return false;
  }

  // RICE/GRAIN RULE: rice/grains should have 20-40g carbs per 100g
  const isRiceRequest = /\b(rice|grain|wheat|oat|barley|pasta|noodle)\b/.test(user);
  if (isRiceRequest && (carbs < 15 || carbs > 80)) {
    logNutritionAudit("validation_fail_bad_carb_grain", {
      userInput,
      matchedFood: dbFoodName,
      carbs,
      reason: "Rice/grains should have 16-80g carbs/100g"
    });
    return false;
  }

  // EGG RULE: eggs should have ~12-13g protein, <2g carbs per 100g
  const isEggRequest = /\b(egg|eggs)\b/.test(user);
  if (isEggRequest) {
    if (protein < 10 || carbs > 3) {
      logNutritionAudit("validation_fail_bad_egg", {
        userInput,
        matchedFood: dbFoodName,
        protein,
        carbs,
        reason: "Eggs should have 10-15g protein and <3g carbs"
      });
      return false;
    }
  }

  // FRUIT RULE: fruits should be mostly carbs, low protein
  const isFruitRequest = /\b(apple|banana|orange|grape|berry|mango|papaya|pineapple|peach)\b/.test(user);
  if (isFruitRequest) {
    if (protein > 2 || (carbs + fiber) < 8) {
      logNutritionAudit("validation_fail_bad_fruit", {
        userInput,
        matchedFood: dbFoodName,
        protein,
        carbs,
        fiber,
        reason: "Fruits should be carb-heavy with low protein"
      });
      return false;
    }
  }

  return true;
}

/**
 * Searches MongoDB first (for all foods), fallback to AI if not found.
 * Always stores/returns per-100 values.
 */
async function searchFoodInDatabase(foodName) {
  try {
    logNutritionAudit("db_lookup_start", { foodName });

    const dbMatch = await findBestFoodMatch(foodName);
    if (dbMatch && dbMatch.food) {
      const category = (!dbMatch.food.category || dbMatch.food.category === "other")
        ? detectCategory(dbMatch.food.name)
        : dbMatch.food.category;

      let canonicalNutrition = mapDbFoodToCanonical(dbMatch.food);
      if (dbMatch.cookingMethod && dbMatch.cookingMethod !== "raw") {
        canonicalNutrition = adjustForCookingMethod(canonicalNutrition, dbMatch.cookingMethod, 100);
      }

      validateNutrientValues(canonicalNutrition, dbMatch.food.name);

      const per100 = canonicalToPer100(canonicalNutrition);
      const { vitamins, minerals } = canonicalToLegacyMicronutrients(canonicalNutrition);

      logNutritionAudit("db_lookup_hit", {
        foodName,
        matched: dbMatch.food.name,
        category,
        matchType: dbMatch.matchType,
        cookingMethod: dbMatch.cookingMethod,
      });

      return {
        name: dbMatch.food.name,
        category,
        per100,
        vitamins,
        minerals,
        source: dbMatch.food.source || "database",
        serving: dbMatch.food.serving || { unit: "gram", quantity: 100, grams: 100 },
        matched_pattern: dbMatch.matchedPattern,
        cooking_method: dbMatch.cookingMethod || null,
      };
    }

    logNutritionAudit("db_lookup_miss", { foodName, message: "Food not found in database, using AI fallback" });

    const aiNutrition = await analyzeMeal(foodName);
    let canonicalFromAi = mapAiResponseToCanonical(aiNutrition);
    canonicalFromAi = recalculateCalories(canonicalFromAi);

    const per100 = canonicalToPer100(canonicalFromAi);
    const { vitamins, minerals } = canonicalToLegacyMicronutrients(canonicalFromAi);
    const category = detectCategory(foodName);

    logNutritionAudit("ai_fallback_result", { foodName, category, per100 });

    await Food.updateOne(
      { canonical_name: normalizeFoodName(foodName) },
      {
        $set: {
          name: foodName,
          category,
          region: "all_india",
          nutrition_per_100g: canonicalToDbMacros(canonicalFromAi),
          micronutrients_per_100g: canonicalToDbMicronutrients(canonicalFromAi),
          serving: {
            unit: "gram",
            quantity: 100,
            grams: 100,
          },
          source: "ai_generated",
          verified: false,
        },
      },
      { upsert: true }
    );

    return {
      name: foodName,
      category,
      per100,
      vitamins,
      minerals,
      source: "ai",
      serving: { unit: "gram", quantity: 100, grams: 100 },
    };
  } catch (error) {
    console.error(`Error with food "${foodName}":`, error.message);
    throw error;
  }
}

/**
 * NEW: Database-first analysis with AI fallback using canonical nutrients.
 * Uses fixedNutritionPipeline for proper nutrient handling.
 */
async function searchFoodAndAnalyze(foodInput) {
  try {
    // Use the new fixed pipeline
    const mealAnalysis = await analyzeMealComplete(foodInput, analyzeMeal);

    // ===== CRITICAL FIX: Show user-recognized foods, not DB-matched names =====
    // Filter items with low confidence and collect warnings
    const warnings = [];
    const items = mealAnalysis.items
      .filter(item => {
        // ONLY include items with confidence >= 0.6
        if (item.confidence === 'low' || item.confidence < 0.6) {
          warnings.push(`"${item.original_input}" confidence is low - values may not be accurate`);
          return false;
        }
        return true;
      })
      .map(item => ({
        // ===== SHOW ORIGINAL USER INPUT, NOT DB NAME =====
        // User says "2 roti" → Show "Roti"
        // NOT "Beef rib" or other DB matches
        name: item.original_input,
        matched_food_name: item.matched_food_name, // Keep for internal debugging only
        quantity: item.quantity,
        unit: item.unit,
        weightInGrams: item.weight_grams,
        source: item.source,
        confidence: item.confidence,
        cooking_method: item.cooking_method,
        nutrition: {
          macros: formatSubObject(item.nutrition_scaled, [
            'calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 
            'fiber_g', 'sugar_g', 'saturated_fat_g'
          ]),
          vitamins: formatSubObject(item.nutrition_scaled, [
            'vitamin_a_mcg', 'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg',
            'vitamin_b6_mg', 'vitamin_b12_mcg', 'vitamin_c_mg', 'vitamin_d_mcg',
            'vitamin_e_mg', 'vitamin_k_mcg', 'folate_mcg'
          ]),
          minerals: formatSubObject(item.nutrition_scaled, [
            'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg',
            'sodium_mg', 'zinc_mg'
          ]),
        },
      }));

    // Add generic warning if all items were filtered out
    if (items.length === 0 && mealAnalysis.items.length > 0) {
      warnings.push('No items had sufficient confidence. Please try again with clearer food descriptions.');
    }

    return {
      input: mealAnalysis.input,
      source: mealAnalysis.source,
      confidence: mealAnalysis.confidence,
      items,
      warnings: warnings.length > 0 ? warnings : [],
      macros: formatSubObject(mealAnalysis.totals.macros, [
        'calories_kcal', 'protein_g', 'carbs_g', 'fat_g',
        'fiber_g', 'sugar_g', 'saturated_fat_g'
      ]),
      vitamins: formatSubObject(mealAnalysis.totals.vitamins, [
        'vitamin_a_mcg', 'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg',
        'vitamin_b6_mg', 'vitamin_b12_mcg', 'vitamin_c_mg', 'vitamin_d_mcg',
        'vitamin_e_mg', 'vitamin_k_mcg', 'folate_mcg'
      ]),
      minerals: formatSubObject(mealAnalysis.totals.minerals, [
        'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg',
        'sodium_mg', 'zinc_mg'
      ]),
    };
  } catch (error) {
    console.error("Error in searchFoodAndAnalyze:", error.message);
    logNutritionAudit("meal_analysis_failed", {
      input: foodInput,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Helper: Extract subset of nutrient object for specific fields
 */
function formatSubObject(nutrient, fields) {
  const result = {};
  const fieldMap = {
    'calories_kcal': 'calories',
    'protein_g': 'protein',
    'carbs_g': 'carbs',
    'fat_g': 'fat',
    'fiber_g': 'fiber',
    'sugar_g': 'sugar',
    'saturated_fat_g': 'saturatedFat',
    'vitamin_a_mcg': 'vitaminA',
    'vitamin_b1_mg': 'vitaminB1',
    'vitamin_b2_mg': 'vitaminB2',
    'vitamin_b3_mg': 'vitaminB3',
    'vitamin_b6_mg': 'vitaminB6',
    'vitamin_b12_mcg': 'vitaminB12',
    'vitamin_c_mg': 'vitaminC',
    'vitamin_d_mcg': 'vitaminD',
    'vitamin_e_mg': 'vitaminE',
    'vitamin_k_mcg': 'vitaminK',
    'folate_mcg': 'folate',
    'calcium_mg': 'calcium',
    'iron_mg': 'iron',
    'magnesium_mg': 'magnesium',
    'potassium_mg': 'potassium',
    'sodium_mg': 'sodium',
    'zinc_mg': 'zinc',
  };
  
  fields.forEach(field => {
    const simpleFieldName = fieldMap[field] || field.replace(/_mcg|_mg|_g|_kcal/, '');
    result[simpleFieldName] = nutrient[field] ?? null;
  });
  return result;
}

function roundToTwo(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function canonicalToPer100(nutrient) {
  return {
    calories: roundToTwo(nutrient.calories_kcal),
    protein: roundToTwo(nutrient.protein_g),
    carbs: roundToTwo(nutrient.carbs_g),
    fat: roundToTwo(nutrient.fat_g),
    fiber: roundToTwo(nutrient.fiber_g),
    sugar: roundToTwo(nutrient.sugar_g),
    saturatedFat: roundToTwo(nutrient.saturated_fat_g),
  };
}

function canonicalToLegacyMicronutrients(nutrient) {
  return {
    vitamins: {
      vitaminA: roundToTwo(nutrient.vitamin_a_mcg),
      vitaminB1: roundToTwo(nutrient.vitamin_b1_mg),
      vitaminB2: roundToTwo(nutrient.vitamin_b2_mg),
      vitaminB3: roundToTwo(nutrient.vitamin_b3_mg),
      vitaminB6: roundToTwo(nutrient.vitamin_b6_mg),
      vitaminB12: roundToTwo(nutrient.vitamin_b12_mcg),
      vitaminC: roundToTwo(nutrient.vitamin_c_mg),
      vitaminD: roundToTwo(nutrient.vitamin_d_mcg),
      vitaminE: roundToTwo(nutrient.vitamin_e_mg),
      vitaminK: roundToTwo(nutrient.vitamin_k_mcg),
      folate: roundToTwo(nutrient.folate_mcg),
    },
    minerals: {
      calcium: roundToTwo(nutrient.calcium_mg),
      iron: roundToTwo(nutrient.iron_mg),
      magnesium: roundToTwo(nutrient.magnesium_mg),
      potassium: roundToTwo(nutrient.potassium_mg),
      sodium: roundToTwo(nutrient.sodium_mg),
      zinc: roundToTwo(nutrient.zinc_mg),
    },
  };
}

function canonicalToDbMacros(nutrient) {
  return {
    calories: nutrient.calories_kcal ?? 0,
    protein: nutrient.protein_g ?? 0,
    carbs: nutrient.carbs_g ?? 0,
    fat: nutrient.fat_g ?? 0,
    fiber: nutrient.fiber_g ?? 0,
    sugar: nutrient.sugar_g ?? 0,
    saturatedFat: nutrient.saturated_fat_g ?? 0,
  };
}

function canonicalToDbMicronutrients(nutrient) {
  return {
    vitaminA: nutrient.vitamin_a_mcg ?? null,
    vitaminB1: nutrient.vitamin_b1_mg ?? null,
    vitaminB2: nutrient.vitamin_b2_mg ?? null,
    vitaminB3: nutrient.vitamin_b3_mg ?? null,
    vitaminB6: nutrient.vitamin_b6_mg ?? null,
    vitaminB12: nutrient.vitamin_b12_mcg ?? null,
    vitaminC: nutrient.vitamin_c_mg ?? null,
    vitaminD: nutrient.vitamin_d_mcg ?? null,
    vitaminE: nutrient.vitamin_e_mg ?? null,
    vitaminK: nutrient.vitamin_k_mcg ?? null,
    folate: nutrient.folate_mcg ?? null,
    calcium: nutrient.calcium_mg ?? null,
    iron: nutrient.iron_mg ?? null,
    magnesium: nutrient.magnesium_mg ?? null,
    potassium: nutrient.potassium_mg ?? null,
    sodium: nutrient.sodium_mg ?? null,
    zinc: nutrient.zinc_mg ?? null,
  };
}

function parseQuantityAndUnit(itemString) {
  const parsed = parseFoodItem(itemString);
  if (!parsed) return null;
  return {
    foodName: parsed.food_name,
    quantity: parsed.quantity,
    unit: parsed.unit,
  };
}

function extractFoodItems(foodInput) {
  return parseFoodInput(foodInput).map((item) => ({
    foodName: item.food_name,
    quantity: item.quantity,
    unit: item.unit,
  }));
}

function scaleNutritionToQuantity(nutritionPer100, quantity, unit, foodName = "") {
  const weightInGrams = convertToGrams(quantity, unit, foodName || "unknown");
  return {
    macros: scalePer100ToWeight(nutritionPer100.macros || {}, weightInGrams),
    vitamins: scalePer100ToWeight(nutritionPer100.vitamins || {}, weightInGrams),
    minerals: scalePer100ToWeight(nutritionPer100.minerals || {}, weightInGrams),
  };
}

module.exports = {
  analyzeMeal,
  isFoodInput,
  getGoalFeedback,
  generateDietPlan,
  searchFoodAndAnalyze,
};
