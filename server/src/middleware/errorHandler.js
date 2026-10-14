/**
 * Centralized Express error handler.
 * Must be the LAST middleware registered in app.js.
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File is too large.' });
  }

  // Generic fallback — never expose stack traces in production
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.';

  return res.status(statusCode).json({ success: false, message });
}

/**
 * 404 handler — must be registered after all routes.
 */
export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
}
