const { getDb } = require('../db/sqlite');

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('unit: name must be a non-empty string');
  }
  return name.trim();
}

function createUnit({ name, recordingId = null }) {
  const cleanName = validateName(name);
  try {
    const info = getDb()
      .prepare('INSERT INTO units (name, recording_id) VALUES (?, ?)')
      .run(cleanName, recordingId);
    return getUnitById(info.lastInsertRowid);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`unit: name "${cleanName}" already exists`);
    }
    throw e;
  }
}

function getUnitById(id) {
  return getDb().prepare('SELECT * FROM units WHERE id = ?').get(id) || null;
}

function getUnitByName(name) {
  return getDb().prepare('SELECT * FROM units WHERE name = ?').get(name) || null;
}

function getAllUnits() {
  return getDb().prepare('SELECT * FROM units ORDER BY name').all();
}

function updateUnit(id, { name, recordingId }) {
  if (!getUnitById(id)) throw new Error(`unit: id ${id} not found`);
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
  if (fields.length === 0) return getUnitById(id);
  values.push(id);
  try {
    getDb().prepare(`UPDATE units SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`unit: name "${name}" already exists`);
    }
    throw e;
  }
  return getUnitById(id);
}

function deleteUnit(id) {
  if (!getUnitById(id)) throw new Error(`unit: id ${id} not found`);
  getDb().prepare('DELETE FROM units WHERE id = ?').run(id);
  return true;
}

function unitExists(id) {
  return !!getDb().prepare('SELECT 1 FROM units WHERE id = ?').get(id);
}

module.exports = {
  createUnit,
  getUnitById,
  getUnitByName,
  getAllUnits,
  updateUnit,
  deleteUnit,
  unitExists
};
