/*
 * Creates all SQLite tables if they don't exist. Idempotent.
 * Run with: npm run init-db
 */
require('dotenv').config();
const { getDb, closeDb } = require('../db/sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ingredients (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL UNIQUE,
  name_en      TEXT,
  recording_id INTEGER
);

CREATE TABLE IF NOT EXISTS units (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL UNIQUE,
  recording_id INTEGER
);

CREATE TABLE IF NOT EXISTS amounts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  amount       REAL    NOT NULL,
  recording_id INTEGER
);

CREATE TABLE IF NOT EXISTS weight_conversions (
  ingredient_id INTEGER NOT NULL,
  unit_id       INTEGER NOT NULL,
  average_grams REAL    NOT NULL CHECK (average_grams > 0),
  PRIMARY KEY (ingredient_id, unit_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id)       REFERENCES units(id)       ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS foam_types (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL UNIQUE,
  height_per_gram REAL    -- ס"מ לכל גרם חומר מוקצף — מתאים ל-heightPerGram בפירמוור
);
`;

// הוספת עמודת name_en לטבלה קיימת — בטוח להריץ כמה פעמים (שגיאה נבלעת אם קיימת)
const MIGRATIONS = [
  `ALTER TABLE ingredients ADD COLUMN name_en TEXT`,
  // שינוי שם עמודה foam_types: height_per_egg_cm → height_per_gram
  `ALTER TABLE foam_types RENAME COLUMN height_per_egg_cm TO height_per_gram`
];

function initSqlite() {
  const db = getDb();
  db.exec(SCHEMA);

  // הרצת migrations — כל אחד נבלע בשקט אם השינוי כבר בוצע
  for (const migration of MIGRATIONS) {
    try {
      db.exec(migration);
    } catch (e) {
      // בולע: עמודה כבר קיימת / עמודה ישנה כבר שונתה / עמודה לא קיימת (כבר הוסרה)
      const known =
        e.message.includes('duplicate column name') ||
        e.message.includes('no such column');
      if (!known) throw e;
    }
  }

  console.log('[SQLite] schema ready. Tables:');
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all();
  tables.forEach(t => console.log('  -', t.name));
}

if (require.main === module) {
  try {
    initSqlite();
  } finally {
    closeDb();
  }
}

module.exports = { initSqlite };
