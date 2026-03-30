/**
 * COMPREHENSIVE NUTRITION DATA AUDIT SCRIPT
 * 
 * Validates:
 * 1. All food items in canonical-foods.json against USDA reference values
 * 2. Schema completeness (no missing required fields)
 * 3. Calorie formula accuracy (P*4 + C*4 + F*9 ≈ listed calories)
 * 4. Range checks for all nutrients
 * 5. Single-item calculation accuracy
 * 6. Multi-item aggregation accuracy
 * 7. Scaling correctness
 */

const fs = require('fs');
const path = require('path');
const {
  parseFoodInput,
  convertToGrams,
  scalePer100ToWeight,
  validatePer100Nutrition,
} = require('../src/utils/nutritionEngine');
const {
  createCanonicalNutrient,
  scaleNutrientsByWeight,
  aggregateNutrients,
  recalculateCalories,
  formatNutrientForDisplay,
} = require('../src/utils/nutrientTransformer');

// ============================================================================
// USDA REFERENCE VALUES (per 100g) - Cross-checked authoritative sources
// ============================================================================
const USDA_REFERENCE = {
  // POULTRY
  "Chicken Breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
  "Chicken Thigh": { calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, sugar: 0 },
  
  // EGGS
  "Egg (Boiled)": { calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, sugar: 1.1 },
  
  // GRAINS
  "Rice (White, Boiled)": { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugar: 0 },
  
  // DAIRY
  "Milk (Cow, Whole)": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5.0 },
  "Yogurt (Plain)": { calories: 59, protein: 3.5, carbs: 4.7, fat: 1.8, fiber: 0, sugar: 4.7 },
  
  // VEGETABLES
  "Spinach (Boiled)": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.3, fiber: 2.4, sugar: 0.4 },
  "Broccoli (Boiled)": { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, sugar: 1.4 },
  
  // FRUITS
  "Apple (Fresh)": { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4 },
  "Banana (Fresh)": { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2 },
  
  // LEGUMES
  "Lentils (Red, Boiled)": { calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9, sugar: 1.8 },
  
  // FISH
  "Fish (Salmon)": { calories: 208, protein: 20.4, carbs: 0, fat: 13.4, fiber: 0, sugar: 0 },
  
  // NUTS
  "Almonds": { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4 },
  "Peanuts": { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, sugar: 4.7 },
};

// Micronutrient reference for key foods
const MICRO_REFERENCE = {
  "Egg (Boiled)": { calcium: 56, iron: 1.8, vitaminD: 2.2, vitaminB12: 0.89, vitaminC: 0, zinc: 1.3 },
  "Milk (Cow, Whole)": { calcium: 113, iron: 0.03, vitaminD: 1.3, vitaminB12: 0.45, vitaminC: 0, zinc: 0.37 },
  "Spinach (Boiled)": { calcium: 136, iron: 3.6, vitaminD: 0, vitaminB12: 0, vitaminC: 9.8, zinc: 0.8 },
  "Chicken Breast": { calcium: 15, iron: 1.0, vitaminD: 0, vitaminB12: 0.3, vitaminC: 0, zinc: 1.0 },
  "Apple (Fresh)": { calcium: 6, iron: 0.12, vitaminD: 0, vitaminB12: 0, vitaminC: 4.6, zinc: 0.04 },
  "Lentils (Red, Boiled)": { calcium: 19, iron: 3.3, vitaminD: 0, vitaminB12: 0, vitaminC: 1.5, zinc: 1.3 },
};

// ============================================================================
// LOAD DATA
// ============================================================================
const FOODS_PATH = path.join(__dirname, '..', 'data', 'foods', 'canonical-foods.json');
let allFoods;
try {
  const rawData = fs.readFileSync(FOODS_PATH, 'utf-8');
  allFoods = JSON.parse(rawData);
} catch (err) {
  console.error('❌ FATAL: Cannot load canonical-foods.json:', err.message);
  process.exit(1);
}

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

const results = {
  totalFoods: 0,
  passed: 0,
  warnings: 0,
  errors: 0,
  details: [],
};

function addResult(level, food, message, data = {}) {
  if (level === 'error') results.errors++;
  else if (level === 'warning') results.warnings++;
  else results.passed++;
  results.details.push({ level, food, message, ...data });
}

// AUDIT 1: Schema completeness
function auditSchema() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 1: SCHEMA COMPLETENESS');
  console.log('='.repeat(80));
  
  const requiredMacroFields = [
    'calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'saturated_fat_g'
  ];
  const requiredMicroFields = [
    'vitamin_a_mcg', 'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b6_mg',
    'vitamin_b12_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_e_mg', 'vitamin_k_mcg',
    'folate_mcg', 'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg'
  ];
  
  let incompleteCount = 0;
  let missingMacro = 0;
  let missingMicro = 0;
  
  for (const food of allFoods) {
    const n = food.nutrition_per_100g || {};
    
    // Check required macro fields
    for (const field of requiredMacroFields) {
      if (n[field] === undefined || n[field] === null) {
        missingMacro++;
        addResult('error', food.name, `Missing macro field: ${field}`);
        incompleteCount++;
      }
    }
    
    // Check required micro fields
    for (const field of requiredMicroFields) {
      if (n[field] === undefined || n[field] === null) {
        missingMicro++;
        if (missingMicro <= 20) { // limit output
          addResult('warning', food.name, `Missing micro field: ${field}`);
        }
        incompleteCount++;
      }
    }
    
    // Check food has an ID
    if (!food.id) {
      addResult('error', food.name || 'UNKNOWN', 'Missing food ID');
    }
    
    // Check food has a name
    if (!food.name) {
      addResult('error', food.id || 'UNKNOWN', 'Missing food name');
    }
  }
  
  console.log(`  Total foods: ${allFoods.length}`);
  console.log(`  Foods with incomplete macros: ${missingMacro}`);
  console.log(`  Foods with incomplete micros: ${missingMicro > 20 ? missingMicro + ' (showing first 20)' : missingMicro}`);
  console.log(`  Schema completeness: ${((1 - incompleteCount / (allFoods.length * (requiredMacroFields.length + requiredMicroFields.length))) * 100).toFixed(1)}%`);
}

// AUDIT 2: Calorie formula validation
function auditCalorieFormula() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 2: CALORIE FORMULA ACCURACY (P*4 + C*4 + F*9 = Calories)');
  console.log('='.repeat(80));
  
  let matchCount = 0;
  let mismatchCount = 0;
  const mismatches = [];
  
  for (const food of allFoods) {
    const n = food.nutrition_per_100g;
    if (!n) continue;
    
    const listed = n.calories_kcal;
    const protein = n.protein_g || 0;
    const carbs = n.carbs_g || 0;
    const fat = n.fat_g || 0;
    const calculated = Math.round(protein * 4 + carbs * 4 + fat * 9);
    
    const diff = Math.abs(listed - calculated);
    const percentDiff = listed > 0 ? (diff / listed) * 100 : 0;
    
    // Allow 15% tolerance (fiber, alcohol, rounding) 
    if (percentDiff > 15) {
      mismatchCount++;
      mismatches.push({
        name: food.name,
        listed,
        calculated,
        diff: diff.toFixed(1),
        percentDiff: percentDiff.toFixed(1),
        protein, carbs, fat
      });
      addResult('warning', food.name, 
        `Calorie mismatch: listed=${listed}, calculated=${calculated} (diff=${percentDiff.toFixed(1)}%)`);
    } else {
      matchCount++;
    }
  }
  
  console.log(`  Foods with matching calories: ${matchCount}/${allFoods.length} (${(matchCount/allFoods.length*100).toFixed(1)}%)`);
  console.log(`  Foods with mismatched calories (>15% off): ${mismatchCount}`);
  
  if (mismatches.length > 0) {
    console.log('\n  Top calorie mismatches:');
    mismatches.sort((a, b) => parseFloat(b.percentDiff) - parseFloat(a.percentDiff));
    mismatches.slice(0, 20).forEach(m => {
      console.log(`    ❌ ${m.name}: listed=${m.listed}kcal, calc=${m.calculated}kcal (${m.percentDiff}% off) [P=${m.protein}g C=${m.carbs}g F=${m.fat}g]`);
    });
  }
}

// AUDIT 3: Range validation
function auditNutrientRanges() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 3: NUTRIENT RANGE VALIDATION');
  console.log('='.repeat(80));
  
  const ranges = {
    calories_kcal: { min: 0, max: 900, label: 'Calories' },
    protein_g: { min: 0, max: 90, label: 'Protein' },
    carbs_g: { min: 0, max: 100, label: 'Carbs' },
    fat_g: { min: 0, max: 100, label: 'Fat' },
    fiber_g: { min: 0, max: 80, label: 'Fiber' },
    sugar_g: { min: 0, max: 100, label: 'Sugar' },
    saturated_fat_g: { min: 0, max: 60, label: 'Saturated Fat' },
    calcium_mg: { min: 0, max: 2000, label: 'Calcium' },
    iron_mg: { min: 0, max: 50, label: 'Iron' },
    magnesium_mg: { min: 0, max: 600, label: 'Magnesium' },
    potassium_mg: { min: 0, max: 2000, label: 'Potassium' },
    sodium_mg: { min: 0, max: 5000, label: 'Sodium' },
    zinc_mg: { min: 0, max: 20, label: 'Zinc' },
    vitamin_a_mcg: { min: 0, max: 10000, label: 'Vitamin A' },
    vitamin_c_mg: { min: 0, max: 2500, label: 'Vitamin C' },
    vitamin_d_mcg: { min: 0, max: 60, label: 'Vitamin D' },
    vitamin_b12_mcg: { min: 0, max: 100, label: 'Vitamin B12' },
  };
  
  let outOfRange = 0;
  
  for (const food of allFoods) {
    const n = food.nutrition_per_100g;
    if (!n) continue;
    
    for (const [field, range] of Object.entries(ranges)) {
      const val = n[field];
      if (val !== undefined && val !== null && (val < range.min || val > range.max)) {
        outOfRange++;
        addResult('error', food.name, 
          `${range.label} out of range: ${val} (expected ${range.min}-${range.max})`);
      }
    }
  }
  
  console.log(`  Out-of-range values found: ${outOfRange}`);
  if (outOfRange === 0) console.log('  ✅ All nutrients within valid ranges');
}

// AUDIT 4: USDA Cross-reference accuracy
function auditUSDAAccuracy() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 4: USDA REFERENCE CROSS-CHECK');
  console.log('='.repeat(80));
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const failures = [];
  
  for (const [refName, refValues] of Object.entries(USDA_REFERENCE)) {
    const food = allFoods.find(f => f.name === refName);
    if (!food) {
      console.log(`  ⚠️  Reference food not found in database: "${refName}"`);
      continue;
    }
    
    const n = food.nutrition_per_100g;
    const macroFields = {
      calories_kcal: { ref: refValues.calories, tolerance: 12 },  // ±12%
      protein_g: { ref: refValues.protein, tolerance: 15 },       // ±15%
      carbs_g: { ref: refValues.carbs, tolerance: 15 },
      fat_g: { ref: refValues.fat, tolerance: 20 },               // Fat has higher variance
      fiber_g: { ref: refValues.fiber, tolerance: 40 },            // Fiber often varies
      sugar_g: { ref: refValues.sugar, tolerance: 40 },
    };
    
    let foodPassed = 0;
    let foodFailed = 0;
    
    for (const [field, check] of Object.entries(macroFields)) {
      totalChecks++;
      const dbValue = n[field];
      const diff = Math.abs(dbValue - check.ref);
      const percentDiff = check.ref > 0 ? (diff / check.ref) * 100 : (dbValue === 0 ? 0 : 100);
      
      if (percentDiff <= check.tolerance) {
        passedChecks++;
        foodPassed++;
      } else {
        failedChecks++;
        foodFailed++;
        failures.push({
          food: refName,
          field,
          dbValue,
          usdaValue: check.ref,
          percentDiff: percentDiff.toFixed(1),
        });
      }
    }
    
    const status = foodFailed === 0 ? '✅' : foodFailed <= 1 ? '⚠️' : '❌';
    console.log(`  ${status} ${refName}: ${foodPassed}/${foodPassed + foodFailed} macros match USDA`);
  }
  
  console.log(`\n  MACRO ACCURACY: ${passedChecks}/${totalChecks} checks passed (${(passedChecks/totalChecks*100).toFixed(1)}%)`);
  
  if (failures.length > 0) {
    console.log('\n  Failed checks:');
    failures.forEach(f => {
      console.log(`    ❌ ${f.food} → ${f.field}: DB=${f.dbValue}, USDA=${f.usdaValue} (${f.percentDiff}% off)`);
    });
  }
  
  // Micro checks
  console.log('\n  MICRONUTRIENT SPOT-CHECK:');
  let microPassed = 0;
  let microTotal = 0;
  
  for (const [refName, refMicro] of Object.entries(MICRO_REFERENCE)) {
    const food = allFoods.find(f => f.name === refName);
    if (!food) continue;
    
    const n = food.nutrition_per_100g;
    const microMap = {
      calcium_mg: refMicro.calcium,
      iron_mg: refMicro.iron,
      vitamin_d_mcg: refMicro.vitaminD,
      vitamin_b12_mcg: refMicro.vitaminB12,
      vitamin_c_mg: refMicro.vitaminC,
      zinc_mg: refMicro.zinc,
    };
    
    for (const [field, refVal] of Object.entries(microMap)) {
      microTotal++;
      const dbVal = n[field];
      if (dbVal === undefined || dbVal === null) {
        console.log(`    ⚠️  ${refName} → ${field}: MISSING in DB (USDA=${refVal})`);
        continue;
      }
      const diff = Math.abs(dbVal - refVal);
      const pDiff = refVal > 0 ? (diff / refVal) * 100 : (dbVal === 0 ? 0 : 100);
      
      if (pDiff <= 50) {  // Higher tolerance for micros
        microPassed++;
      } else {
        console.log(`    ❌ ${refName} → ${field}: DB=${dbVal}, USDA=${refVal} (${pDiff.toFixed(1)}% off)`);
      }
    }
  }
  
  console.log(`  MICRO ACCURACY: ${microPassed}/${microTotal} checks passed (${(microPassed/microTotal*100).toFixed(1)}%)`);
}

// AUDIT 5: Duplicate detection
function auditDuplicates() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 5: DUPLICATE DETECTION');
  console.log('='.repeat(80));
  
  const nameMap = {};
  const idMap = {};
  let nameDupes = 0;
  let idDupes = 0;
  
  for (const food of allFoods) {
    const normName = (food.name || '').toLowerCase().trim();
    if (nameMap[normName]) {
      nameDupes++;
      if (nameDupes <= 10) {
        console.log(`  ⚠️  Duplicate name: "${food.name}" (IDs: ${nameMap[normName]}, ${food.id})`);
      }
    }
    nameMap[normName] = food.id;
    
    if (food.id && idMap[food.id]) {
      idDupes++;
      console.log(`  ❌ Duplicate ID: "${food.id}"`);
    }
    idMap[food.id] = true;
  }
  
  console.log(`  Name duplicates: ${nameDupes}${nameDupes > 10 ? ' (showing first 10)' : ''}`);
  console.log(`  ID duplicates: ${idDupes}`);
  if (nameDupes === 0 && idDupes === 0) console.log('  ✅ No duplicates found');
}

// AUDIT 6: Suspicious placeholder data detection
function auditPlaceholderData() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 6: SUSPICIOUS/PLACEHOLDER DATA DETECTION');
  console.log('='.repeat(80));
  
  let suspiciousCount = 0;
  let allZeroMicros = 0;
  let reapeatedValues = 0;
  
  for (const food of allFoods) {
    const n = food.nutrition_per_100g;
    if (!n) continue;
    
    // Check if all macros are zero
    if (n.protein_g === 0 && n.carbs_g === 0 && n.fat_g === 0 && n.calories_kcal === 0) {
      suspiciousCount++;
      if (suspiciousCount <= 5) {
        console.log(`  ❌ All zeros: "${food.name}" — likely placeholder data`);
      }
    }
    
    // Check for all-zero micronutrients
    const microFields = ['calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'zinc_mg',
      'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg'];
    const microValues = microFields.map(f => n[f]).filter(v => v !== undefined && v !== null);
    if (microValues.length > 0 && microValues.every(v => v === 0)) {
      allZeroMicros++;
    }
    
    // Check for suspiciously repeated round values (e.g., all 10.0)
    const macroValues = [n.protein_g, n.carbs_g, n.fat_g].filter(v => v > 0);
    if (macroValues.length === 3 && macroValues.every(v => v === macroValues[0]) && macroValues[0] > 5) {
      reapeatedValues++;
      console.log(`  ⚠️  Repeated macro values (${macroValues[0]}): "${food.name}" — may be placeholder`);
    }
  }
  
  console.log(`  All-zero macro foods: ${suspiciousCount}`);
  console.log(`  All-zero micro foods: ${allZeroMicros}`);
  console.log(`  Repeated-value suspicious: ${reapeatedValues}`);
  
  if (suspiciousCount === 0 && allZeroMicros < 5) {
    console.log('  ✅ No significant placeholder data detected');
  }
}

// AUDIT 7: Single-item calculation test
function auditSingleItemCalc() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 7: SINGLE-ITEM CALCULATION ACCURACY');
  console.log('='.repeat(80));
  
  const testCases = [
    {
      input: "100g chicken breast",
      expected: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      matchName: "Chicken Breast"
    },
    {
      input: "2 eggs",
      expected: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      matchName: "Egg (Boiled)",
      note: "per 100g basis; 2 eggs = 100g"
    },
    {
      input: "200g rice",
      expected: { calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
      matchName: "Rice (White, Boiled)"
    },
    {
      input: "1 apple",
      expected: { calories: 93.6, protein: 0.54, carbs: 25.2, fat: 0.36 },
      matchName: "Apple (Fresh)",
      note: "1 apple = 180g"
    },
    {
      input: "250ml milk",
      expected: { calories: 152.5, protein: 8.0, carbs: 12.0, fat: 8.25 },
      matchName: "Milk (Cow, Whole)"
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const tc of testCases) {
    const food = allFoods.find(f => f.name === tc.matchName);
    if (!food) {
      console.log(`  ⚠️  Food not found for test: ${tc.matchName}`);
      failed++;
      continue;
    }
    
    const n = food.nutrition_per_100g;
    const per100Canonical = createCanonicalNutrient({
      calories_kcal: n.calories_kcal,
      protein_g: n.protein_g,
      carbs_g: n.carbs_g,
      fat_g: n.fat_g,
      fiber_g: n.fiber_g,
      sugar_g: n.sugar_g,
    });
    
    // Parse quantity
    const parsed = parseFoodInput(tc.input);
    if (!parsed || parsed.length === 0) {
      console.log(`  ❌ Parse failed: "${tc.input}"`);
      failed++;
      continue;
    }
    
    const item = parsed[0];
    let weightGrams;
    try {
      weightGrams = convertToGrams(item.quantity, item.unit, item.food_name);
    } catch (e) {
      // Default for items without piece conversion
      weightGrams = item.quantity;
    }
    
    const scaled = scaleNutrientsByWeight(per100Canonical, weightGrams);
    
    // Check accuracy
    const checks = [
      { field: 'calories_kcal', expected: tc.expected.calories },
      { field: 'protein_g', expected: tc.expected.protein },
      { field: 'carbs_g', expected: tc.expected.carbs },
      { field: 'fat_g', expected: tc.expected.fat },
    ];
    
    let itemPassed = true;
    for (const check of checks) {
      const actual = scaled[check.field];
      const diff = Math.abs(actual - check.expected);
      const pDiff = check.expected > 0 ? (diff / check.expected) * 100 : (actual === 0 ? 0 : 100);
      
      if (pDiff > 10) {
        itemPassed = false;
        console.log(`    ❌ ${tc.input} → ${check.field}: actual=${actual}, expected=${check.expected} (${pDiff.toFixed(1)}% off)`);
      }
    }
    
    if (itemPassed) {
      passed++;
      console.log(`  ✅ PASS: "${tc.input}" → ${weightGrams}g → cal=${scaled.calories_kcal}, pro=${scaled.protein_g}, carb=${scaled.carbs_g}, fat=${scaled.fat_g}`);
    } else {
      failed++;
    }
  }
  
  console.log(`\n  Single-item accuracy: ${passed}/${passed + failed} (${(passed/(passed+failed)*100).toFixed(1)}%)`);
}

// AUDIT 8: Multi-item aggregation test (THE KEY TEST)
function auditMultiItemCalc() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 8: MULTI-ITEM AGGREGATION ACCURACY');
  console.log('='.repeat(80));
  
  // Test: "2 eggs, 100g rice, 200g chicken"
  // Expected: Sum of each item's scaled nutrients
  
  const mealItems = [
    { name: "Egg (Boiled)", grams: 100 },        // 2 eggs = 100g
    { name: "Rice (White, Boiled)", grams: 100 }, // 100g rice
    { name: "Chicken Breast", grams: 200 },       // 200g chicken
  ];
  
  console.log('  Test Meal: "2 eggs + 100g rice + 200g chicken breast"');
  console.log('');
  
  const scaledNutrients = [];
  const itemDetails = [];
  
  for (const item of mealItems) {
    const food = allFoods.find(f => f.name === item.name);
    if (!food) {
      console.log(`  ❌ Food not found: ${item.name}`);
      return;
    }
    
    const n = food.nutrition_per_100g;
    const per100 = createCanonicalNutrient({
      calories_kcal: n.calories_kcal,
      protein_g: n.protein_g,
      carbs_g: n.carbs_g,
      fat_g: n.fat_g,
      fiber_g: n.fiber_g,
      sugar_g: n.sugar_g,
      saturated_fat_g: n.saturated_fat_g,
      calcium_mg: n.calcium_mg,
      iron_mg: n.iron_mg,
      vitamin_c_mg: n.vitamin_c_mg,
    });
    
    const scaled = scaleNutrientsByWeight(per100, item.grams);
    scaledNutrients.push(scaled);
    
    itemDetails.push({
      name: item.name,
      grams: item.grams,
      cal: scaled.calories_kcal,
      pro: scaled.protein_g,
      carb: scaled.carbs_g,
      fat: scaled.fat_g,
    });
    
    console.log(`    ${item.name} (${item.grams}g): cal=${scaled.calories_kcal}, pro=${scaled.protein_g}g, carb=${scaled.carbs_g}g, fat=${scaled.fat_g}g`);
  }
  
  // Aggregate
  const aggregated = aggregateNutrients(scaledNutrients);
  
  // Manual calculation
  const manualCalories = itemDetails.reduce((s, i) => s + i.cal, 0);
  const manualProtein = itemDetails.reduce((s, i) => s + i.pro, 0);
  const manualCarbs = itemDetails.reduce((s, i) => s + i.carb, 0);
  const manualFat = itemDetails.reduce((s, i) => s + i.fat, 0);
  
  console.log('');
  console.log(`  Aggregated (code):   cal=${aggregated.calories_kcal}, pro=${aggregated.protein_g}g, carb=${aggregated.carbs_g}g, fat=${aggregated.fat_g}g`);
  console.log(`  Manual sum:          cal=${Math.round(manualCalories*100)/100}, pro=${Math.round(manualProtein*100)/100}g, carb=${Math.round(manualCarbs*100)/100}g, fat=${Math.round(manualFat*100)/100}g`);
  
  // Check if aggregation matches manual sum
  const checks = [
    { field: 'cal', agg: aggregated.calories_kcal, manual: manualCalories },
    { field: 'protein', agg: aggregated.protein_g, manual: manualProtein },
    { field: 'carbs', agg: aggregated.carbs_g, manual: manualCarbs },
    { field: 'fat', agg: aggregated.fat_g, manual: manualFat },
  ];
  
  let allMatch = true;
  for (const check of checks) {
    const diff = Math.abs(check.agg - Math.round(check.manual * 100) / 100);
    if (diff > 0.1) {
      allMatch = false;
      console.log(`  ❌ Aggregation mismatch for ${check.field}: code=${check.agg} vs manual=${Math.round(check.manual*100)/100}`);
    }
  }
  
  if (allMatch) {
    console.log('  ✅ Multi-item aggregation: CORRECT (code matches manual sum)');
  }
  
  // Now test the EXPECTED values from USDA
  const expectedTotal = {
    calories: 155 + 130 + 330,  // ~615 kcal
    protein: 13 + 2.7 + 62,    // ~77.7g
    carbs: 1.1 + 28 + 0,       // ~29.1g
    fat: 11 + 0.3 + 7.2,       // ~18.5g
  };
  
  console.log('');
  console.log(`  USDA expected totals: cal≈${expectedTotal.calories}, pro≈${expectedTotal.protein}g, carb≈${expectedTotal.carbs}g, fat≈${expectedTotal.fat}g`);
  
  const usdaChecks = [
    { field: 'Calories', agg: aggregated.calories_kcal, usda: expectedTotal.calories, tol: 10 },
    { field: 'Protein', agg: aggregated.protein_g, usda: expectedTotal.protein, tol: 10 },
    { field: 'Carbs', agg: aggregated.carbs_g, usda: expectedTotal.carbs, tol: 15 },
    { field: 'Fat', agg: aggregated.fat_g, usda: expectedTotal.fat, tol: 15 },
  ];
  
  for (const check of usdaChecks) {
    const diff = Math.abs(check.agg - check.usda);
    const pDiff = check.usda > 0 ? (diff / check.usda) * 100 : 0;
    const status = pDiff <= check.tol ? '✅' : '❌';
    console.log(`  ${status} ${check.field}: DB=${check.agg}, USDA≈${check.usda} (${pDiff.toFixed(1)}% diff)`);
  }
}

// AUDIT 9: Pipeline calorie recalculation check
function auditCalorieRecalculation() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 9: PIPELINE CALORIE RECALCULATION BEHAVIOR');
  console.log('='.repeat(80));
  
  // The nutritionEngine.js validatePer100Nutrition function OVERRIDES listed calories
  // with formula calories. Check if this causes accuracy issues.
  
  let overrideIssues = 0;
  
  for (const food of allFoods) {
    const n = food.nutrition_per_100g;
    if (!n) continue;
    
    const listed = n.calories_kcal;
    const protein = n.protein_g || 0;
    const carbs = n.carbs_g || 0;
    const fat = n.fat_g || 0;
    const formulaCal = Math.round((protein * 4 + carbs * 4 + fat * 9) * 100) / 100;
    
    const diff = Math.abs(listed - formulaCal);
    const pDiff = listed > 0 ? (diff / listed) * 100 : 0;
    
    if (pDiff > 10 && listed > 10) {
      overrideIssues++;
      if (overrideIssues <= 10) {
        console.log(`  ⚠️  ${food.name}: listed=${listed}kcal would become ${formulaCal}kcal after recalculation (${pDiff.toFixed(1)}% change)`);
      }
    }
  }
  
  console.log(`\n  Foods where calorie recalculation would change value by >10%: ${overrideIssues}`);
  
  if (overrideIssues === 0) {
    console.log('  ✅ Calorie recalculation is safe for all foods');
  } else {
    console.log('\n  ⚠️  WARNING: The nutritionEngine.js:validatePer100Nutrition() function');
    console.log('      FORCEFULLY OVERRIDES listed calories with P*4+C*4+F*9.');
    console.log('      This can LOSE accuracy for foods with alcohol, fiber calories,');
    console.log('      or complex cooking adjustments.');
  }
}

// AUDIT 10: Multi-item input parsing accuracy
function auditMultiItemParsing() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT 10: MULTI-ITEM INPUT PARSING');
  console.log('='.repeat(80));
  
  const testInputs = [
    {
      input: "2 eggs and 100g rice",
      expectedItems: 2,
      items: [
        { food: /egg/i, qty: 2, unit: 'piece' },
        { food: /rice/i, qty: 100, unit: 'g' },
      ]
    },
    {
      input: "200g chicken breast, 1 apple, 250ml milk",
      expectedItems: 3,
      items: [
        { food: /chicken/i, qty: 200, unit: 'g' },
        { food: /apple/i, qty: 1, unit: 'piece' },
        { food: /milk/i, qty: 250, unit: 'ml' },
      ]
    },
    {
      input: "3 rotis with dal and rice",
      expectedItems: 3,
      items: [
        { food: /roti/i, qty: 3, unit: 'piece' },
        { food: /dal/i },
        { food: /rice/i },
      ]
    },
    {
      input: "500g chicken, 2 eggs, 100g rice, 1 banana",
      expectedItems: 4,
      items: [
        { food: /chicken/i, qty: 500, unit: 'g' },
        { food: /egg/i, qty: 2, unit: 'piece' },
        { food: /rice/i, qty: 100, unit: 'g' },
        { food: /banana/i, qty: 1, unit: 'piece' },
      ]
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const tc of testInputs) {
    const parsed = parseFoodInput(tc.input);
    
    if (parsed.length !== tc.expectedItems) {
      console.log(`  ❌ "${tc.input}" → parsed ${parsed.length} items, expected ${tc.expectedItems}`);
      console.log(`     Parsed: ${JSON.stringify(parsed.map(p => ({ food: p.food_name, qty: p.quantity, unit: p.unit })))}`);
      failed++;
      continue;
    }
    
    let itemPass = true;
    for (let i = 0; i < tc.items.length; i++) {
      const expected = tc.items[i];
      const actual = parsed[i];
      
      if (expected.food && !expected.food.test(actual.food_name)) {
        console.log(`    ❌ Item ${i}: expected food matching ${expected.food}, got "${actual.food_name}"`);
        itemPass = false;
      }
      if (expected.qty !== undefined && actual.quantity !== expected.qty) {
        console.log(`    ❌ Item ${i}: expected qty=${expected.qty}, got ${actual.quantity}`);
        itemPass = false;
      }
      if (expected.unit && actual.unit !== expected.unit) {
        console.log(`    ❌ Item ${i}: expected unit=${expected.unit}, got "${actual.unit}"`);
        itemPass = false;
      }
    }
    
    if (itemPass) {
      passed++;
      console.log(`  ✅ "${tc.input}" → ${parsed.length} items correctly parsed`);
    } else {
      failed++;
    }
  }
  
  console.log(`\n  Parsing accuracy: ${passed}/${passed + failed} (${(passed/(passed+failed)*100).toFixed(1)}%)`);
}


// ============================================================================
// RUN ALL AUDITS
// ============================================================================
function runAllAudits() {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + '  COMPREHENSIVE NUTRITION DATA AUDIT'.padEnd(78) + '║');
  console.log('║' + `  Total foods in database: ${allFoods.length}`.padEnd(78) + '║');
  console.log('║' + `  Audit Date: ${new Date().toISOString()}`.padEnd(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  
  results.totalFoods = allFoods.length;
  
  auditSchema();
  auditCalorieFormula();
  auditNutrientRanges();
  auditUSDAAccuracy();
  auditDuplicates();
  auditPlaceholderData();
  auditSingleItemCalc();
  auditMultiItemCalc();
  auditCalorieRecalculation();
  auditMultiItemParsing();
  
  // FINAL SUMMARY
  console.log('\n' + '='.repeat(80));
  console.log('FINAL AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Total Foods: ${results.totalFoods}`);
  console.log(`  Errors: ${results.errors}`);
  console.log(`  Warnings: ${results.warnings}`);
  console.log(`  Overall status: ${results.errors === 0 ? '✅ PASS' : '❌ ISSUES FOUND'}`);
  console.log('='.repeat(80));
}

runAllAudits();
