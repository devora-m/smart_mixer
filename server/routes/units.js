const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const units = require('../models/units');

const router = express.Router();

function parseId(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) throw new Error('id must be a positive integer');
  return n;
}

router.get('/', (req, res) => {
  res.json(units.getAllUnits());
});

router.get('/:id', (req, res) => {
  const row = units.getUnitById(parseId(req.params.id));
  if (!row) return res.status(404).json({ error: `Unit ${req.params.id} not found` });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const { name, recordingId } = req.body || {};
  res.status(201).json(units.createUnit({ name, recordingId }));
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, recordingId } = req.body || {};
  res.json(units.updateUnit(parseId(req.params.id), { name, recordingId }));
});

router.delete('/:id', requireAuth, (req, res) => {
  units.deleteUnit(parseId(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
