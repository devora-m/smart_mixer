const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const ingredients = require('../models/ingredients');

const router = express.Router();

function parseId(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) throw new Error('id must be a positive integer');
  return n;
}

// ---- PUBLIC ----
router.get('/', (req, res) => {
  res.json(ingredients.getAllIngredients());
});

router.get('/:id', (req, res) => {
  const row = ingredients.getIngredientById(parseId(req.params.id));
  if (!row) return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  res.json(row);
});

// ---- EDIT ----
router.post('/', requireAuth, (req, res) => {
  const { name, recordingId } = req.body || {};
  const created = ingredients.createIngredient({ name, recordingId });
  res.status(201).json(created);
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, recordingId } = req.body || {};
  const updated = ingredients.updateIngredient(parseId(req.params.id), { name, recordingId });
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  ingredients.deleteIngredient(parseId(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
