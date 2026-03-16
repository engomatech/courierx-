/**
 * Global Error Handler Middleware
 *
 * Catches any error thrown (or passed via next(err)) in route handlers
 * and returns a consistent JSON error response.
 */

module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err.message, err.stack)

  // JSON parse errors from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error  : 'BAD_REQUEST',
      message: 'Request body is not valid JSON.',
    })
  }

  res.status(err.status || 500).json({
    error  : err.code   || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred. Please try again.',
  })
}
