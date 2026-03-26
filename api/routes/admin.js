/**
 * Admin Routes — API Key Management + Partner Shipments
 *
 * These routes are for internal use by the Online Express Admin UI only.
 * They do NOT require an X-API-Key (they are protected by the admin
 * session in the React app — the admin is the only one who calls them).
 *
 * GET    /api/v1/admin/keys              — List all API keys
 * POST   /api/v1/admin/keys              — Generate a new API key
 * DELETE /api/v1/admin/keys/:id          — Revoke a key
 * GET    /api/v1/admin/shipments         — List all partner-API shipments (ops view)
 * GET    /api/v1/admin/shipments/:awb    — Get one partner shipment with events
 */

const express = require('express')
const { nanoid } = require('nanoid')
const db      = require('../db')
const { sendNotification, sendTestEmail, getAllSettings } = require('../mailer')
const { sendShipmentSMS } = require('../sms')

const router = express.Router()

// ── Prepared statements ──────────────────────────────────────────────────────
const listKeys   = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC')

// Proof of delivery
const upsertPOD = db.prepare(`
  INSERT INTO proof_of_delivery
    (awb, recipient_name, recipient_mobile, notes, signature_data, photo_data, recorded_by, recorded_at)
  VALUES
    (@awb, @recipient_name, @recipient_mobile, @notes, @signature_data, @photo_data, @recorded_by, datetime('now'))
  ON CONFLICT(awb) DO UPDATE SET
    recipient_name   = excluded.recipient_name,
    recipient_mobile = excluded.recipient_mobile,
    notes            = excluded.notes,
    signature_data   = excluded.signature_data,
    photo_data       = excluded.photo_data,
    recorded_by      = excluded.recorded_by,
    recorded_at      = datetime('now')
`)
const getPOD = db.prepare('SELECT * FROM proof_of_delivery WHERE awb = ?')

const markDelivered = db.prepare(`
  UPDATE shipments SET status = 'Delivered', updated_at = datetime('now') WHERE awb = ?
`)
const insertPODEvent = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)
const getShipmentForPOD = db.prepare('SELECT * FROM shipments WHERE awb = ?')

// Partner shipments (created via partner API)
const listPartnerShipments = db.prepare(`
  SELECT s.*, k.partner_name
  FROM   shipments s
  LEFT   JOIN api_keys k ON k.id = s.partner_id
  ORDER  BY s.created_at DESC
`)
const getPartnerShipment = db.prepare(`
  SELECT s.*, k.partner_name
  FROM   shipments s
  LEFT   JOIN api_keys k ON k.id = s.partner_id
  WHERE  s.awb = ?
`)
const getShipmentEvents = db.prepare(`
  SELECT * FROM tracking_events WHERE awb = ? ORDER BY created_at ASC
`)
const insertKey  = db.prepare(`
  INSERT INTO api_keys (id, partner_name, api_key, status)
  VALUES (@id, @partner_name, @api_key, 'active')
`)
const revokeKey  = db.prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ?")
const getKeyById = db.prepare('SELECT * FROM api_keys WHERE id = ?')

// ── Shared shape helper ───────────────────────────────────────────────────────
function fmtShipment(r) {
  const APP_URL = process.env.APP_URL || 'http://163.245.221.133'
  return {
    awb              : r.awb,
    partner_id       : r.partner_id,
    partner_name     : r.partner_name || r.partner_id,
    partner_reference: r.partner_reference,
    status           : r.status,
    service_type     : r.service_type,
    hawb             : r.hawb || r.awb,
    mawb             : r.mawb || null,
    origin_carrier   : r.origin_carrier || null,
    delivery_method  : r.delivery_method || 'domestic_courier',
    payment_status   : r.payment_status || 'pending',
    payment_amount   : r.payment_amount || null,
    payment_currency : r.payment_currency || 'ZMW',
    payment_method   : r.payment_method || null,
    payment_paid_at  : r.payment_paid_at || null,
    customer_id      : r.customer_id || null,
    tracking_url     : `${APP_URL}/track/${r.hawb || r.awb}`,
    sender: {
      name   : r.sender_name,
      phone  : r.sender_phone,
      address: r.sender_address,
      city   : r.sender_city,
      country: r.sender_country,
    },
    receiver: {
      name   : r.receiver_name,
      phone  : r.receiver_phone,
      address: r.receiver_address,
      city   : r.receiver_city,
      country: r.receiver_country,
    },
    package: {
      weight     : r.weight,
      length     : r.length,
      width      : r.width,
      height     : r.height,
      quantity   : r.quantity,
      description: r.description,
      value      : r.value,
      currency   : r.currency,
    },
    kyc_hold  : r.kyc_hold === 1 || r.kyc_hold === true,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

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

// ── GET /api/v1/admin/shipments ──────────────────────────────────────────────
// Returns all shipments created via the partner API, with partner name attached.
// Optional query params: ?partner_id=KEY_XXX  ?status=Booked  ?limit=50  ?offset=0
router.get('/shipments', (req, res) => {
  const { partner_id, status, limit = 100, offset = 0 } = req.query

  // Build a dynamic query
  let sql = `
    SELECT s.*, k.partner_name
    FROM   shipments s
    LEFT   JOIN api_keys k ON k.id = s.partner_id
    WHERE  s.partner_id IS NOT NULL
  `
  const params = []

  if (partner_id) {
    sql += ' AND s.partner_id = ?'
    params.push(partner_id)
  }
  if (status) {
    sql += ' AND s.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const rows = db.prepare(sql).all(...params)

  // Count total (without LIMIT)
  let countSql = `
    SELECT COUNT(*) as total
    FROM   shipments s
    WHERE  s.partner_id IS NOT NULL
  `
  const countParams = []
  if (partner_id) { countSql += ' AND s.partner_id = ?'; countParams.push(partner_id) }
  if (status)     { countSql += ' AND s.status = ?';     countParams.push(status) }

  const { total } = db.prepare(countSql).get(...countParams)

  return res.json({
    total,
    limit  : Number(limit),
    offset : Number(offset),
    shipments: rows.map(r => fmtShipment(r)),
  })
})

// ── GET /api/v1/admin/shipments/:awb ─────────────────────────────────────────
router.get('/shipments/:awb', (req, res) => {
  const row = getPartnerShipment.get(req.params.awb)

  if (!row) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `Shipment ${req.params.awb} not found.`,
    })
  }

  const events = getShipmentEvents.all(req.params.awb)

  // Fetch customer if linked
  const customer = row.customer_id
    ? db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id)
    : null

  return res.json({
    ...fmtShipment(row),
    tracking_events: events,
    customer        : customer ? {
      id            : customer.id,
      name          : customer.name,
      phone         : customer.phone,
      email         : customer.email,
      account_status: customer.account_status,
      wallet_balance: customer.wallet_balance,
      profile_complete: customer.profile_complete,
      kyc_status    : customer.kyc_status || 'not_started',
    } : null,
  })
})

// ── PATCH /api/v1/admin/shipments/:awb — Update shipment fields (e.g. kyc_hold) ─
router.patch('/shipments/:awb', (req, res) => {
  const row = db.prepare('SELECT awb FROM shipments WHERE awb = ?').get(req.params.awb)
  if (!row) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Shipment ${req.params.awb} not found.` })
  }

  const allowed = ['kyc_hold', 'status', 'payment_status']
  const updates = []
  const vals    = []
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`)
      vals.push(req.body[key])
    }
  }
  if (updates.length === 0) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'No updatable fields provided.' })
  }
  updates.push("updated_at = datetime('now')")
  vals.push(req.params.awb)
  db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE awb = ?`).run(...vals)
  const updated = db.prepare(`SELECT s.*, k.partner_name FROM shipments s LEFT JOIN api_keys k ON k.id = s.partner_id WHERE s.awb = ?`).get(req.params.awb)
  return res.json({ success: true, shipment: fmtShipment(updated) })
})

// ── POST /api/v1/admin/pod/:awb — Record proof of delivery ────────────────────
router.post('/pod/:awb', (req, res) => {
  const { awb } = req.params
  const { recipient_name, recipient_mobile, notes, signature_data, photo_data, recorded_by } = req.body || {}

  if (!recipient_name || !recipient_name.trim()) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'recipient_name is required.',
      fields : { recipient_name: 'Required' },
    })
  }

  if (!signature_data) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'signature_data is required.',
      fields : { signature_data: 'Required' },
    })
  }

  const now     = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 5)

  db.transaction(() => {
    upsertPOD.run({
      awb,
      recipient_name  : recipient_name.trim(),
      recipient_mobile: recipient_mobile || null,
      notes           : notes           || null,
      signature_data,
      photo_data      : photo_data      || null,
      recorded_by     : recorded_by     || 'ops',
    })

    // Only update shipment + insert event if the shipment exists in DB (partner API shipments)
    const shipment = getShipmentForPOD.get(awb)
    if (shipment && shipment.status !== 'Delivered') {
      markDelivered.run(awb)
      insertPODEvent.run({
        awb,
        activity  : 'Delivered',
        details   : `Signed by ${recipient_name.trim()}${recipient_mobile ? ' (' + recipient_mobile + ')' : ''}${notes ? ' — ' + notes : ''}`,
        status    : 'Delivered',
        city      : shipment.receiver_city || '',
        date      : dateStr,
        time      : timeStr,
        new_status: 'D',
        source    : 'pod',
      })
    }
  })()

  // Fire 'delivered' notification + SMS (non-blocking)
  const shipment = getShipmentForPOD.get(awb)
  if (shipment) {
    sendNotification('delivered', shipment, { recipient: recipient_name.trim(), date: dateStr })
      .catch(err => console.error('[notifications] POD delivered email error:', err.message))
    sendShipmentSMS(shipment, 'delivered')
      .catch(err => console.error('[sms] POD delivered SMS error:', err.message))
  }

  const pod = getPOD.get(awb)
  return res.status(201).json({ success: true, awb, pod })
})

// ── GET /api/v1/admin/pod/:awb — Retrieve proof of delivery ──────────────────
router.get('/pod/:awb', (req, res) => {
  const pod = getPOD.get(req.params.awb)

  if (!pod) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `No proof of delivery found for ${req.params.awb}.`,
    })
  }

  return res.json({ pod })
})

// ── Notification settings prepared statements ─────────────────────────────────
const getAllNotifSettings = db.prepare('SELECT key, value FROM notification_settings')
const upsertNotifSetting  = db.prepare(
  'INSERT INTO notification_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
)

// ── GET /api/v1/admin/notifications/settings ─────────────────────────────────
router.get('/notifications/settings', (req, res) => {
  try {
    const rows     = getAllNotifSettings.all()
    const settings = {}
    rows.forEach((r) => { settings[r.key] = r.value })
    return res.json({ settings })
  } catch (err) {
    return res.status(500).json({ error: 'DB_ERROR', message: err.message })
  }
})

// ── PUT /api/v1/admin/notifications/settings ─────────────────────────────────
router.put('/notifications/settings', (req, res) => {
  const updates = req.body
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'INVALID_BODY', message: 'Body must be a key/value object.' })
  }
  try {
    const upsertMany = db.transaction((obj) => {
      for (const [key, value] of Object.entries(obj)) {
        upsertNotifSetting.run(key, String(value ?? ''))
      }
    })
    upsertMany(updates)
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'DB_ERROR', message: err.message })
  }
})

// ── POST /api/v1/admin/notifications/test ────────────────────────────────────
router.post('/notifications/test', async (req, res) => {
  const { to } = req.body
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Provide a valid "to" email address.' })
  }
  try {
    const result = await sendTestEmail(to.trim())
    return res.json({ success: true, messageId: result.messageId })
  } catch (err) {
    return res.status(500).json({ error: 'SMTP_ERROR', message: err.message })
  }
})

module.exports = router
