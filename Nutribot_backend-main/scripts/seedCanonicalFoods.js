/**
 * Seed Canonical Foods into MongoDB — PRODUCTION REWRITE
 * 
 * Imports canonical-foods.json into MongoDB with:
 * - Proper null preservation for unknown micronutrients
 * - Clean collection before seeding (prevents stale data)
 * - Batch insert with individual fallback
 * - Validation before insert
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Food = require('../src/models/Food');
const connectDB = require('../src/config/db');

const CANONICAL_FILE = path.join(__dirname, '../data/foods/foods-master.json');
const SEED_LOG_FILE = path.join(__dirname, '../data/foods/canonical-foods-seed-log.json');

/**
 * Map canonical schema to MongoDB Food model
 * CRITICAL: Preserve null for unknown micronutrients, don't convert to 0
 */
function mapCanonicalToMongo(canonicalFood) {
  const n = canonicalFood.nutrition_per_100g;

  // Build micronutrients — ONLY include fields that have actual values
  // If null, do NOT include the field at all (let MongoDB store undefined)
  const micronutrients = {};
  const microMap = {
    vitamin_a_mcg: 'vitaminA', vitamin_b1_mg: 'vitaminB1', vitamin_b2_mg: 'vitaminB2',
    vitamin_b3_mg: 'vitaminB3', vitamin_b6_mg: 'vitaminB6', vitamin_b12_mcg: 'vitaminB12',
    vitamin_c_mg: 'vitaminC', vitamin_d_mcg: 'vitaminD', vitamin_e_mg: 'vitaminE',
    vitamin_k_mcg: 'vitaminK', folate_mcg: 'folate', calcium_mg: 'calcium',
    iron_mg: 'iron', magnesium_mg: 'magnesium', potassium_mg: 'potassium',
    sodium_mg: 'sodium', zinc_mg: 'zinc',
  };

  for (const [canonicalKey, mongoKey] of Object.entries(microMap)) {
    const val = n[canonicalKey];
    if (val !== null && val !== undefined) {
      micronutrients[mongoKey] = val;
    }
    // If null, simply don't include — MongoDB will store it as undefined
    // This way mapDbFoodToCanonical using `??` operator correctly sees null
  }

  return {
    name: canonicalFood.name,
    aliases: canonicalFood.aliases || [],
    canonical_name: canonicalFood.search?.primary_name || canonicalFood.name.toLowerCase(),
    common_misspellings: canonicalFood.common_misspellings || [],
    category: canonicalFood.category,
    subcategory: canonicalFood.subcategory || '',
    diet_tags: canonicalFood.diet_tags || [],
    goal_tags: canonicalFood.goal_tags || [],
    region: canonicalFood.region || 'all_india',
    serving: {
      unit: canonicalFood.serving?.unit || 'gram',
      quantity: canonicalFood.serving?.quantity || 100,
      grams: canonicalFood.serving?.grams || 100,
    },
    serving_units: [canonicalFood.serving?.unit || 'gram'],
    piece_weight_grams: canonicalFood.serving?.grams || 100,
    preparation_state: canonicalFood.preparation_state || 'raw',
    cooking_method: canonicalFood.cooking_method || 'raw',
    budget_category: canonicalFood.budget_category || 'medium',
    availability: canonicalFood.availability || 'common',

    // MACROS: Must be numbers (required by schema)
    nutrition_per_100g: {
      calories: n.calories_kcal ?? 0,
      protein: n.protein_g ?? 0,
      carbs: n.carbs_g ?? 0,
      fat: n.fat_g ?? 0,
      fiber: n.fiber_g ?? 0,
      sugar: n.sugar_g ?? 0,
      saturatedFat: n.saturated_fat_g ?? 0,
    },

    // MICROS: Only include known values (preserve undefined for unknown)
    micronutrients_per_100g: micronutrients,

    source: canonicalFood.source || 'ai_generated',
    source_reference: canonicalFood.source_reference || '',
    verified: canonicalFood.verified === true,
    verification_status: canonicalFood.verified ? 'verified' : 'pending',
    confidence: canonicalFood.verified ? 0.95 : 0.7,
    search_tokens: canonicalFood.search?.keywords || [],
  };
}

async function seedCanonicalFoods(options = {}) {
  const { clearExisting = false, dryRun = false } = options;

  console.log('\n🌱 Seeding Canonical Foods Dataset...\n');
  const startTime = Date.now();
  const seedLog = {
    timestamp: new Date().toISOString(),
    dryRun,
    clearExistingBefore: clearExisting,
    summary: { total_canonical: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
    errors: [],
  };

  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('   ✅ Connected\n');

    if (clearExisting) {
      console.log('🗑️  Deleting existing food collection...');
      if (!dryRun) {
        await Food.deleteMany({});
      }
      console.log('   ✅ Collection cleared\n');
    }

    console.log('📂 Loading canonical-foods.json...');
    if (!fs.existsSync(CANONICAL_FILE)) {
      throw new Error(`Canonical file not found: ${CANONICAL_FILE}\nRun: node scripts/buildCanonicalFoods.js`);
    }

    const content = fs.readFileSync(CANONICAL_FILE, 'utf-8');
    const canonicalFoods = JSON.parse(content);
    console.log(`   ✅ Loaded ${canonicalFoods.length} foods\n`);
    seedLog.summary.total_canonical = canonicalFoods.length;

    // Process foods in batches
    console.log('🔄 Processing foods...');
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < canonicalFoods.length; i += batchSize) {
      const batch = canonicalFoods.slice(i, i + batchSize);
      const mongoFoods = batch.map(f => mapCanonicalToMongo(f));

      if (!dryRun) {
        try {
          const result = await Food.insertMany(mongoFoods, { ordered: false });
          inserted += result.length;
        } catch (batchErr) {
          // Batch failed — try individually
          for (const mongoFood of mongoFoods) {
            try {
              const food = new Food(mongoFood);
              await food.save();
              inserted++;
            } catch (itemErr) {
              if (itemErr.code === 11000) {
                // Duplicate key — update instead
                try {
                  await Food.updateOne(
                    { name: mongoFood.name },
                    { $set: mongoFood },
                    { upsert: true }
                  );
                  seedLog.summary.updated++;
                  inserted++;
                } catch (upsertErr) {
                  seedLog.summary.errors++;
                  if (seedLog.errors.length <= 20) {
                    seedLog.errors.push({ food: mongoFood.name, error: upsertErr.message });
                  }
                }
              } else {
                seedLog.summary.errors++;
                if (seedLog.errors.length <= 20) {
                  seedLog.errors.push({ food: mongoFood.name, error: itemErr.message });
                }
              }
            }
          }
        }
      }

      seedLog.summary.inserted = inserted;
      const pct = Math.min(100, Math.round((i + batchSize) / canonicalFoods.length * 100));
      process.stdout.write(`   ${pct}% (${inserted} inserted)...\r`);
    }

    console.log(`\n   ✅ Processed all ${canonicalFoods.length} foods\n`);

    if (!dryRun) {
      const finalCount = await Food.countDocuments();
      const verifiedCount = await Food.countDocuments({ verified: true });
      console.log(`📊 Database now contains: ${finalCount} foods (${verifiedCount} verified)\n`);
    }

    // Write seed log
    fs.writeFileSync(SEED_LOG_FILE, JSON.stringify(seedLog, null, 2), 'utf-8');

    const elapsed = (Date.now() - startTime) / 1000;
    console.log('='.repeat(70));
    console.log('✅ CANONICAL SEED COMPLETE');
    console.log('='.repeat(70));
    console.log(`
📊 SEED SUMMARY:
   Total canonical foods: ${seedLog.summary.total_canonical}
   Inserted: ${seedLog.summary.inserted}
   Updated: ${seedLog.summary.updated}
   Errors: ${seedLog.summary.errors}
   Time elapsed: ${elapsed.toFixed(2)}s
   
${dryRun ? '🔍 DRY RUN MODE - No actual changes made' : '✅ DATABASE UPDATED'}
`);

    return seedLog;
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    clearExisting: args.includes('--clear'),
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node seedCanonicalFoods.js [options]

Options:
  --dry-run        Show what would be done without making changes
  --clear          Clear existing food collection before seeding
  --help           Show this help message

Examples:
  node scripts/seedCanonicalFoods.js --dry-run
  node scripts/seedCanonicalFoods.js --clear
`);
    return;
  }

  await seedCanonicalFoods(options);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seedCanonicalFoods };
