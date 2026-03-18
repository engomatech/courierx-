/**
 * Admin Routes — API Key Management
 *
 * These routes are for internal use by the Online Express Admin UI only.
 * They do NOT require an X-API-Key (they are protected by the admin
 * session in the React app — the admin is the only one who calls them).
 *
 * GET    /api/v1/admin/keys         — List all API keys
 * POST   /api/v1/admin/keys         — Generate a new API key
 * DELETE /api/v1/admin/keys/:id     — Revoke a key
 */

const express = require('express')
const { nanoid } = require('nanoid')
const db      = require('../db')

const router = express.Router()

// ── Prepared statements ──────────────────────────────────────────────────────
const listKeys   = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC')
const insertKey  = db.prepare(`
  INSERT INTO api_keys (id, partner_name, api_key, status)
  VALUES (@id, @partner_name, @api_key, 'active')
`)
const revokeKey  = db.prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ?")
const getKeyById = db.prepare('SELECT * FROM api_keys WHERE id = ?')

// ── GET /api/v1/admin/keys ───────────────────────────────────────────────────
router.get('/keys', (req, res) => {
  const keys = listKeys.all()
  return res.json({ keys })
})

// ── POST /api/v1/admin/keys ──────────────────────────────────────────────────
router.post('/keys', (req, res) => {
  const { partner_name } = req.body || {}

  if (!partner_name || !partner_name.trim()) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'partner_name is required.',
      fields : { partner_name: 'Required' },
    })
  }

  const id      = `KEY_${nanoid(8).toUpperCase()}`
  const api_key = `cx_live_${nanoid(32)}`

  insertKey.run({ id, partner_name: partner_name.trim(), api_key })

  const created = getKeyById.get(id)

  return res.status(201).json({
    success: true,
    key    : created,
  })
})

// ── DELETE /api/v1/admin/keys/:id ────────────────────────────────────────────
router.delete('/keys/:id', (req, res) => {
  const row = getKeyById.get(req.params.id)

  if (!row) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `API key ${req.params.id} not found.`,
    })
  }

  if (row.status === 'revoked') {
    return res.status(409).json({
      error  : 'ALREADY_REVOKED',
      message: `API key ${req.params.id} is already revoked.`,
    })
  }

  revokeKey.run(req.params.id)

  return res.json({
    success: true,
    message: `API key for ${row.partner_name} has been revoked.`,
  })
})

module.exports = router
