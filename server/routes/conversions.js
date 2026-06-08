const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const conversions = require('../models/weightConversions');

const router = express.Router();

function parseId(val, name) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) throw new Error(`${name} must be a positive integer`);
  return n;
}

// ---- PUBLIC ----

// GET /api/conversions - the controller will fetch this once at boot
router.get('/', (req, res) => {
  res.json(conversions.getAllConversions());
});

// GET /api/conversions/:ingredientId/:unitId - single lookup
router.get('/:ingredientId/:unitId', (req, res) => {
  const ingredientId = parseId(req.params.ingredientId, 'ingredientId');
  const unitId = parseId(req.params.unitId, 'unitId');
  const row = conversions.getConversion(ingredientId, unitId);
  if (!row) {
    return res.status(404).json({
      error: `Conversion (ingredient=${ingredientId}, unit=${unitId}) not found`
    });
  }
  res.json(row);
});

// ---- EDIT ----

// POST /api/conversions  { ingredientId, unitId, averageGrams }
router.post('/', requireAuth, (req, res) => {
  const { ingredientId, unitId, averageGrams } = req.body || {};
  const created = conversions.createConversion({ ingredientId, unitId, averageGrams });
  res.status(201).json(created);
});

// PUT /api/conversions/:ingredientId/:unitId  { averageGrams }
router.put('/:ingredientId/:unitId', requireAuth, (req, res) => {
  const ingredientId = parseId(req.params.ingredientId, 'ingredientId');
  const unitId = parseId(req.params.unitId, 'unitId');
  const { averageGrams } = req.body || {};
  const updated = conversions.updateConversion(ingredientId, unitId, { averageGrams });
  res.json(updated);
});

// DELETE /api/conversions/:ingredientId/:unitId
router.delete('/:ingredientId/:unitId', requireAuth, (req, res) => {
  const ingredientId = parseId(req.params.ingredientId, 'ingredientId');
  const unitId = parseId(req.params.unitId, 'unitId');
  conversions.deleteConversion(ingredientId, unitId);
  res.json({ ok: true });
});

module.exports = router;
