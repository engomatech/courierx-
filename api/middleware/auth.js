/**
 * API Key Authentication Middleware
 *
 * Reads X-API-Key header, validates it against the api_keys table,
 * updates last_used_at and increments total_calls on each valid request.
 */

const db = require('../db')

const getKey   = db.prepare('SELECT * FROM api_keys WHERE api_key = ? AND status = ?')
const touchKey = db.prepare(
  "UPDATE api_keys SET last_used_at = datetime('now'), total_calls = total_calls + 1 WHERE id = ?"
)

module.exports = function auth(req, res, next) {
  // Label endpoints are public — the AWB number is the identifier
  // Ops staff and drivers need to open label URLs directly in a browser
  if (req.path.endsWith('/label')) {
    req.partner = null
    return next()
  }

  const key = req.headers['x-api-key']

  if (!key) {
    return res.status(401).json({
      error  : 'UNAUTHORIZED',
      message: 'Missing X-API-Key header. Include your API key with every request.',
    })
  }

  const row = getKey.get(key, 'active')

  if (!row) {
    return res.status(401).json({
      error  : 'UNAUTHORIZED',
      message: 'Invalid or revoked API key. Generate a new key in Admin → Settings → API Keys.',
    })
  }

  // Record usage (fire-and-forget — no await needed for SQLite sync)
  touchKey.run(row.id)

  // Attach partner info to the request for use in route handlers
  req.partner = { id: row.id, name: row.partner_name }

  next()
}
