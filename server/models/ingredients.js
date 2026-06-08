const { getDb } = require('../db/sqlite');

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('ingredient: name must be a non-empty string');
  }
  return name.trim();
}

function createIngredient({ name, recordingId = null }) {
  const cleanName = validateName(name);
  try {
    const stmt = getDb().prepare(
      'INSERT INTO ingredients (name, recording_id) VALUES (?, ?)'
    );
    const info = stmt.run(cleanName, recordingId);
    return getIngredientById(info.lastInsertRowid);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`ingredient: name "${cleanName}" already exists`);
    }
    throw e;
  }
}

function getIngredientById(id) {
  return getDb()
    .prepare('SELECT * FROM ingredients WHERE id = ?')
    .get(id) || null;
}

function getIngredientByName(name) {
  return getDb()
    .prepare('SELECT * FROM ingredients WHERE name = ?')
    .get(name) || null;
}

function getAllIngredients() {
  return getDb()
    .prepare('SELECT * FROM ingredients ORDER BY name')
    .all();
}

function updateIngredient(id, { name, recordingId }) {
  if (!getIngredientById(id)) {
    throw new Error(`ingredient: id ${id} not found`);
  }
  const fields = [];
  const values = [];
  if (name !== undefined) {
    fields.push('name = ?');
    values.push(validateName(name));
  }
  if (recordingId !== undefined) {
    fields.push('recording_id = ?');
    values.push(recordingId);
  }
  if (fields.length === 0) return getIngredientById(id);
  values.push(id);
  try {
    getDb().prepare(`UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`ingredient: name "${name}" already exists`);
    }
    throw e;
  }
  return getIngredientById(id);
}

function deleteIngredient(id) {
  if (!getIngredientById(id)) {
    throw new Error(`ingredient: id ${id} not found`);
  }
  getDb().prepare('DELETE FROM ingredients WHERE id = ?').run(id);
  return true;
}

// Used by Recipe validation to check existence efficiently
function ingredientExists(id) {
  const row = getDb()
    .prepare('SELECT 1 FROM ingredients WHERE id = ?')
    .get(id);
  return !!row;
}

module.exports = {
  createIngredient,
  getIngredientById,
  getIngredientByName,
  getAllIngredients,
  updateIngredient,
  deleteIngredient,
  ingredientExists
};
