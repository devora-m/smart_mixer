/*
 * Fills SQLite tables with baseline data (Ingredients, Units, Conversions, Foam Types).
 * Run with: node seed/seed-db.js
 */
require('dotenv').config();

// ייבוא פונקציות החיבור מהקובץ שלך. 
// שים לב: ודא שהנתיב המצוין ב-require מתאים בדיוק למיקום של קובץ ה-sqlite שלך.
const { getDb, closeDb } = require('../db/sqlite'); 

// =====================================================
//  ה-ID-ים חייבים להתאים ל-builtin_conversions.h ו-builtin_recipes.h
//  שנמצאים ב-MixerScreen firmware
// =====================================================
const SEED_DATA = `
-- 1. יחידות מידה (units) — חייב להתאים ל-unitId ב-builtin_conversions.h
INSERT OR IGNORE INTO units (id, name, recording_id) VALUES 
(1, 'כוס',    2),   -- unitId=1 → כוס   (folder 2, record 1)
(2, 'כף',     2),   -- unitId=2 → כף    (folder 2, record 2)
(3, 'יחידה',  2),   -- unitId=3 → יחידה (folder 2, record 3)
(4, 'גרם',    2),   -- unitId=4 → גרם
(5, 'כפית',   2),   -- unitId=5 → כפית
(6, 'מ"ל',  6);  -- unitId=6 → מ"ל (folder 2, record 6)

-- 2. חומרים (ingredients) — חייב להתאים ל-ingredientId ב-builtin_conversions.h
-- name_en חייב להתאים ל-INGREDIENT_NAMES ב-builtin_conversions.h
INSERT OR IGNORE INTO ingredients (id, name, name_en, recording_id) VALUES 
(1, 'קמח',         'Flour',        1),
(2, 'סוכר',        'Sugar',        2),
(3, 'שמן',         'Oil',          3),
(4, 'חלב',         'Milk',         4),
(5, 'ביצה',        'Egg',          5),
(7, 'שמנת מתוקה',  'Heavy Cream',  7),
(8, 'שוקולד נוטלה', 'Nutella',      8),  -- recording_id=8 להקלטה עתידית
(9, 'שוקולד',       'Chocolate',    9);  -- רכיב חדש — recording_id=9 להקלטה עתידית

-- 3. המרות משקל (weight_conversions) — חייב להתאים ל-CONVERSION_TABLE ב-builtin_conversions.h
INSERT OR IGNORE INTO weight_conversions (ingredient_id, unit_id, average_grams) VALUES 
-- קמח (1)
(1, 1, 120.0),   -- כוס קמח = 120 גרם
(1, 2,  15.0),   -- כף קמח  = 15 גרם
-- סוכר (2)
(2, 1, 200.0),   -- כוס סוכר = 200 גרם
(2, 2,  12.0),   -- כף סוכר  = 12 גרם
-- שמן (3)
(3, 1, 220.0),   -- כוס שמן  = 220 גרם
(3, 2,  14.0),   -- כף שמן   = 14 גרם
-- חלב (4)
(4, 1, 240.0),   -- כוס חלב  = 240 גרם
(4, 2,  15.0),   -- כף חלב   = 15 גרם
-- ביצה (5)
(5, 3,  55.0),   -- יחידה ביצה = 55 גרם
-- שמנת מתוקה (7)
(7, 1, 240.0),   -- כוס שמנת = 240 גרם
(7, 2,  15.0),   -- כף שמנת  = 15 גרם
(7, 6, 1.0),     -- מ"ל שמנת = 1 גרם
-- נוטלה (8) — נמדד תמיד בגרמים; unitId=4=גרם לא דורש ערך בטבלה (גרמפרגרם=1.0 תמיד)
(8, 4, 1.0);     -- 1ג נוטלה = 1 גרם

-- 4. כמויות (amounts)
INSERT OR IGNORE INTO amounts (id, amount, recording_id) VALUES 
(1,  0.25, 1),
(2,  0.33, 9),
(3,  0.5,  2),
(4,  0.75, 3),
(5,  1.0,  4),
(6,  1.5,  5),
(7,  2.0,  6),
(8,  3.0, 11),
(9,  4.0, 12),
(10, 5.0, 13),
(11, 125.0, 14),  -- מאה עשרים וחמש גרם — recording להיקלט
(12, 200.0, 15);  -- מאתיים גרם          — recording להיקלט

-- 5. סוגי קצף (foam_types)
-- height_per_gram חייב להיות זהה ל-heightPerGram ב-FOAM_TYPES_TABLE בפירמוור
-- !! כל עדכון כאן חייב להתעדכן בו-ב-builtin_conversions.h בו-זמנית עד כיול !!
INSERT OR IGNORE INTO foam_types (id, name, height_per_gram) VALUES 
(1, 'חלמון',         0.030),  -- !! זמני — יש לכייל
(2, 'חלבון',         0.060),  -- !! זמני
(3, 'שמנת מתוקה',  0.032),  -- !! זמני
(4, 'קצפת צמחית', 0.038),  -- !! זמני
(5, 'Whole Egg',     0.045);  -- !! זמני

`;

function seedSqlite() {
  const db = getDb();
  
  console.log('[SQLite] Starting database seed...');

  // שימוש ב-db.transaction כדי לבצע את כל ההכנסות בבת אחת.
  // זה קריטי למהירות ובטיחות הנתונים ב-better-sqlite3
  const runStatements = db.transaction(() => {
    db.exec(SEED_DATA);
  });
  
  runStatements();

  console.log('[SQLite] Database successfully seeded with baseline data!');
  
  // הדפסת ביקורת קטנה בטרמינל כדי לוודא שהדאטה בפנים
  const ingredientsCount = db.prepare("SELECT COUNT(*) as total FROM ingredients").get();
  const conversionsCount = db.prepare("SELECT COUNT(*) as total FROM weight_conversions").get();
  
  console.log(` - Total ingredients available: ${ingredientsCount.total}`);
  console.log(` - Total weight conversions available: ${conversionsCount.total}`);
}

if (require.main === module) {
  try {
    seedSqlite();
  } catch (error) {
    console.error('[SQLite] Error seeding database:', error);
  } finally {
    closeDb();
    console.log('[SQLite] Database connection closed.');
  }
}

module.exports = { seedSqlite };