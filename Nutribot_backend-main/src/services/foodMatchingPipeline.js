/**
 * PRODUCTION-GRADE FOOD MATCHING PIPELINE
 * 
 * Priority-based food matching with AI fallback
 * Goals:
 * - Fast response (<2 seconds)
 * - Accurate food matching (NO wrong mappings)
 * - Intelligent fallback to AI (ONLY when needed)
 * - High-confidence results cached
 */

const axios = require('axios');
const Food = require('../models/Food');
const { normalizeFoodName, logNutritionAudit, parseFoodItem } = require('../utils/nutritionEngine');
const { cacheGet, cacheSet } = require('./cacheService');

// ============================================================================
// PHASE 1: FOOD NORMALIZER - Indian Food Mapping Dictionary
// ============================================================================

const INDIAN_FOOD_MAPPINGS = {
  // BREADS & GRAINS
  'roti': { canonical: 'whole wheat chapati', confidence: 1.0 },
  'rotis': { canonical: 'whole wheat chapati', confidence: 1.0 },
  'chapati': { canonical: 'whole wheat chapati', confidence: 1.0 },
  'chappati': { canonical: 'whole wheat chapati', confidence: 1.0 },
  'dosa': { canonical: 'rice dosa', confidence: 1.0 },
  'idli': { canonical: 'rice idli', confidence: 1.0 },
  'sambar': { canonical: 'sambar vegetable curry', confidence: 1.0 },
  'paratha': { canonical: 'stuffed wheat paratha', confidence: 1.0 },
  'aloo paratha': { canonical: 'stuffed wheat paratha', confidence: 0.95 },
  'puri': { canonical: 'fried wheat puri', confidence: 1.0 },
  'naan': { canonical: 'naan bread', confidence: 1.0 },
  'bhature': { canonical: 'fried wheat bhature', confidence: 1.0 },
  'chole bhature': { canonical: 'chickpea curry with fried bhature', confidence: 0.95 },
  'rice': { canonical: 'white rice boiled', confidence: 0.95 },
  'basmati rice': { canonical: 'white rice boiled', confidence: 0.9 },
  'brown rice': { canonical: 'brown rice boiled', confidence: 0.95 },
  'biryani': { canonical: 'rice biryani', confidence: 0.9 },
  'pulao': { canonical: 'rice pilaf', confidence: 0.95 },
  'bread': { canonical: 'white bread sliced', confidence: 0.85 },
  'toast': { canonical: 'whole wheat bread', confidence: 0.9 },
  
  // VEGETABLES - CRITICAL (NO wrong mappings)
  'aloo': { canonical: 'potato boiled', confidence: 1.0 },
  'aloo sabji': { canonical: 'potato curry indian', confidence: 1.0 },
  'potato': { canonical: 'potato boiled', confidence: 1.0 },
  'boiled potato': { canonical: 'potato boiled', confidence: 1.0 },
  'baked potato': { canonical: 'potato baked', confidence: 0.95 },
  'fried potato': { canonical: 'french fries', confidence: 0.9 },
  'french fries': { canonical: 'french fries', confidence: 0.95 },
  
  'spinach': { canonical: 'spinach boiled', confidence: 1.0 },
  'palak': { canonical: 'spinach boiled', confidence: 1.0 },
  'palak paneer': { canonical: 'spinach paneer curry', confidence: 0.95 },
  'broccoli': { canonical: 'broccoli boiled', confidence: 1.0 },
  'cauliflower': { canonical: 'cauliflower boiled', confidence: 1.0 },
  'carrot': { canonical: 'carrot boiled', confidence: 1.0 },
  'tomato': { canonical: 'tomato raw', confidence: 1.0 },
  'onion': { canonical: 'onion boiled', confidence: 0.95 },
  'cucumber': { canonical: 'cucumber raw', confidence: 1.0 },
  'lettuce': { canonical: 'lettuce raw', confidence: 0.95 },
  'salad': { canonical: 'mixed vegetable salad', confidence: 0.9 },
  'bhindi': { canonical: 'okra fried', confidence: 1.0 },
  'capsicum': { canonical: 'bell pepper', confidence: 1.0 },
  'bell pepper': { canonical: 'bell pepper', confidence: 1.0 },
  'green beans': { canonical: 'green beans boiled', confidence: 1.0 },
  'beans': { canonical: 'green beans boiled', confidence: 0.95 },
  
  // LEGUMES & PULSES
  'dal': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'dals': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'daal': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'dal-rice': { canonical: 'lentil curry with rice', confidence: 0.95 },
  'lentils': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'red lentils': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'masoor': { canonical: 'lentil curry cooked', confidence: 1.0 },
  'chana': { canonical: 'chickpea curry', confidence: 1.0 },
  'chickpea': { canonical: 'chickpea curry', confidence: 1.0 },
  'chickpeas': { canonical: 'chickpea curry', confidence: 1.0 },
  'rajma': { canonical: 'kidney bean curry', confidence: 1.0 },
  'kidney beans': { canonical: 'kidney bean curry', confidence: 1.0 },
  'moong': { canonical: 'mung bean curry', confidence: 1.0 },
  'mung beans': { canonical: 'mung bean curry', confidence: 1.0 },
  'chole': { canonical: 'chickpea curry', confidence: 1.0 },
  
  // PROTEIN - VEGETARIAN (CRITICAL - prevent beef/meat mapping)
  'paneer': { canonical: 'paneer cottage cheese', confidence: 1.0 },
  'paneer curry': { canonical: 'paneer curry cooked', confidence: 1.0 },
  'paneer tikka': { canonical: 'paneer tikka grilled', confidence: 0.95 },
  'tofu': { canonical: 'tofu cooked', confidence: 1.0 },
  'soya chunks': { canonical: 'soy chunks cooked', confidence: 1.0 },
  'soy': { canonical: 'soy chunks cooked', confidence: 0.95 },
  
  // PROTEIN - NON-VEGETARIAN (disambiguate properly)
  'chicken': { canonical: 'chicken breast grilled', confidence: 0.95 },
  'chicken curry': { canonical: 'chicken curry cooked', confidence: 0.95 },
  'chicken tikka': { canonical: 'chicken tikka grilled', confidence: 0.95 },
  'roasted chicken': { canonical: 'chicken breast grilled', confidence: 0.95 },
  
  'egg': { canonical: 'chicken egg boiled', confidence: 1.0 },
  'eggs': { canonical: 'chicken egg boiled', confidence: 1.0 },
  'boiled egg': { canonical: 'chicken egg boiled', confidence: 1.0 },
  'scrambled egg': { canonical: 'egg scrambled', confidence: 1.0 },
  'fried egg': { canonical: 'egg fried', confidence: 1.0 },
  'omelette': { canonical: 'egg omelette', confidence: 1.0 },
  
  'fish': { canonical: 'tilapia fish grilled', confidence: 0.9 },
  'salmon': { canonical: 'salmon cooked', confidence: 1.0 },
  'tuna': { canonical: 'tuna canned', confidence: 1.0 },
  'prawns': { canonical: 'shrimp cooked', confidence: 1.0 },
  'shrimp': { canonical: 'shrimp cooked', confidence: 1.0 },
  
  'meat': { canonical: 'beef cooked', confidence: 0.8 },
  'beef': { canonical: 'beef cooked', confidence: 1.0 },
  'mutton': { canonical: 'mutton cooked', confidence: 1.0 },
  'lamb': { canonical: 'lamb cooked', confidence: 1.0 },
  'pork': { canonical: 'pork cooked', confidence: 0.95 },
  
  // DAIRY
  'milk': { canonical: 'milk whole cow', confidence: 1.0 },
  'cow milk': { canonical: 'milk whole cow', confidence: 1.0 },
  'buffalo milk': { canonical: 'milk buffalo', confidence: 1.0 },
  'greek yogurt': { canonical: 'yogurt greek', confidence: 1.0 },
  'yogurt': { canonical: 'yogurt plain low fat', confidence: 0.95 },
  'curd': { canonical: 'yogurt plain low fat', confidence: 1.0 },
  'lassi': { canonical: 'lassi yogurt drink', confidence: 1.0 },
  'cheese': { canonical: 'cheese cheddar', confidence: 0.9 },
  'butter': { canonical: 'butter salted', confidence: 1.0 },
  'ghee': { canonical: 'ghee clarified butter', confidence: 1.0 },
  'cream': { canonical: 'cream heavy', confidence: 0.95 },
  'ice cream': { canonical: 'ice cream vanilla', confidence: 0.9 },
  
  // FRUITS
  'apple': { canonical: 'apple raw', confidence: 1.0 },
  'banana': { canonical: 'banana raw', confidence: 1.0 },
  'orange': { canonical: 'orange raw', confidence: 1.0 },
  'mango': { canonical: 'mango raw', confidence: 1.0 },
  'papaya': { canonical: 'papaya raw', confidence: 1.0 },
  'guava': { canonical: 'guava raw', confidence: 1.0 },
  'strawberry': { canonical: 'strawberry raw', confidence: 1.0 },
  'grapes': { canonical: 'grapes raw', confidence: 1.0 },
  'watermelon': { canonical: 'watermelon raw', confidence: 1.0 },
  'pineapple': { canonical: 'pineapple raw', confidence: 1.0 },
  'lemon': { canonical: 'lemon raw', confidence: 1.0 },
  'coconut': { canonical: 'coconut raw', confidence: 0.95 },
  'pomegranate': { canonical: 'pomegranate raw', confidence: 1.0 },
  
  // NUTS & SEEDS
  'almond': { canonical: 'almonds raw', confidence: 1.0 },
  'almonds': { canonical: 'almonds raw', confidence: 1.0 },
  'cashew': { canonical: 'cashew nuts raw', confidence: 1.0 },
  'cashews': { canonical: 'cashew nuts raw', confidence: 1.0 },
  'peanuts': { canonical: 'peanuts raw', confidence: 1.0 },
  'peanut': { canonical: 'peanuts raw', confidence: 1.0 },
  'walnut': { canonical: 'walnuts raw', confidence: 1.0 },
  'walnuts': { canonical: 'walnuts raw', confidence: 1.0 },
  'sesame': { canonical: 'sesame seeds raw', confidence: 1.0 },
  'flax': { canonical: 'flaxseeds raw', confidence: 1.0 },
  'chia': { canonical: 'chia seeds raw', confidence: 1.0 },
  
  // BEVERAGES
  'tea': { canonical: 'milk tea', confidence: 0.9 },
  'chai': { canonical: 'milk tea', confidence: 0.95 },
  'coffee': { canonical: 'coffee black', confidence: 0.9 },
  'juice': { canonical: 'orange juice', confidence: 0.8 },
  'water': { canonical: 'water', confidence: 1.0 },
  'smoothie': { canonical: 'fruit smoothie', confidence: 0.85 },
};

// ============================================================================
// PHASE 2: FUZZY MATCHING - Levenshtein distance
// ============================================================================

function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - distance / maxLen;
}

// ============================================================================
// PHASE 3: PRIORITY-BASED FOOD LOOKUP
// ============================================================================

async function searchFoodByPriority(foodName, quantity, unit) {
  const cacheKey = `food:${foodName}:${quantity}:${unit}`;
  
  // Check cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logNutritionAudit('cache_hit', { foodName, cacheKey });
    return cached;
  }

  const normalized = normalizeFoodName(foodName);
  let result = null;
  let matchType = null;

  // PRIORITY 1: EXACT MATCH (case-insensitive)
  result = await searchDatabaseExact(normalized);
  if (result) {
    matchType = 'exact_match';
    logNutritionAudit('food_match', { matchType, foodName, matched: result.name });
  }

  // PRIORITY 2: DICTIONARY MAPPING (Indian foods)
  if (!result) {
    const dictEntry = INDIAN_FOOD_MAPPINGS[normalized];
    if (dictEntry) {
      result = await searchDatabaseExact(normalizeFoodName(dictEntry.canonical));
      if (result) {
        matchType = 'dictionary_mapping';
        logNutritionAudit('food_match', { 
          matchType, 
          original: foodName, 
          mapped: dictEntry.canonical,
          matched: result.name 
        });
      }
    }
  }

  // PRIORITY 3: FUZZY MATCH (in parallel with DB search)
  if (!result) {
    result = await searchDatabaseFuzzy(normalized);
    if (result) {
      matchType = 'fuzzy_match';
      logNutritionAudit('food_match', { matchType, foodName, matched: result.name });
    }
  }

  // PRIORITY 4: AI FALLBACK (LAST RESORT)
  if (!result) {
    matchType = 'ai_fallback';
    result = await aiLookupWithTimeout(foodName, 2000); // 2 second timeout
    
    if (result && result.confidence > 0.8) {
      // Save to DB if high confidence
      result.source = 'ai_generated';
      result.verified = false;
      await saveFoodToDatabase(result);
      logNutritionAudit('ai_food_saved', { foodName, confidence: result.confidence });
    } else if (!result || result.confidence < 0.6) {
      // Reject if low confidence
      logNutritionAudit('ai_fallback_rejected', { 
        foodName, 
        confidence: result?.confidence || 0,
        reason: 'Low confidence'
      });
      return null;
    }
  }

  if (result) {
    result.matchType = matchType;
    result.source = result.source || 'database';
    
    // Cache the result
    await cacheSet(cacheKey, result, 3600); // 1 hour TTL
  }

  return result;
}

async function searchDatabaseExact(normalizedName) {
  try {
    return await Food.findOne(
      {
        $or: [
          { canonical_name: normalizedName },
          { name_normalized: normalizedName },
          { aliases: { $in: [normalizedName] } }
        ]
      },
      'name canonical_name aliases nutrition_per_100g micronutrients_per_100g source verified',
      { maxTimeMS: 1000 }
    ).lean();
  } catch (error) {
    console.error('Exact search error:', error.message);
    return null;
  }
}

async function searchDatabaseFuzzy(normalizedName) {
  try {
    // Use regex for partial matches
    const regex = new RegExp(normalizedName, 'i');
    const candidates = await Food.find(
      {
        $or: [
          { canonical_name: regex },
          { name_normalized: regex },
          { aliases: regex }
        ]
      },
      'name canonical_name aliases nutrition_per_100g micronutrients_per_100g source verified',
      { maxTimeMS: 1500, limit: 10 }
    ).lean();

    if (!candidates.length) return null;

    // Score by similarity
    const scored = candidates.map(food => ({
      ...food,
      similarity: calculateSimilarity(normalizedName, food.canonical_name || food.name)
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    
    // Only return if similarity > 0.7 (70%)
    return scored[0].similarity > 0.7 ? scored[0] : null;
  } catch (error) {
    console.error('Fuzzy search error:', error.message);
    return null;
  }
}

// ============================================================================
// PHASE 5: AI FALLBACK WITH TIMEOUT
// ============================================================================

async function aiLookupWithTimeout(foodName, timeoutMs = 2000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI lookup timeout')), timeoutMs)
  );

  try {
    const aiPromise = queryAIForFood(foodName);
    const result = await Promise.race([aiPromise, timeoutPromise]);
    return result;
  } catch (error) {
    if (error.message === 'AI lookup timeout') {
      logNutritionAudit('ai_timeout', { foodName, timeoutMs });
    } else {
      logNutritionAudit('ai_error', { foodName, error: error.message });
    }
    return null;
  }
}

async function queryAIForFood(foodName) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert. Given a food name, return ONLY valid nutritional data in JSON format.
            If the food name is unclear or ambiguous, return confidence: 0.
            NEVER make up food names or nutrition values.
            Return confidence between 0-1 (1 = certain, 0 = unknown).`
          },
          {
            role: 'user',
            content: `What are the nutritional values per 100g for: "${foodName}"?
            Return JSON: {
              "name": "food name",
              "confidence": 0-1,
              "nutrition_per_100g": {
                "calories": number,
                "protein": number,
                "carbohydrates": number,
                "fat": number,
                "fiber": number,
                "sugar": number
              },
              "micronutrients_per_100g": {
                "calcium": number,
                "iron": number,
                "vitaminD": number,
                "vitaminB12": number,
                "vitaminC": number,
                "zinc": number,
                "magnesium": number,
                "potassium": number,
                "folate": number
              }
            }`
          }
        ],
        temperature: 0,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return null;
    
    const result = JSON.parse(jsonMatch[0]);
    return result.confidence >= 0.6 ? result : null;
  } catch (error) {
    console.error('AI query error:', error.message);
    return null;
  }
}

async function saveFoodToDatabase(foodData) {
  try {
    const newFood = new Food({
      name: foodData.name,
      canonical_name: normalizeFoodName(foodData.name),
      name_normalized: normalizeFoodName(foodData.name),
      nutrition_per_100g: foodData.nutrition_per_100g,
      micronutrients_per_100g: foodData.micronutrients_per_100g,
      source: 'ai_generated',
      verified: false,
      confidence: foodData.confidence,
      aliases: [normalizeFoodName(foodData.name)]
    });
    
    await newFood.save();
    logNutritionAudit('food_saved_to_db', { foodName: foodData.name });
  } catch (error) {
    console.error('Error saving food to database:', error.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  searchFoodByPriority,
  INDIAN_FOOD_MAPPINGS,
  aiLookupWithTimeout,
};
