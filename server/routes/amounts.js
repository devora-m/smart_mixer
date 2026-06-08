const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const amounts = require('../models/amounts');

const router = express.Router();

function parseId(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) throw new Error('id must be a positive integer');
  return n;
}

router.get('/', (req, res) => {
  res.json(amounts.getAllAmounts());
});

router.get('/:id', (req, res) => {
  const row = amounts.getAmountById(parseId(req.params.id));
  if (!row) return res.status(404).json({ error: `Amount ${req.params.id} not found` });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const { amount, recordingId } = req.body || {};
  res.status(201).json(amounts.createAmount({ amount, recordingId }));
});

router.put('/:id', requireAuth, (req, res) => {
  const { amount, recordingId } = req.body || {};
  res.json(amounts.updateAmount(parseId(req.params.id), { amount, recordingId }));
});

router.delete('/:id', requireAuth, (req, res) => {
  amounts.deleteAmount(parseId(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
