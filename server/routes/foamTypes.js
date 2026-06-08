const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const foamTypes = require('../models/foamTypes');

const router = express.Router();

function parseId(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) throw new Error('id must be a positive integer');
  return n;
}

router.get('/', (req, res) => {
  res.json(foamTypes.getAllFoamTypes());
});

router.get('/:id', (req, res) => {
  const row = foamTypes.getFoamTypeById(parseId(req.params.id));
  if (!row) return res.status(404).json({ error: `Foam type ${req.params.id} not found` });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const { name, heightPerGram } = req.body || {};
  res.status(201).json(foamTypes.createFoamType({ name, heightPerGram }));
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, heightPerGram } = req.body || {};
  res.json(foamTypes.updateFoamType(parseId(req.params.id), { name, heightPerGram }));
});

router.delete('/:id', requireAuth, (req, res) => {
  foamTypes.deleteFoamType(parseId(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
