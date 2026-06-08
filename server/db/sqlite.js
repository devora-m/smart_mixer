const Database = require('better-sqlite3');
const path = require('path');

let db = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.SQLITE_PATH || './smart_mixer.db';
    db = new Database(path.resolve(dbPath));
    // Enforce foreign keys (off by default in SQLite!)
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    console.log('[SQLite] opened:', dbPath);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
