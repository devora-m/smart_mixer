const { getDb } = require('../db/sqlite');

function validateAmount(amount) {
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    throw new Error('amount: must be a positive number');
  }
}

function createAmount({ amount, recordingId = null }) {
  validateAmount(amount);
  const info = getDb()
    .prepare('INSERT INTO amounts (amount, recording_id) VALUES (?, ?)')
    .run(amount, recordingId);
  return getAmountById(info.lastInsertRowid);
}

function getAmountById(id) {
  return getDb().prepare('SELECT * FROM amounts WHERE id = ?').get(id) || null;
}

function getAllAmounts() {
  return getDb().prepare('SELECT * FROM amounts ORDER BY amount').all();
}

function updateAmount(id, { amount, recordingId }) {
  if (!getAmountById(id)) throw new Error(`amount: id ${id} not found`);
  const fields = [];
  const values = [];
  if (amount !== undefined) {
    validateAmount(amount);
    fields.push('amount = ?');
    values.push(amount);
  }
  if (recordingId !== undefined) {
    fields.push('recording_id = ?');
    values.push(recordingId);
  }
  if (fields.length === 0) return getAmountById(id);
  values.push(id);
  getDb().prepare(`UPDATE amounts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getAmountById(id);
}

function deleteAmount(id) {
  if (!getAmountById(id)) throw new Error(`amount: id ${id} not found`);
  getDb().prepare('DELETE FROM amounts WHERE id = ?').run(id);
  return true;
}

module.exports = {
  createAmount,
  getAmountById,
  getAllAmounts,
  updateAmount,
  deleteAmount
};
