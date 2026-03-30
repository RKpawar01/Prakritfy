const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const connectDB = require('./src/config/db');
const Food = require('./src/models/Food');

async function reseed() {
  try {
    console.log('🌱 Reseeding Complete Foods Dataset\n');
    
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Clear collection
    console.log('🗑️  Clearing old food data...');
    await Food.deleteMany({});
    const count = await Food.countDocuments();
    console.log('   ✅ Cleared. Remaining foods:', count, '\n');
    
    // Load canonical foods
    console.log('📂 Loading canonical-foods.json...');
    const canonicalPath = './data/foods/canonical-foods.json';
    const canonicalData = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
    console.log('   ✅ Loaded', canonicalData.length, 'foods\n');
    
    // Map canonical schema to MongoDB model
    const mappedFoods = canonicalData.map(food => {
      const nutrition = food.nutrition_per_100g || {};
      
      // Separate macros and micros
      const nutritionPerHundred = {
        calories: nutrition.calories_kcal ?? nutrition.calories ?? 0,
        protein: nutrition.protein_g ?? nutrition.protein ?? 0,
        carbs: nutrition.carbs_g ?? nutrition.carbs ?? 0,
        fat: nutrition.fat_g ?? nutrition.fat ?? 0,
        fiber: nutrition.fiber_g ?? nutrition.fiber ?? 0,
        sugar: nutrition.sugar_g ?? nutrition.sugar ?? 0,
        saturatedFat: nutrition.saturated_fat_g ?? nutrition.saturatedFat ?? 0,
      };
      
      const micronutrientsPerHundred = {
        vitaminA: nutrition.vitamin_a_mcg ?? nutrition.vitaminA,
        vitaminB1: nutrition.vitamin_b1_mg ?? nutrition.vitaminB1,
        vitaminB2: nutrition.vitamin_b2_mg ?? nutrition.vitaminB2,
        vitaminB3: nutrition.vitamin_b3_mg ?? nutrition.vitaminB3,
        vitaminB6: nutrition.vitamin_b6_mg ?? nutrition.vitaminB6,
        vitaminB12: nutrition.vitamin_b12_mcg ?? nutrition.vitaminB12,
        vitaminC: nutrition.vitamin_c_mg ?? nutrition.vitaminC,
        vitaminD: nutrition.vitamin_d_mcg ?? nutrition.vitaminD,
        vitaminE: nutrition.vitamin_e_mg ?? nutrition.vitaminE,
        vitaminK: nutrition.vitamin_k_mcg ?? nutrition.vitaminK,
        folate: nutrition.folate_mcg ?? nutrition.folate,
        calcium: nutrition.calcium_mg ?? nutrition.calcium,
        iron: nutrition.iron_mg ?? nutrition.iron,
        magnesium: nutrition.magnesium_mg ?? nutrition.magnesium,
        potassium: nutrition.potassium_mg ?? nutrition.potassium,
        sodium: nutrition.sodium_mg ?? nutrition.sodium,
        zinc: nutrition.zinc_mg ?? nutrition.zinc,
      };
      
      return {
        name: food.name,
        aliases: food.aliases,
        canonical_name: food.search?.primary_name,
        category: food.category,
        subcategory: food.subcategory,
        region: food.region,
        diet_tags: food.diet_tags,
        goal_tags: food.goal_tags,
        serving: food.serving,
        preparation_state: food.preparation_state,
        cooking_method: food.cooking_method,
        budget_category: food.budget_category,
        availability: food.availability,
        nutrition_per_100g: nutritionPerHundred,
        micronutrients_per_100g: micronutrientsPerHundred,
        source: food.source,
        verified: food.verified,
        source_reference: food.source_reference,
      };
    });
    
    // Insert foods
    console.log('💾 Inserting foods to MongoDB...');
    const inserted = await Food.insertMany(mappedFoods, { ordered: false });
    console.log('   ✅ Inserted', inserted.length, 'foods\n');
    
    // Verify
    const finalCount = await Food.countDocuments();
    console.log('✅ Final count in MongoDB:', finalCount, 'foods');
    
    // Show sample
    const sample = await Food.findOne({ name: /Chicken Breast/i });
    if (sample) {
      console.log('\n📄 Sample Verification (Chicken Breast):');
      console.log('   Calories:', sample.nutrition_per_100g.calories);
      console.log('   Protein:', sample.nutrition_per_100g.protein);
      console.log('   Vitamin B1:', sample.micronutrients_per_100g.vitaminB1);
      console.log('   Magnesium:', sample.micronutrients_per_100g.magnesium);
      console.log('   Potassium:', sample.micronutrients_per_100g.potassium);
      console.log('   Zinc:', sample.micronutrients_per_100g.zinc);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

reseed();
