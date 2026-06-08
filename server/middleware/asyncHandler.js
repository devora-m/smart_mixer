// Wraps async route handlers so thrown errors / rejected promises
// reach the error-handling middleware automatically.
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
