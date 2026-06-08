/*
 * Inserts test recipes into MongoDB.
 * Run with: node seed/seed-mongo.js
 *
 * Prerequisites:
 *   1. SQLite seeded first (node seed/seed-db.js) — ingredient IDs must match.
 *   2. MongoDB running and MONGO_URI set in .env.
 *
 * Ingredient IDs (must match SQLite + INGREDIENT_NAMES in firmware):
 *   1=קמח, 2=סוכר, 3=שמן, 4=חלב, 5=ביצה, 7=שמנת מתוקה, 8=שוקולד נוטלה, 9=שוקולד
 *
 * Unit IDs (must match SQLite):
 *   1=כוס, 2=כף, 3=יחידה, 4=גרם, 5=כפית, 6=מ"ל
 *
 * Foam type IDs (must match FOAM_TYPES_TABLE in firmware):
 *   1=חלמון, 2=חלבון, 3=שמנת מתוקה, 4=קצפת צמחית, 5=Whole Egg (ביצה שלמה)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Recipe }  = require('../models/Recipe');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mixer';

// =====================================================
//  מתכונים לזריעה
// =====================================================
const RECIPES = [
  // ─── Recipe 1: עוגת ספוג (Sponge Cake, code=1) ───────────────────────────
  {
    name:            'עוגת ספוג',
    nameEn:          'Sponge Cake',
    category:        'עוגות',
    difficulty:      2,
    prepTimeMin:     20,
    baseServings:    6,
    code:            1,
    finishRecordingId: null,
    steps: [
      { type: 'ADD', ingredients: [{ ingredientId: 1, unitId: 1, amount: 2 }] },   // 2 כוס קמח
      { type: 'ADD', ingredients: [{ ingredientId: 5, unitId: 3, amount: 1 }] },   // 1 ביצה
      { type: 'ADD', ingredients: [{ ingredientId: 4, unitId: 1, amount: 2 }] },   // 2 כוס חלב
      { type: 'INSTRUCTION', instructionText: 'Make sure all ingredients are in the bowl before mixing', recordingId: null },
      { type: 'MIX', motorSpeed: 6, durationSec: 120 }
    ]
  },

  // ─── Recipe 2: שמנת מוקצפת (Whipped Cream, code=2) ──────────────────────
  {
    name:            'שמנת מוקצפת',
    nameEn:          'Whipped Cream',
    category:        'קינוחים',
    difficulty:      1,
    prepTimeMin:     10,
    baseServings:    4,
    code:            2,
    finishRecordingId: null,
    steps: [
      {
        type:             'WHIP',
        motorSpeed:       7,
        foamTypeId:       3,   // שמנת מתוקה — ראה FOAM_TYPES_TABLE בפירמוור
        foamIngredientId: 7,   // שמנת מתוקה
        foamUnitId:       6,   // מ"ל
        foamAmount:       250
      }
    ]
  },

  // ─── Recipe 3: עוגיות נוטלה (Nutella Cookies, code=3) ────────────────────
  {
    name:            'עוגיות נוטלה',
    nameEn:          'Nutella Cookies',
    category:        'עוגיות',
    difficulty:      3,
    prepTimeMin:     25,
    baseServings:    12,
    code:            3,
    finishRecordingId: null,
    steps: [
      // שלב 0 — הקצפת ביצה אחת, ואז הוספת נוטלה וקמח תוך כדי ערבול
      {
        type:            'WHIP_ADD',
        motorSpeed:      7,
        foamTypeId:      5,       // Whole Egg — ראה FOAM_TYPES_TABLE בפירמוור
        foamIngredientId: 5,      // ביצה
        foamUnitId:      3,       // יחידה
        foamAmount:      1.0,     // 1 ביצה
        ingredients: [
          { ingredientId: 8, unitId: 4, amount: 200 },  // 200g נוטלה
          { ingredientId: 1, unitId: 4, amount: 125 },  // 125g קמח לבן
        ],
        durationSec: 30  // 30 שניות ערבוב נוסף אחרי הרכיב האחרון
      },

      // שלבים 1-6 — הוראות ידניות לסיום המתכון
      // !! instructionText חייב להיות ≤ 63 תווים (מגבלת firmware) !!
      {
        type:            'INSTRUCTION',
        instructionText: 'Put mixture in fridge for 10-15 minutes',
        recordingId:     null
      },
      {
        type:            'INSTRUCTION',
        instructionText: 'Preheat oven to 180 degrees',
        recordingId:     null
      },
      {
        type:            'INSTRUCTION',
        instructionText: 'Form balls on sheet, press dimple in center',
        recordingId:     null
      },
      {
        type:            'INSTRUCTION',
        instructionText: 'Bake for 7-8 minutes',
        recordingId:     null
      },
      {
        type:            'INSTRUCTION',
        instructionText: 'Let cookies cool completely',
        recordingId:     null
      },
      {
        type:            'INSTRUCTION',
        instructionText: 'Fill dimples with Nutella chocolate',
        recordingId:     null
      }
    ]
  }
];

// =====================================================
//  הרצת הזריעה
// =====================================================
async function seedMongo() {
  await mongoose.connect(MONGO_URI);
  console.log('[MongoDB] Connected to', MONGO_URI);

  let inserted = 0;
  let skipped  = 0;

  for (const data of RECIPES) {
    const existing = await Recipe.findOne({ code: data.code });
    if (existing) {
      console.log(`[MongoDB] SKIP  code=${data.code} "${data.nameEn}" — already exists`);
      skipped++;
      continue;
    }
    const recipe = new Recipe(data);
    await recipe.save();
    console.log(`[MongoDB] OK    code=${data.code} "${data.nameEn}" inserted`);
    inserted++;
  }

  console.log(`\n[MongoDB] Done — inserted: ${inserted}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

seedMongo().catch(err => {
  console.error('[MongoDB] Fatal error:', err.message);
  if (err.errors) {
    // הדפסת שגיאות ולידציה בפירוט
    Object.entries(err.errors).forEach(([field, e]) => {
      console.error(`  ${field}: ${e.message}`);
    });
  }
  process.exit(1);
});
