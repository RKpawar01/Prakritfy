const mongoose = require("mongoose");
const { normalizeFoodName } = require("../utils/nutritionEngine");

const foodSchema = new mongoose.Schema(
  {
    // Basic information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    canonical_name: {
      type: String,
      index: true,
      default: null,
    },
    common_misspellings: {
      type: [String],
      default: [],
    },
    search_tokens: {
      type: [String],
      default: [],
    },

    // Categorization
    category: {
      type: String,
      enum: [
        "breakfast",
        "lunch",
        "dinner",
        "snacks",
        "fruits",
        "vegetables",
        "dairy",
        "protein",
        "grains",
        "legumes",
        "beverages",
        "sweets",
        "poultry",
        "seafood",
        "meat",
        "regional",
        "eggs",
      ],
      required: true,
    },

    // Dietary preferences
    diet_tags: {
      type: [String],
      enum: ["vegan", "vegetarian", "eggetarian", "non_vegetarian", "gluten_free", "high_fiber"],
      default: [],
    },

    // Health & fitness goals
    goal_tags: {
      type: [String],
      enum: ["weight_loss", "weight_gain", "muscle_gain", "general_fitness"],
      default: [],
    },
    subcategory: {
      type: String,
      default: "",
    },
    region: {
      type: String,
      enum: [
        "all_india",
        "maharashtra",
        "gujarat",
        "punjab",
        "rajasthan",
        "south_india",
        "bengal",
        "bihar_up",
        "north_india",
        "delhi",
        "himachal_pradesh",
        "coastal_india",
      ],
      required: true,
    },
    state_tags: {
      type: [String],
      default: [],
    },

    // Serving information
    serving: {
      unit: { type: String, required: true }, // e.g., 'piece', 'cup', 'ml', 'tbsp'
      quantity: { type: Number, required: true }, // e.g., 1, 0.5, 200
      grams: { type: Number, required: true }, // Weight in grams for serving
    },
    serving_units: {
      type: [String],
      default: [],
    },
    piece_weight_grams: {
      type: Number,
    },
    preparation_state: {
      type: String,
      enum: ["raw", "cooked", "ready_to_eat"],
      default: "raw",
    },
    cooking_method: {
      type: String,
      enum: ["raw", "boiled", "fried", "grilled", "roasted", "steamed", "sauteed", "baked", "curried"],
      default: "raw",
    },
    budget_category: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    availability: {
      type: String,
      enum: ["common", "seasonal", "rare"],
      default: "common",
    },

    // Macronutrients per 100g (SINGLE SOURCE OF TRUTH)
    nutrition_per_100g: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
      fiber: { type: Number, required: true },
      sugar: { type: Number, required: true },
      saturatedFat: { type: Number, required: true },
    },

    // Micronutrients per 100g (optional but tracked)
    // IMPORTANT: Do NOT use default: 0 or default: null
    // Leave undefined if data is not available; this preserves "unknown" state
    micronutrients_per_100g: {
      vitaminA: { type: Number }, // in µg
      vitaminB1: { type: Number }, // in mg
      vitaminB2: { type: Number }, // in mg
      vitaminB3: { type: Number }, // in mg
      vitaminB6: { type: Number }, // in mg
      vitaminB12: { type: Number }, // in µg
      vitaminC: { type: Number }, // in mg
      vitaminD: { type: Number }, // in µg
      vitaminE: { type: Number }, // in mg
      vitaminK: { type: Number }, // in µg
      folate: { type: Number }, // in µg
      calcium: { type: Number }, // in mg
      iron: { type: Number }, // in mg
      magnesium: { type: Number }, // in mg
      potassium: { type: Number }, // in mg
      sodium: { type: Number }, // in mg
      zinc: { type: Number }, // in mg
    },

    // Metadata
    source: {
      type: String,
      enum: ["ai_generated", "user_entered", "verified_database", "ifct"],
      default: "ai_generated",
    },
    source_reference: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verification_status: {
      type: String,
      enum: ["verified", "pending", "deprecated"],
      default: "verified",
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient searching and uniqueness
foodSchema.index({ aliases: 1 });
foodSchema.index({ category: 1 });
foodSchema.index({ region: 1 });
foodSchema.index({ name: "text", aliases: "text" }); // Text index for full-text search
foodSchema.index({ name: 1 }, { unique: true }); // Prevent duplicates by name
foodSchema.index({ canonical_name: 1 });
foodSchema.index({ search_tokens: 1 });

const SEARCH_TOKEN_LIMIT = 50;

function buildSearchTokenSet(values = []) {
  const tokens = new Set();

  values
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .forEach((value) => {
      const normalized = normalizeFoodName(value);
      if (!normalized) {
        return;
      }

      tokens.add(normalized);

      normalized
        .split(" ")
        .filter(Boolean)
        .forEach((token) => tokens.add(token));
    });

  return Array.from(tokens).slice(0, SEARCH_TOKEN_LIMIT);
}

function applySearchMetadataToDoc(doc) {
  if (doc.name && !doc.canonical_name) {
    doc.canonical_name = normalizeFoodName(doc.name);
  }

  const candidates = [
    doc.name,
    doc.canonical_name,
    ...(doc.aliases || []),
    ...(doc.common_misspellings || []),
    ...(doc.search_tokens || []),
  ];

  const tokens = buildSearchTokenSet(candidates);
  if (tokens.length > 0) {
    doc.search_tokens = tokens;
  }
}

function getUpdateValue(update, key) {
  if (update.$set && Object.prototype.hasOwnProperty.call(update.$set, key)) {
    return update.$set[key];
  }
  if (update.$setOnInsert && Object.prototype.hasOwnProperty.call(update.$setOnInsert, key)) {
    return update.$setOnInsert[key];
  }
  if (Object.prototype.hasOwnProperty.call(update, key)) {
    return update[key];
  }
  return undefined;
}

function applySearchMetadataToUpdate(update = {}) {
  const $set = update.$set || {};
  const name = getUpdateValue(update, "name");
  let canonical = getUpdateValue(update, "canonical_name");
  const aliases = getUpdateValue(update, "aliases");
  const misspellings = getUpdateValue(update, "common_misspellings");
  const manualTokens = getUpdateValue(update, "search_tokens");

  const shouldProcessTokens =
    name !== undefined ||
    canonical !== undefined ||
    aliases !== undefined ||
    misspellings !== undefined ||
    manualTokens !== undefined;

  if (name && !canonical) {
    canonical = normalizeFoodName(name);
    $set.canonical_name = canonical;
  }

  if (shouldProcessTokens) {
    const tokenCandidates = [
      name,
      canonical,
      ...(Array.isArray(aliases) ? aliases : []),
      ...(Array.isArray(misspellings) ? misspellings : []),
      ...(Array.isArray(manualTokens) ? manualTokens : []),
    ];

    const tokens = buildSearchTokenSet(tokenCandidates);
    if (tokens.length > 0) {
      $set.search_tokens = tokens;
    }
  }

  if (Object.keys($set).length > 0) {
    update.$set = $set;
  }

  return update;
}

// Pre-save middleware to validate nutrition data and add search metadata
foodSchema.pre("save", function (next) {
  try {
    applySearchMetadataToDoc(this);

    const required_fields = [
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sugar",
      "saturatedFat",
    ];

    for (const field of required_fields) {
      if (
        typeof this.nutrition_per_100g[field] !== "number" ||
        isNaN(this.nutrition_per_100g[field])
      ) {
        return next(
          new Error(
            `Invalid nutrition value for ${field}. Must be a number. Got: ${this.nutrition_per_100g[field]}`
          )
        );
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Pre-update middleware to maintain search metadata on updates
["updateOne", "updateMany", "findOneAndUpdate", "update"].forEach((hook) => {
  foodSchema.pre(hook, function (next) {
    const update = this.getUpdate();
    if (update) {
      this.setUpdate(applySearchMetadataToUpdate(update));
    }
    next();
  });
});

module.exports = mongoose.model("Food", foodSchema);
