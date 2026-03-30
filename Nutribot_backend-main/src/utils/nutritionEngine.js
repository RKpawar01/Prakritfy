const PIECE_WEIGHT_GRAMS = {
  egg: 50,
  banana: 120,
  apple: 180,
  bread_slice: 30,
  bread: 30,
  orange: 130,
  potato: 170,
  tomato: 120,
  onion: 110,
};

const ANIMAL_KEYWORDS = [
  "chicken",
  "beef",
  "mutton",
  "lamb",
  "fish",
  "salmon",
  "tuna",
  "prawn",
  "shrimp",
  "egg",
  "eggs",
  "turkey",
  "pork",
  "meat",
];

const LIQUID_KEYWORDS = [
  "milk",
  "juice",
  "water",
  "tea",
  "coffee",
  "soda",
  "drink",
  "beverage",
  "soup",
  "broth",
  "yogurt",
  "smoothie",
  "shake",
];

const UNIT_ALIASES = {
  g: "g",
  gm: "g",
  gms: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kgs: "kg",
  ml: "ml",
  mls: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  oz: "oz",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  piece: "piece",
  pieces: "piece",
  pc: "piece",
  pcs: "piece",
  slice: "slice",
  slices: "slice",
};

const UNIT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  oz: 28.35,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  slice: 30,
};

function logNutritionAudit(stage, payload) {
  console.log(`[nutrition-audit] ${stage}:`, JSON.stringify(payload));
}

function normalizeFoodName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(token) {
  if (!token) return token;
  // Handle -ies → -y (ladies → lady)
  if (token.endsWith("ies") && token.length > 3) return `${token.slice(0, -3)}y`;
  
  // Handle special -toes words (potatoes, tomatoes)
  if (token.endsWith("toes") && token.length > 4) return token.slice(0, -2);
  
  // Handle -shes, -ches, -xes, -zes patterns (glasses → glass, wishes → wish)
  if ((token.endsWith("shes") || token.endsWith("ches") || token.endsWith("xes") || token.endsWith("zes")) && token.length > 4) {
    return token.slice(0, -2);
  }
  
  // Default: remove final -s (apples → apple, eggs → egg)
  if (token.endsWith("s") && token.length > 2) return token.slice(0, -1);
  
  return token;
}

function canonicalFoodKey(foodName) {
  const n = normalizeFoodName(foodName);
  if (n.includes("bread") && n.includes("slice")) return "bread_slice";
  const tokens = n.split(" ").filter(Boolean).map((t) => singularize(t));
  for (const token of tokens) {
    if (PIECE_WEIGHT_GRAMS[token]) return token;
  }
  return tokens[0] || n;
}

function detectCategory(foodName) {
  const n = normalizeFoodName(foodName);
  if (LIQUID_KEYWORDS.some((k) => n.includes(k))) {
    return "liquid";
  }
  if (ANIMAL_KEYWORDS.some((k) => n.includes(k))) {
    return "animal";
  }
  return "solid";
}

function parseFoodItem(rawItem) {
  const text = String(rawItem || "").trim();
  if (!text) return null;

  // Updated regex: allow quantity and unit ANYWHERE in the string (not just at start)
  // Matches patterns like "roasted chicken 500g" or "500g chicken"
  const match = text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z_]+)?/);
  if (!match) {
    return { quantity: 100, unit: "g", food_name: text, defaulted: true };
  }

  const quantity = Number(match[1]);
  const rawUnit = String(match[2] || "").toLowerCase();
  
  // Extract food name by removing the quantity+unit portion from original text
  const quantityWithUnit = match[0];
  const foodName = text.replace(quantityWithUnit, "").trim();

  const knownUnit = UNIT_ALIASES[rawUnit];
  const unknownToken = rawUnit && !knownUnit;

  // Heuristics:
  // - "2 eggs" => piece (rawUnit="eggs" is unknown → piece)
  // - "2 boiled eggs" => piece with descriptor (rawUnit="boiled", foodName="eggs")
  // - "100 xyz chicken" => likely unit typo, keep grams
  // - "2 apples" => piece (rawUnit="apples", foodName="" → use rawUnit as food name)
  const countWithoutDescriptor = unknownToken && !foodName;
  const countWithDescriptor = unknownToken && !!foodName && quantity <= 10;
  const isPiece = countWithoutDescriptor || countWithDescriptor;

  const unit = isPiece ? "piece" : (knownUnit || "g");
  
  // BUILD FINAL FOOD NAME WITH CORRECT PRECEDENCE:
  let finalFoodName = text; // default fallback
  
  if (unknownToken && foodName) {
    // Case: "2 boiled eggs" → Food name is after descriptor
    finalFoodName = `${rawUnit} ${foodName}`.trim();
  } else if (unknownToken && !foodName && isPiece) {
    // Case: "2 apples" → rawUnit is actually the food name
    finalFoodName = rawUnit;
  } else if (foodName && !unknownToken) {
    // Case: "2 cups rice" where "cups" is a known unit
    finalFoodName = foodName;
  }
  // else: keep original text as fallback

  return {
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 100,
    unit,
    food_name: finalFoodName,
    defaulted: !Number.isFinite(quantity) || quantity <= 0,
  };
}

function parseFoodInput(input) {
  const parts = String(input || "")
    .split(/[,;]|(?:\band\b|\bor\b|\bwith\b)\s+/i)
    .map((x) => x.trim())
    .filter(Boolean);

  return parts
    .map(parseFoodItem)
    .filter((x) => x && x.food_name && x.food_name.length > 1);
}

function pieceToGrams(foodName, quantity) {
  const key = canonicalFoodKey(foodName);
  const gramsPerPiece = PIECE_WEIGHT_GRAMS[key];
  if (!gramsPerPiece) {
    throw new Error(`Missing piece conversion for food: ${foodName}`);
  }
  return quantity * gramsPerPiece;
}

function convertToGrams(quantity, unit, foodName) {
  if (unit === "piece") return pieceToGrams(foodName, quantity);
  const factor = UNIT_TO_GRAMS[unit];
  if (!factor) {
    throw new Error(`Unsupported unit: ${unit}`);
  }
  return quantity * factor;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function validatePer100Nutrition(per100, foodName, category) {
  const safe = {
    calories: toNumber(per100.calories),
    protein: toNumber(per100.protein),
    carbs: toNumber(per100.carbs),
    fat: toNumber(per100.fat),
    fiber: toNumber(per100.fiber),
    sugar: toNumber(per100.sugar),
    saturatedFat: toNumber(per100.saturatedFat),
  };

  // Validate no negative values
  Object.keys(safe).forEach((k) => {
    if (safe[k] < 0) {
      throw new Error(`Invalid negative ${k} for ${foodName}`);
    }
  });

  // Validate protein limits
  if (safe.protein > 50) {
    throw new Error(`Impossible protein value for ${foodName}: ${safe.protein}g/100g`);
  }

  // Validate carbs limits
  if (safe.carbs > 100) {
    throw new Error(`Impossible carbs value for ${foodName}: ${safe.carbs}g/100g`);
  }

  // Validate fat limits
  if (safe.fat > 100) {
    throw new Error(`Impossible fat value for ${foodName}: ${safe.fat}g/100g`);
  }

  // Only use formula when listed calories are missing or zero
  // Listed calories from verified databases (USDA/NIN) are more accurate than P*4+C*4+F*9
  // because the formula doesn't account for fiber (~2kcal/g), alcohol (7kcal/g), and 
  // specific Atwater factors per food type
  if (!safe.calories || safe.calories === 0) {
    const formulaCalories = safe.protein * 4 + safe.carbs * 4 + safe.fat * 9;
    safe.calories = Math.round(formulaCalories * 100) / 100;
  }

  return safe;
}

function scalePer100ToWeight(per100, weightInGrams) {
  const scale = weightInGrams / 100;
  const scaled = {};
  Object.keys(per100).forEach((k) => {
    scaled[k] = Math.round((toNumber(per100[k]) * scale) * 100) / 100;
  });
  return scaled;
}

module.exports = {
  PIECE_WEIGHT_GRAMS,
  parseFoodInput,
  parseFoodItem,
  convertToGrams,
  validatePer100Nutrition,
  scalePer100ToWeight,
  detectCategory,
  normalizeFoodName,
  canonicalFoodKey,
  logNutritionAudit,
  singularize,
};
