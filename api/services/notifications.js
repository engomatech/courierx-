/**
 * Notifications Service — the single emit+broadcast facade for the in-app
 * notification inbox. All route handlers / event hooks that want to surface
 * something to a user call `emit()` here; it persists the row and fans it
 * out to every connected SSE subscriber whose scope matches.
 *
 * Scopes are strings we agree on between backend and frontend:
 *   'ops'            — ops dispatchers, PRS/DRS, hub staff
 *   'admin'          — admin console
 *   'customer:<id>'  — a specific customer portal user
 *   'all'            — broadcast to everyone listening
 *
 * Subscribers opt in via the SSE stream (see routes/notifications-inbox.js)
 * and the `matches()` helper decides delivery. A subscriber with scope
 * 'customer:C123' receives its own events plus any 'all' events; 'ops' and
 * 'admin' each see their own channel plus 'all'.
 */

const db = require('../db')

// ── Prepared statements ─────────────────────────────────────────────────────
const sqlInsert = db.prepare(`
  INSERT INTO notifications (scope, type, title, message, awb, data, read, created_at)
  VALUES (@scope, @type, @title, @message, @awb, @data, 0, datetime('now'))
`)

const sqlMarkRead = db.prepare(`
  UPDATE notifications SET read = 1 WHERE id = ? AND scope = ?
`)

const sqlMarkAllRead = db.prepare(`
  UPDATE notifications SET read = 1 WHERE scope = ? AND read = 0
`)

const sqlList = db.prepare(`
  SELECT id, scope, type, title, message, awb, data, read, created_at
  FROM notifications
  WHERE (scope = ? OR scope = 'all')
  ORDER BY id DESC
  LIMIT ?
`)

const sqlListUnread = db.prepare(`
  SELECT id, scope, type, title, message, awb, data, read, created_at
  FROM notifications
  WHERE (scope = ? OR scope = 'all') AND read = 0
  ORDER BY id DESC
  LIMIT ?
`)

const sqlUnreadCount = db.prepare(`
  SELECT COUNT(*) AS n FROM notifications
  WHERE (scope = ? OR scope = 'all') AND read = 0
`)

const sqlById = db.prepare(`
  SELECT id, scope, type, title, message, awb, data, read, created_at
  FROM notifications WHERE id = ?
`)

// ── Row hydration — parse `data` JSON, coerce read to boolean ───────────────
function hydrate(row) {
  if (!row) return null
  let data = null
  if (row.data) {
    try { data = JSON.parse(row.data) } catch (_) { data = null }
  }
  return {
    id        : row.id,
    scope     : row.scope,
    type      : row.type,
    title     : row.title,
    message   : row.message,
    awb       : row.awb,
    data,
    read      : !!row.read,
    created_at: row.created_at,
  }
}

// ── SSE subscribers ─────────────────────────────────────────────────────────
/**
 * Each subscriber: { id, scope, res, keepAlive }
 * Broadcast fans out to every subscriber whose scope matches.
 */
const subscribers = new Set()
let subscriberSeq = 0

function matches(subscriberScope, notifScope) {
  if (notifScope === 'all') return true
  if (subscriberScope === notifScope) return true
  // admin scope also sees everything operational
  if (subscriberScope === 'admin' && (notifScope === 'ops' || notifScope === 'admin')) return true
  return false
}

function broadcast(notif) {
  const payload = `event: notification\ndata: ${JSON.stringify(notif)}\n\n`
  for (const sub of subscribers) {
    if (!matches(sub.scope, notif.scope)) continue
    try {
      sub.res.write(payload)
    } catch (_) {
      // connection dropped — cleanup happens in subscribe()'s close handler
    }
  }
}

/**
 * Persist a notification and push it over any active SSE streams.
 * Safe to call from any route handler or event hook. Never throws.
 */
function emit({ scope, type, title, message = null, awb = null, data = null }) {
  if (!scope || !type || !title) {
    console.warn('[notifications] emit called with missing fields', { scope, type, title })
    return null
  }
  try {
    const info = sqlInsert.run({
      scope,
      type,
      title,
      message,
      awb,
      data: data ? JSON.stringify(data) : null,
    })
    const row = sqlById.get(info.lastInsertRowid)
    const hydrated = hydrate(row)
    broadcast(hydrated)
    return hydrated
  } catch (err) {
    console.error('[notifications] emit failed:', err.message)
    return null
  }
}

function list(scope, { limit = 50, onlyUnread = false } = {}) {
  const capped = Math.max(1, Math.min(200, limit | 0 || 50))
  const rows = onlyUnread
    ? sqlListUnread.all(scope, capped)
    : sqlList.all(scope, capped)
  return rows.map(hydrate)
}

function unreadCount(scope) {
  return sqlUnreadCount.get(scope).n | 0
}

function markRead(id, scope) {
  const info = sqlMarkRead.run(id, scope)
  return info.changes > 0
}

function markAllRead(scope) {
  const info = sqlMarkAllRead.run(scope)
  return info.changes | 0
}

/**
 * Attach a client as an SSE subscriber. Caller is expected to have already
 * set SSE headers on `res`. Returns an unsubscribe function.
 */
function subscribe(res, scope) {
  const sub = { id: ++subscriberSeq, scope, res }
  subscribers.add(sub)

  // Keep the connection alive — most proxies idle-timeout at 30–60s
  const keepAlive = setInterval(() => {
    try { res.write(': keep-alive\n\n') } catch (_) { /* noop */ }
  }, 20000)
  sub.keepAlive = keepAlive

  const unsubscribe = () => {
    clearInterval(keepAlive)
    subscribers.delete(sub)
  }
  res.on('close', unsubscribe)
  return unsubscribe
}

function subscriberCount() {
  return subscribers.size
}

module.exports = {
  emit,
  list,
  unreadCount,
  markRead,
  markAllRead,
  subscribe,
  subscriberCount,
}
