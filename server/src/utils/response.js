/**
 * Wrap a successful response in a standard envelope.
 */
export function successResponse(res, data, statusCode = 200, message = 'Success') {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Wrap an error response in a standard envelope.
 */
export function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

/**
 * Create a custom error with an HTTP status code.
 */
export function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
