const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const recipes = require('../models/recipes');

const router = express.Router();

// =====================================================
//  PUBLIC (read-only)
// =====================================================

// GET /api/recipes?difficulty=3&category=עוגות&ingredientIds=1,2,3
router.get('/', asyncHandler(async (req, res) => {
  const opts = {};

  if (req.query.difficulty !== undefined) {
    const n = parseInt(req.query.difficulty, 10);
    if (isNaN(n)) throw new Error('difficulty must be an integer');
    opts.difficulty = n;
  }

  if (req.query.category !== undefined) {
    opts.category = req.query.category;
  }

  if (req.query.ingredientIds !== undefined) {
    // accept either "1,2,3" string or repeated ?ingredientIds=1&ingredientIds=2
    const raw = Array.isArray(req.query.ingredientIds)
      ? req.query.ingredientIds
      : req.query.ingredientIds.split(',');
    const ids = raw.map((s) => {
      const n = parseInt(s, 10);
      if (isNaN(n)) throw new Error(`ingredientIds: "${s}" is not an integer`);
      return n;
    });
    opts.ingredientIds = ids;
  }

  const list = await recipes.getAllRecipes(opts);
  res.json(list);
}));

// GET /api/recipes/by-code/:code  — חיפוש לפי קוד מתכון (must be before /:id)
router.get('/by-code/:code', asyncHandler(async (req, res) => {
  const recipe = await recipes.getRecipeByCode(req.params.code);
  if (!recipe) {
    return res.status(404).json({ error: `Recipe with code ${req.params.code} not found` });
  }
  res.json(recipe);
}));

// GET /api/recipes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const recipe = await recipes.getRecipeById(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }
  res.json(recipe);
}));

// =====================================================
//  EDIT (require auth)
// =====================================================

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const created = await recipes.createRecipe(req.body);
  res.status(201).json(created);
}));

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const updated = await recipes.updateRecipe(req.params.id, req.body);
  res.json(updated);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  await recipes.deleteRecipe(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;
