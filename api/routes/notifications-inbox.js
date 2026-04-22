/**
 * Notifications Inbox Routes — in-app notification bell backend
 *
 *   GET    /api/v1/notifications              — list recent notifications
 *   GET    /api/v1/notifications/unread-count — just the unread count
 *   PATCH  /api/v1/notifications/:id/read     — mark a single item read
 *   POST   /api/v1/notifications/mark-all-read — mark everything in scope read
 *   GET    /api/v1/notifications/stream       — SSE stream of live events
 *   POST   /api/v1/notifications              — (internal) emit a notification
 *
 * Scope is derived from the X-User-Scope header (set by the frontend shell).
 * Accepted values: 'ops', 'admin', 'customer:<id>'. Falls back to 'ops' so
 * the dev dashboard isn't blank during local debugging.
 *
 * Note: this is separate from routes/notifications.js, which handles SMTP
 * settings and outbound email notifications — two different concerns
 * that happened to share a name.
 */

const express = require('express')
const router = express.Router()
const svc = require('../services/notifications')

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveScope(req) {
  const raw = (req.headers['x-user-scope'] || req.query.scope || 'ops').toString().trim()
  // Minimal validation — must be a known shell or a customer:<id>
  if (raw === 'ops' || raw === 'admin' || raw === 'all') return raw
  if (raw.startsWith('customer:') && raw.length > 9) return raw
  return 'ops'
}

// ── GET / — list recent notifications ───────────────────────────────────────
router.get('/', (req, res) => {
  const scope = resolveScope(req)
  const limit = parseInt(req.query.limit, 10) || 50
  const onlyUnread = req.query.unread === '1' || req.query.unread === 'true'
  const items = svc.list(scope, { limit, onlyUnread })
  const unread = svc.unreadCount(scope)
  res.json({ items, unread, scope })
})

// ── GET /unread-count — the badge number only ───────────────────────────────
router.get('/unread-count', (req, res) => {
  const scope = resolveScope(req)
  res.json({ scope, unread: svc.unreadCount(scope) })
})

// ── PATCH /:id/read — mark a single notification as read ────────────────────
router.patch('/:id/read', (req, res) => {
  const scope = resolveScope(req)
  const id = parseInt(req.params.id, 10)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' })
  }
  const ok = svc.markRead(id, scope)
  res.json({ ok, id, unread: svc.unreadCount(scope) })
})

// ── POST /mark-all-read — clear the unread count for this scope ─────────────
router.post('/mark-all-read', (req, res) => {
  const scope = resolveScope(req)
  const changed = svc.markAllRead(scope)
  res.json({ ok: true, changed, unread: svc.unreadCount(scope) })
})

// ── POST / — (internal) emit a notification ─────────────────────────────────
// Intended for same-server callers. Left open for the ops UI to trigger ad-hoc
// test notifications from admin settings. Validates the payload minimally.
router.post('/', (req, res) => {
  const { scope, type, title, message, awb, data } = req.body || {}
  if (!scope || !type || !title) {
    return res.status(400).json({ error: 'scope, type and title are required' })
  }
  const emitted = svc.emit({ scope, type, title, message, awb, data })
  if (!emitted) return res.status(500).json({ error: 'emit failed' })
  res.status(201).json(emitted)
})

// ── GET /stream — Server-Sent Events live stream ────────────────────────────
router.get('/stream', (req, res) => {
  const scope = resolveScope(req)

  res.setHeader('Content-Type',       'text/event-stream')
  res.setHeader('Cache-Control',      'no-cache, no-transform')
  res.setHeader('Connection',         'keep-alive')
  res.setHeader('X-Accel-Buffering',  'no')            // Nginx: don't buffer
  res.flushHeaders?.()

  // Greet the client so it can confirm the stream is live
  res.write(`event: ready\ndata: ${JSON.stringify({ scope, at: new Date().toISOString() })}\n\n`)

  svc.subscribe(res, scope)
})

module.exports = router
