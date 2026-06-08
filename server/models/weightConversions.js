const { getDb } = require('../db/sqlite');
const { ingredientExists } = require('./ingredients');
const { unitExists } = require('./units');

function validate({ ingredientId, unitId, averageGrams }) {
  if (!Number.isInteger(ingredientId)) {
    throw new Error('weightConversion: ingredientId must be an integer');
  }
  if (!Number.isInteger(unitId)) {
    throw new Error('weightConversion: unitId must be an integer');
  }
  if (typeof averageGrams !== 'number' || !isFinite(averageGrams) || averageGrams <= 0) {
    throw new Error('weightConversion: averageGrams must be a positive number');
  }
  if (!ingredientExists(ingredientId)) {
    throw new Error(`weightConversion: ingredient ${ingredientId} does not exist`);
  }
  if (!unitExists(unitId)) {
    throw new Error(`weightConversion: unit ${unitId} does not exist`);
  }
}

function createConversion({ ingredientId, unitId, averageGrams }) {
  validate({ ingredientId, unitId, averageGrams });
  try {
    getDb().prepare(`
      INSERT INTO weight_conversions (ingredient_id, unit_id, average_grams)
      VALUES (?, ?, ?)
    `).run(ingredientId, unitId, averageGrams);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      throw new Error(
        `weightConversion: combination (ingredient=${ingredientId}, unit=${unitId}) already exists`
      );
    }
    throw e;
  }
  return getConversion(ingredientId, unitId);
}

function getConversion(ingredientId, unitId) {
  return getDb().prepare(`
    SELECT * FROM weight_conversions
    WHERE ingredient_id = ? AND unit_id = ?
  `).get(ingredientId, unitId) || null;
}

function getAllConversions() {
  return getDb().prepare(`
    SELECT wc.*, i.name AS ingredient_name, u.name AS unit_name
    FROM weight_conversions wc
    JOIN ingredients i ON i.id = wc.ingredient_id
    JOIN units       u ON u.id = wc.unit_id
    ORDER BY i.name, u.name
  `).all();
}

function updateConversion(ingredientId, unitId, { averageGrams }) {
  if (!getConversion(ingredientId, unitId)) {
    throw new Error(
      `weightConversion: combination (ingredient=${ingredientId}, unit=${unitId}) not found`
    );
  }
  if (typeof averageGrams !== 'number' || !isFinite(averageGrams) || averageGrams <= 0) {
    throw new Error('weightConversion: averageGrams must be a positive number');
  }
  getDb().prepare(`
    UPDATE weight_conversions SET average_grams = ?
    WHERE ingredient_id = ? AND unit_id = ?
  `).run(averageGrams, ingredientId, unitId);
  return getConversion(ingredientId, unitId);
}

function deleteConversion(ingredientId, unitId) {
  if (!getConversion(ingredientId, unitId)) {
    throw new Error(
      `weightConversion: combination (ingredient=${ingredientId}, unit=${unitId}) not found`
    );
  }
  getDb().prepare(`
    DELETE FROM weight_conversions WHERE ingredient_id = ? AND unit_id = ?
  `).run(ingredientId, unitId);
  return true;
}

module.exports = {
  createConversion,
  getConversion,
  getAllConversions,
  updateConversion,
  deleteConversion
};
