const { getDb } = require('../db/sqlite');

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('foamType: name must be a non-empty string');
  }
  return name.trim();
}

function createFoamType({ name, heightPerGram = null }) {
  const cleanName = validateName(name);
  if (heightPerGram !== null && heightPerGram !== undefined) {
    if (typeof heightPerGram !== 'number' || !isFinite(heightPerGram) || heightPerGram <= 0) {
      throw new Error('foamType: heightPerGram must be a positive number or null');
    }
  }
  try {
    const info = getDb()
      .prepare('INSERT INTO foam_types (name, height_per_gram) VALUES (?, ?)')
      .run(cleanName, heightPerGram);
    return getFoamTypeById(info.lastInsertRowid);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`foamType: name "${cleanName}" already exists`);
    }
    throw e;
  }
}

function getFoamTypeById(id) {
  return getDb().prepare('SELECT * FROM foam_types WHERE id = ?').get(id) || null;
}

function getAllFoamTypes() {
  return getDb().prepare('SELECT * FROM foam_types ORDER BY name').all();
}

function updateFoamType(id, { name, heightPerGram }) {
  if (!getFoamTypeById(id)) throw new Error(`foamType: id ${id} not found`);
  const fields = [];
  const values = [];
  if (name !== undefined) {
    fields.push('name = ?');
    values.push(validateName(name));
  }
  if (heightPerGram !== undefined) {
    if (heightPerGram !== null) {
      if (typeof heightPerGram !== 'number' || !isFinite(heightPerGram) || heightPerGram <= 0) {
        throw new Error('foamType: heightPerGram must be a positive number or null');
      }
    }
    fields.push('height_per_gram = ?');
    values.push(heightPerGram);
  }
  if (fields.length === 0) return getFoamTypeById(id);
  values.push(id);
  try {
    getDb().prepare(`UPDATE foam_types SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`foamType: name "${name}" already exists`);
    }
    throw e;
  }
  return getFoamTypeById(id);
}

function deleteFoamType(id) {
  if (!getFoamTypeById(id)) throw new Error(`foamType: id ${id} not found`);
  getDb().prepare('DELETE FROM foam_types WHERE id = ?').run(id);
  return true;
}

function foamTypeExists(id) {
  return !!getDb().prepare('SELECT 1 FROM foam_types WHERE id = ?').get(id);
}

module.exports = {
  createFoamType,
  getFoamTypeById,
  getAllFoamTypes,
  updateFoamType,
  deleteFoamType,
  foamTypeExists
};
