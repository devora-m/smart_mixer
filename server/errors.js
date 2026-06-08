// Centralized error handler. Express 4 picks up any handler with 4 args
// and routes errors here when next(err) is called or a Promise rejects.
module.exports = function errorHandler(err, req, res, next) {
  // Don't log expected validation errors as crashes
  const isExpected =
    err.name === 'ValidationError' ||
    err.name === 'CastError' ||
    (err.message && (
      err.message.includes('not found') ||
      err.message.includes('already exists') ||
      err.message.includes('does not exist') ||
      err.message.includes('is not') ||
      err.message.includes('must be')
    ));

  if (!isExpected) {
    console.error('[Error]', err);
  } else {
    console.warn(`[Validation] ${req.method} ${req.path}: ${err.message}`);
  }

  // Mongoose validation - multiple field errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.keys(err.errors).map((k) => ({
        field: k,
        message: err.errors[k].message
      }))
    });
  }

  // Mongoose CastError - bad ObjectId format
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: "${err.value}"` });
  }

  // Map our thrown Error messages to HTTP statuses
  const msg = err.message || 'Internal server error';
  let status = 400;
  if (/not found/.test(msg))         status = 404;
  else if (/already exists/.test(msg)) status = 409;

  res.status(status).json({ error: msg });
};
