/**
 * Notifications Routes — SMTP config + trigger settings + send endpoints
 *
 * GET    /api/v1/admin/notifications/settings  — get all notification settings
 * PUT    /api/v1/admin/notifications/settings  — save settings (SMTP + toggles)
 * POST   /api/v1/admin/notifications/test      — send test email
 * POST   /api/v1/admin/notifications/send      — send notification for an event (called from React UI)
 */

const express = require('express')
const db      = require('../db')
const { sendNotification, sendTestEmail } = require('../mailer')

const router = express.Router()

// Keys that are safe to return to the frontend (password excluded or masked)
const PUBLIC_KEYS = [
  'smtp_host', 'smtp_port', 'smtp_encryption', 'smtp_user',
  'smtp_from_name', 'smtp_from_email', 'ops_notify_email',
  'notify_booked', 'notify_out_for_delivery', 'notify_delivered',
  'notify_delivery_failed', 'notify_return',
]

// Keys that store sensitive data (masked in GET)
const SECRET_KEYS = ['smtp_pass']

// ── Prepared statements ──────────────────────────────────────────────────────
const upsertSetting = db.prepare(
  'INSERT OR REPLACE INTO notification_settings (key, value) VALUES (?, ?)'
)
const getSetting = db.prepare('SELECT value FROM notification_settings WHERE key = ?')
const getAllSettings = db.prepare('SELECT key, value FROM notification_settings')

// ── GET /api/v1/admin/notifications/settings ─────────────────────────────────
router.get('/settings', (req, res) => {
  const rows    = getAllSettings.all()
  const obj     = {}
  rows.forEach(r => { obj[r.key] = r.value })

  // Mask password
  if (obj.smtp_pass) obj.smtp_pass = '••••••••'

  // Return defaults for any missing keys
  const defaults = {
    smtp_host: '', smtp_port: '587', smtp_encryption: 'TLS',
    smtp_user: '', smtp_pass: '', smtp_from_name: 'Online Express',
    smtp_from_email: '', ops_notify_email: '',
    notify_booked: '1', notify_out_for_delivery: '1',
    notify_delivered: '1', notify_delivery_failed: '1', notify_return: '1',
  }

  return res.json({ settings: { ...defaults, ...obj } })
})

// ── PUT /api/v1/admin/notifications/settings ─────────────────────────────────
router.put('/settings', (req, res) => {
  const body = req.body || {}
  const allowed = [...PUBLIC_KEYS, ...SECRET_KEYS]

  const saveMany = db.transaction((entries) => {
    for (const [key, value] of entries) {
      // Don't overwrite password if the masked placeholder is sent back
      if (key === 'smtp_pass' && value === '••••••••') continue
      upsertSetting.run(key, value ?? '')
    }
  })

  const entries = Object.entries(body).filter(([k]) => allowed.includes(k))
  saveMany(entries)

  return res.json({ success: true, message: 'Notification settings saved.' })
})

// ── POST /api/v1/admin/notifications/test ────────────────────────────────────
router.post('/test', async (req, res) => {
  const { to } = req.body || {}
  if (!to) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'to email is required.' })
  }
  try {
    const result = await sendTestEmail(to)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'SMTP_ERROR', message: err.message })
  }
})

// ── POST /api/v1/admin/notifications/send ────────────────────────────────────
// Called from the React UI store when a shipment status is updated.
// Body: { event, awb, sender_email?, receiver_email?, details? }
router.post('/send', async (req, res) => {
  const { event, awb, sender_email, receiver_email, details } = req.body || {}

  if (!event || !awb) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'event and awb are required.' })
  }

  // Look up the shipment
  const shipment = db.prepare('SELECT * FROM shipments WHERE awb = ?').get(awb)

  // Build a minimal shipment object — merge DB data with any provided emails
  const s = {
    awb,
    service_type  : shipment?.service_type || '',
    sender_name   : shipment?.sender_name || '',
    sender_city   : shipment?.sender_city || '',
    sender_country: shipment?.sender_country || '',
    sender_email  : sender_email || shipment?.sender_email || '',
    receiver_name : shipment?.receiver_name || '',
    receiver_city : shipment?.receiver_city || '',
    receiver_country: shipment?.receiver_country || '',
    receiver_address: shipment?.receiver_address || '',
    receiver_email: receiver_email || shipment?.receiver_email || '',
    weight        : shipment?.weight,
    quantity      : shipment?.quantity,
    partner_reference: shipment?.partner_reference || '',
  }

  try {
    const result = await sendNotification(event, s, details || {})
    return res.json(result)
  } catch (err) {
    // Don't fail the whole request if email sending fails — just log it
    console.error('[notifications] send error:', err.message)
    return res.status(500).json({ error: 'SEND_ERROR', message: err.message })
  }
})

module.exports = router
