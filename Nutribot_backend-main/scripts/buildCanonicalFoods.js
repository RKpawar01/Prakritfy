/**
 * Build Canonical Foods Dataset
 * 
 * Merges all food JSON files into one canonical dataset with:
 * - Unified schema
 * - Strict nutrient field standardization
 * - Intelligent deduplication
 * - Trust-based prioritization
 * - Validation and suspicious value detection
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const FOODS_DIR = path.join(__dirname, '../data/foods');
const OUTPUT_FILE = path.join(FOODS_DIR, 'canonical-foods.json');
const VALIDATION_REPORT_FILE = path.join(FOODS_DIR, 'canonical-foods-validation-report.json');
const DEDUP_LOG_FILE = path.join(FOODS_DIR, 'canonical-foods-dedup-log.json');

// Trust priority (higher = more trusted)
const TRUST_SCORE = {
  'verified_database': 100,
  'ifct': 95,
  'user_entered': 80,
  'ai_generated': 10,
};

// Fields that should NOT have default 0
const NON_ZERO_DEFAULTS = new Set([
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB6',
  'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'folate', 'calcium', 'iron', 'magnesium', 'potassium',
  'sodium', 'zinc'
]);

// Standard nutrient schema
const CANONICAL_SCHEMA = {
  id: '',
  name: '',
  aliases: [],
  category: '',
  subcategory: '',
  region: 'all_india',
  diet_tags: [],
  goal_tags: [],
  serving: {
    unit: 'gram',
    quantity: 100,
    grams: 100,
  },
  nutrition_per_100g: {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    saturated_fat_g: 0,
    vitamin_a_mcg: 0,
    vitamin_b1_mg: 0,
    vitamin_b2_mg: 0,
    vitamin_b3_mg: 0,
    vitamin_b6_mg: 0,
    vitamin_b12_mcg: 0,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0,
    vitamin_e_mg: 0,
    vitamin_k_mcg: 0,
    folate_mcg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    magnesium_mg: 0,
    potassium_mg: 0,
    sodium_mg: 0,
    zinc_mg: 0,
  },
  source: 'ai_generated',
  source_reference: '',
  verified: false,
  preparation_state: 'raw',
  cooking_method: 'raw',
  budget_category: 'medium',
  availability: 'common',
  search: {
    primary_name: '',
    keywords: [],
  },
  meta: {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize food name for deduplication matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .sort()
    .join(' ');
}

/**
 * Calculate trust score for a record
 */
function calculateTrustScore(record) {
  let score = TRUST_SCORE[record.source] || 0;
  
  if (record.verified) score += 20;
  if (record.source_reference) score += 5;
  if (record.verification_status === 'verified') score += 10;
  
  return Math.min(score, 100);
}

/**
 * Count how many nutrient fields have non-zero values
 */
function countNutrientFields(nutrition, micros) {
  let count = 0;
  if (nutrition) {
    Object.values(nutrition).forEach(v => {
      if (v && v !== 0) count++;
    });
  }
  if (micros) {
    Object.values(micros).forEach(v => {
      if (v && v !== 0) count++;
    });
  }
  return count;
}

/**
 * Map old schema field names to new canonical names
 */
function normalizeFoodRecord(record) {
  // Prepare nutrition data BEFORE creating canonical record
  const oldNutrition = record.nutrition_per_100g || {};
  const oldMicros = record.micronutrients_per_100g || {};
  
  // DEBUG: Log for first record
  if (record.name === 'Chicken Breast') {
    console.log('DEBUG normalizeFoodRecord for Chicken Breast:');
    console.log('  oldNutrition:', oldNutrition);
    console.log('  oldNutrition.calories:', oldNutrition.calories);
  }
  
  // Create nutrition object with actual values (not defaults)
  const nutritionData = {
    calories_kcal: oldNutrition.calories !== undefined ? oldNutrition.calories : 0,
    protein_g: oldNutrition.protein !== undefined ? oldNutrition.protein : 0,
    carbs_g: oldNutrition.carbs !== undefined ? oldNutrition.carbs : 0,
    fat_g: oldNutrition.fat !== undefined ? oldNutrition.fat : 0,
    fiber_g: oldNutrition.fiber !== undefined ? oldNutrition.fiber : 0,
    sugar_g: oldNutrition.sugar !== undefined ? oldNutrition.sugar : 0,
    saturated_fat_g: oldNutrition.saturatedFat !== undefined ? oldNutrition.saturatedFat : 0,
    vitamin_a_mcg: oldMicros.vitaminA !== undefined ? oldMicros.vitaminA : 0,
    vitamin_b1_mg: oldMicros.vitaminB1 !== undefined ? oldMicros.vitaminB1 : 0,
    vitamin_b2_mg: oldMicros.vitaminB2 !== undefined ? oldMicros.vitaminB2 : 0,
    vitamin_b3_mg: oldMicros.vitaminB3 !== undefined ? oldMicros.vitaminB3 : 0,
    vitamin_b6_mg: oldMicros.vitaminB6 !== undefined ? oldMicros.vitaminB6 : 0,
    vitamin_b12_mcg: oldMicros.vitaminB12 !== undefined ? oldMicros.vitaminB12 : 0,
    vitamin_c_mg: oldMicros.vitaminC !== undefined ? oldMicros.vitaminC : 0,
    vitamin_d_mcg: oldMicros.vitaminD !== undefined ? oldMicros.vitaminD : 0,
    vitamin_e_mg: oldMicros.vitaminE !== undefined ? oldMicros.vitaminE : 0,
    vitamin_k_mcg: oldMicros.vitaminK !== undefined ? oldMicros.vitaminK : 0,
    folate_mcg: oldMicros.folate !== undefined ? oldMicros.folate : 0,
    calcium_mg: oldMicros.calcium !== undefined ? oldMicros.calcium : 0,
    iron_mg: oldMicros.iron !== undefined ? oldMicros.iron : 0,
    magnesium_mg: oldMicros.magnesium !== undefined ? oldMicros.magnesium : 0,
    potassium_mg: oldMicros.potassium !== undefined ? oldMicros.potassium : 0,
    sodium_mg: oldMicros.sodium !== undefined ? oldMicros.sodium : 0,
    zinc_mg: oldMicros.zinc !== undefined ? oldMicros.zinc : 0,
  };
  
  // Create canonical record
  const canonical = JSON.parse(JSON.stringify(CANONICAL_SCHEMA));
  
  // OVERRIDE nutrition_per_100g with actual values
  canonical.nutrition_per_100g = nutritionData;
  
  // DEBUG
  if (record.name === 'Chicken Breast') {
    console.log('  nutritionData.calories_kcal:', nutritionData.calories_kcal);
    console.log('  canonical.nutrition_per_100g.calories_kcal after assign:', canonical.nutrition_per_100g.calories_kcal);
  }
  
  canonical.id = record.id || generateId(record.name);
  canonical.name = record.name || '';
  canonical.aliases = record.aliases || [];
  canonical.category = record.category || 'snacks';
  canonical.subcategory = record.subcategory || '';
  canonical.region = record.region || 'all_india';
  canonical.diet_tags = record.diet_tags || [];
  canonical.goal_tags = record.goal_tags || [];
  canonical.verified = record.verified === true;
  canonical.source = record.source || 'ai_generated';
  canonical.source_reference = record.source_reference || record.source_url || '';
  canonical.preparation_state = record.preparation_state || 'raw';
  canonical.cooking_method = record.cooking_method || 'raw';
  canonical.budget_category = record.budget_category || 'medium';
  canonical.availability = record.availability || 'common';
  
  // Serving info
  if (record.serving) {
    canonical.serving = {
      unit: record.serving.unit || 'gram',
      quantity: record.serving.quantity || 100,
      grams: record.serving.grams || 100,
    };
  }
  if (record.piece_weight_grams) {
    canonical.serving.grams = record.piece_weight_grams;
  }
  
  // Search metadata
  canonical.search.primary_name = record.canonical_name || normalizeName(canonical.name);
  canonical.search.keywords = record.search_tokens || buildKeywords(canonical.name, canonical.aliases);
  
  return canonical;
}

/**
 * Generate unique ID for a food
 */
function generateId(foodName) {
  return 'food_' + normalizeName(foodName).replace(/\s+/g, '_') + '_' + Date.now();
}

/**
 * Build search keywords from name and aliases
 */
function buildKeywords(name, aliases = []) {
  const words = new Set();
  
  const addWords = (str) => {
    if (!str) return;
    str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .forEach(w => {
        if (w && w.length > 1) words.add(w);
      });
  };
  
  addWords(name);
  aliases.forEach(a => addWords(a));
  
  return Array.from(words).slice(0, 10);
}

/**
 * Check if two foods might be duplicates
 */
function areDuplicates(food1, food2) {
  const norm1 = normalizeName(food1.name);
  const norm2 = normalizeName(food2.name);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one is an alias of the other
  const aliases1 = food1.aliases.map(a => normalizeName(a));
  const aliases2 = food2.aliases.map(a => normalizeName(a));
  
  if (aliases1.includes(norm2) || aliases2.includes(norm1)) return true;
  
  // Check for common meat/egg aliases
  const commonAliases = {
    'egg': ['anda', 'eggs', 'boiled egg', 'boiled anda', 'fried egg'],
    'mutton': ['lamb', 'goat meat', 'goat'],
    'chicken': ['poultry', 'murg', 'murga'],
  };
  
  for (const [key, alts] of Object.entries(commonAliases)) {
    const isFood1 = norm1.includes(key) || aliases1.some(a => a.includes(key));
    const isFood2 = norm2.includes(key) || aliases2.some(a => a.includes(key));
    
    if (isFood1 && isFood2) return true;
  }
  
  return false;
}

/**
 * Merge two similar foods, preferring the more trustworthy/complete
 */
function mergeFoods(food1, food2) {
  const score1 = calculateTrustScore(food1);
  const score2 = calculateTrustScore(food2);
  
  const nutrientCount1 = countNutrientFields(food1.nutrition_per_100g, food1.micronutrients_per_100g);
  const nutrientCount2 = countNutrientFields(food2.nutrition_per_100g, food2.micronutrients_per_100g);
  
  // Use food1 as base if better trust score, otherwise use food2
  let base = score1 >= score2 ? food1 : food2;
  let donor = score1 >= score2 ? food2 : food1;
  
  // If trust is equal, prefer the one with more complete nutrient data
  if (score1 === score2 && nutrientCount2 > nutrientCount1) {
    base = food2;
    donor = food1;
  }
  
  // Normalize to canonical
  const canonical = normalizeFoodRecord(base);
  
  // Merge aliases from both
  const allAliases = new Set([
    ...canonical.aliases,
    ...(donor.aliases || []),
  ]);
  canonical.aliases = Array.from(allAliases).filter(a => a);
  
  // Merge all diet/goal tags
  canonical.diet_tags = [...new Set([...canonical.diet_tags, ...(donor.diet_tags || [])])];
  canonical.goal_tags = [...new Set([...canonical.goal_tags, ...(donor.goal_tags || [])])];
  
  // Use donor's nutrients if they're better
  const donorCanonical = normalizeFoodRecord(donor);
  const donorCount = countNutrientFields(donor.nutrition_per_100g, donor.micronutrients_per_100g);
  const baseCount = countNutrientFields(base.nutrition_per_100g, base.micronutrients_per_100g);
  
  if (donorCount > baseCount) {
    canonical.nutrition_per_100g = donorCanonical.nutrition_per_100g;
  }
  
  return canonical;
}

/**
 * Validate a food record for suspicious values
 */
function validateFood(food) {
  const issues = [];
  const nuts = food.nutrition_per_100g;
  
  // Check for impossible macros
  if (nuts.calories_kcal > 900 || nuts.calories_kcal < 0) {
    issues.push(`Calories out of range: ${nuts.calories_kcal} kcal`);
  }
  
  // Sanity check: protein/fat/carb shouldn't be negative
  if (nuts.protein_g < 0 || nuts.fat_g < 0 || nuts.carbs_g < 0) {
    issues.push(`Negative macros: protein=${nuts.protein_g}, fat=${nuts.fat_g}, carbs=${nuts.carbs_g}`);
  }
  
  // Check for suspicious carb values in pure meat foods
  const isMeat = ['meat', 'chicken', 'beef', 'fish', 'lamb', 'mutton', 'egg'].some(
    keyword => food.name.toLowerCase().includes(keyword) && !food.name.toLowerCase().includes('curry')
  );
  
  if (isMeat && nuts.carbs_g > 5 && !['curry', 'breaded', 'coated'].some(k => food.name.toLowerCase().includes(k))) {
    issues.push(`Suspicious carbs for meat food: ${nuts.carbs_g}g (expected ~0)`);
  }
  
  // Check for all minerals = 0 when macros are present (data completeness)
  const allMineralsZero = [
    'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg'
  ].every(f => nuts[f] === 0 || nuts[f] === undefined);
  
  const allVitaminsZero = [
    'vitamin_a_mcg', 'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b6_mg',
    'vitamin_b12_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_e_mg', 'vitamin_k_mcg', 'folate_mcg'
  ].every(f => nuts[f] === 0 || nuts[f] === undefined);
  
  if ((allMineralsZero || allVitaminsZero) && (nuts.protein_g > 0 || nuts.fat_g > 0 || nuts.carbs_g > 0)) {
    if (allMineralsZero) issues.push(`All minerals are zero but macros are present`);
    if (allVitaminsZero) issues.push(`All vitamins are zero but macros are present`);
  }
  
  // Check for suspicious macros that don't add up
  const macroCalories = (nuts.protein_g * 4) + (nuts.carbs_g * 4) + (nuts.fat_g * 9);
  const caloriesDiff = Math.abs(macroCalories - nuts.calories_kcal);
  if (macroCalories > 0 && caloriesDiff > macroCalories * 0.2) {
    issues.push(`Macros don't match declared calories: calculated=${macroCalories.toFixed(1)}, declared=${nuts.calories_kcal}`);
  }
  
  return issues;
}

// ============================================================================
// MAIN BUILD PROCESS
// ============================================================================

async function buildCanonical() {
  console.log('\n🔄 Building Canonical Foods Dataset...\n');
  
  const startTime = Date.now();
  
  // Load all food JSON files
  console.log('📂 Loading food JSON files...');
  const allRawFoods = [];
  const fileStats = [];
  
  try {
    const files = fs.readdirSync(FOODS_DIR)
      .filter(f => f === 'foods-all.json')
      .sort();
    
    console.log(`   Found ${files.length} food JSON files\n`);
    
    for (const file of files) {
      try {
        const filePath = path.join(FOODS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const foods = JSON.parse(content);
        
        if (!Array.isArray(foods)) {
          console.log(`   ⚠️  ${file} is not an array, skipping`);
          continue;
        }
        
        allRawFoods.push(...foods.map(f => ({ ...f, _source_file: file })));
        fileStats.push({ file, count: foods.length });
        console.log(`   ✅ ${file}: ${foods.length} foods`);
      } catch (err) {
        console.log(`   ❌ Error reading ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error reading foods directory:', err.message);
    process.exit(1);
  }
  
  console.log(`\n   Total raw foods loaded: ${allRawFoods.length}\n`);
  
  // Normalize all records to canonical schema
  console.log('🔄 Normalizing schemas...');
  const canonical = allRawFoods.map(f => normalizeFoodRecord(f));
  console.log(`   ✅ Normalized ${canonical.length} records\n`);
  
  // Deduplication
  console.log('🔍 Detecting duplicates...');
  const dedupLog = [];
  const foodsByNormName = {};
  const duplicateGroups = [];
  
  for (let i = 0; i < canonical.length; i++) {
    const food = canonical[i];
    const normName = normalizeName(food.name);
    
    if (!foodsByNormName[normName]) {
      foodsByNormName[normName] = [];
    }
    foodsByNormName[normName].push(i);
  }
  
  // Find and merge duplicates
  const merged = {};
  const mergedRecords = [];
  
  for (const [normName, indices] of Object.entries(foodsByNormName)) {
    if (indices.length === 1) {
      // No duplicate
      merged[indices[0]] = canonical[indices[0]];
      continue;
    }
    
    // Found duplicates
    const group = indices.map(i => canonical[i]);
    duplicateGroups.push({
      normalized_name: normName,
      count: group.length,
      records: group.map(g => ({name: g.name, source: g.source, verified: g.verified}))
    });
    
    // Merge them
    let merged_food = group[0];
    for (let i = 1; i < group.length; i++) {
      merged_food = mergeFoods(merged_food, group[i]);
    }
    
    mergedRecords.push(merged_food);
    
    // Mark originals as merged (keep first)
    merged[indices[0]] = merged_food;
    for (let i = 1; i < indices.length; i++) {
      merged[indices[i]] = null; // Mark for deletion
    }
    
    dedupLog.push({
      normalized_name: normName,
      original_count: indices.length,
      merged_into: merged_food.name,
      action: 'merged'
    });
  }
  
  const finalCanonical = Object.values(merged).filter(f => f !== null);
  const duplicatesMerged = allRawFoods.length - finalCanonical.length;
  
  console.log(`   Found ${duplicateGroups.length} duplicate groups`);
  console.log(`   Merged ${duplicatesMerged} duplicate records\n`);
  
  // Validate all foods
  console.log('✔️  Validating records...');
  const validation = [];
  let suspiciousCount = 0;
  
  for (const food of finalCanonical) {
    const issues = validateFood(food);
    if (issues.length > 0) {
      suspiciousCount++;
      validation.push({
        name: food.name,
        source: food.source,
        verified: food.verified,
        issues,
      });
    }
  }
  
  console.log(`   ✅ Validated ${finalCanonical.length} records`);
  console.log(`   ⚠️  Found ${suspiciousCount} records with potential issues\n`);
  
  // Write canonical dataset
  console.log('💾 Writing canonical-foods.json...');
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(finalCanonical, null, 2),
    'utf-8'
  );
  console.log(`   ✅ Written ${finalCanonical.length} foods to ${OUTPUT_FILE}\n`);
  
  // Write validation report
  console.log('📋 Writing validation report...');
  fs.writeFileSync(
    VALIDATION_REPORT_FILE,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total_raw_foods: allRawFoods.length,
        total_canonical_foods: finalCanonical.length,
        duplicates_merged: duplicatesMerged,
        suspicious_records: suspiciousCount,
      },
      files_processed: fileStats,
      duplicate_groups: duplicateGroups,
      suspicious_foods: validation.slice(0, 100), // First 100
    }, null, 2),
    'utf-8'
  );
  console.log(`   ✅ Written to ${VALIDATION_REPORT_FILE}\n`);
  
  // Write dedup log
  fs.writeFileSync(
    DEDUP_LOG_FILE,
    JSON.stringify(dedupLog, null, 2),
    'utf-8'
  );
  
  // Print summary
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('=' .repeat(70));
  console.log('✅ CANONICAL DATASET BUILD COMPLETE');
  console.log('=' .repeat(70));
  console.log(`
📊 BUILD SUMMARY:
   Input files: ${fileStats.length}
   Raw foods: ${allRawFoods.length}
   After deduplication: ${finalCanonical.length}
   Duplicates merged: ${duplicatesMerged}
   Suspicious records: ${suspiciousCount}
   Time elapsed: ${elapsed.toFixed(2)}s

📁 OUTPUT FILES:
   ✅ ${OUTPUT_FILE}
   ✅ ${VALIDATION_REPORT_FILE}
   ✅ ${DEDUP_LOG_FILE}

🚀 NEXT STEPS:
   1. Review suspicious foods in validation report
   2. Run: node scripts/seedCanonicalFoods.js
   3. Verify food API responses
`);
  
  return {
    success: true,
    totalFoods: finalCanonical.length,
    duplicatesMerged,
    suspiciousRecords: suspiciousCount,
    outputFile: OUTPUT_FILE,
  };
}

// Run if executed directly
if (require.main === module) {
  buildCanonical().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
}

module.exports = { buildCanonical, normalizeFoodRecord };
