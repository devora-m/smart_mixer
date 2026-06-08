// Allows the request through only if the user has authenticated via /api/auth/verify.
// Used on every POST / PUT / DELETE route.
module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required. POST /api/auth/verify first.' });
};
