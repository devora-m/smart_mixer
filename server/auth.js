const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// POST /api/auth/verify { password }
// Sets session.authenticated = true on success.
router.post('/verify', asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'password is required' });
  }

  const storedHash = process.env.EDIT_PASSWORD_HASH;
  if (!storedHash) {
    return res.status(503).json({
      error: 'Edit password is not configured. Run: npm run set-password'
    });
  }

  const ok = await bcrypt.compare(password, storedHash);
  if (!ok) {
    // Generic message - don't leak whether the password was wrong vs missing
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.authenticated = true;
  res.json({ ok: true });
}));

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  } else {
    res.json({ ok: true });
  }
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

module.exports = router;
