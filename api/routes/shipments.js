/**
 * Partner Shipments API
 *
 * POST   /api/v1/shipments            — Create a shipment (partner e-commerce)
 * GET    /api/v1/shipments            — List partner's own shipments (paginated)
 * GET    /api/v1/shipments/:awb       — Get a single shipment + tracking events
 * GET    /api/v1/shipments/:awb/label — Label data for printing
 *
 * All routes require X-API-Key header (enforced by auth middleware).
 */

const express = require('express')
const db      = require('../db')
const { sendNotification } = require('../mailer')
const router  = express.Router()

/* ── AWB Generator: OEX-YYYY-NNNNN sequential ─────────────────────────────── */
const countByYear = db.prepare("SELECT COUNT(*) as n FROM shipments WHERE awb LIKE ?")

function generateAwb() {
  const year = new Date().getFullYear()
  const row  = countByYear.get(`OEX-${year}-%`)
  const seq  = String((row?.n || 0) + 1).padStart(5, '0')
  return `OEX-${year}-${seq}`
}

/* ── Prepared statements ──────────────────────────────────────────────────── */
const insertShipment = db.prepare(`
  INSERT INTO shipments
    (awb, partner_id, partner_reference, status, service_type,
     sender_name, sender_phone, sender_address, sender_city, sender_country, sender_email,
     receiver_name, receiver_phone, receiver_address, receiver_city, receiver_country, receiver_email,
     weight, length, width, height, quantity, description, value, currency)
  VALUES
    (@awb, @partner_id, @partner_reference, @status, @service_type,
     @sender_name, @sender_phone, @sender_address, @sender_city, @sender_country, @sender_email,
     @receiver_name, @receiver_phone, @receiver_address, @receiver_city, @receiver_country, @receiver_email,
     @weight, @length, @width, @height, @quantity, @description, @value, @currency)
`)

const insertEvent = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)

const getOne    = db.prepare('SELECT * FROM shipments WHERE awb = ?')
const getOwn    = db.prepare('SELECT * FROM shipments WHERE partner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
const countOwn  = db.prepare('SELECT COUNT(*) as n FROM shipments WHERE partner_id = ?')
const getEvents = db.prepare('SELECT * FROM tracking_events WHERE awb = ? ORDER BY date DESC, time DESC')
const updateStatus = db.prepare("UPDATE shipments SET status = ?, updated_at = datetime('now') WHERE awb = ?")

/* ── Format DB row into API response shape ───────────────────────────────── */
function fmt(row, withEvents) {
  const base = process.env.APP_URL || 'http://163.245.221.133'
  const obj  = {
    awb              : row.awb,
    partner_reference: row.partner_reference || null,
    status           : row.status,
    service_type     : row.service_type,
    sender  : {
      name   : row.sender_name,
      phone  : row.sender_phone,
      address: row.sender_address,
      city   : row.sender_city,
      country: row.sender_country,
    },
    receiver: {
      name   : row.receiver_name,
      phone  : row.receiver_phone,
      address: row.receiver_address,
      city   : row.receiver_city,
      country: row.receiver_country,
    },
    package: {
      weight     : row.weight,
      length     : row.length,
      width      : row.width,
      height     : row.height,
      quantity   : row.quantity,
      description: row.description,
      value      : row.value,
      currency   : row.currency,
    },
    tracking_url: base + '/track?awb=' + row.awb,
    label_url   : '/api/v1/shipments/' + row.awb + '/label',
    created_at  : row.created_at,
    updated_at  : row.updated_at,
  }
  if (withEvents) {
    obj.events = getEvents.all(row.awb).map(function(e) {
      return { activity: e.activity, details: e.details, status: e.status, city: e.city, date: e.date, time: e.time }
    })
  }
  return obj
}

/* ── POST /api/v1/shipments — Create shipment ────────────────────────────── */
router.post('/', function(req, res) {
  var body             = req.body || {}
  var service_type     = body.service_type
  var partner_reference = body.partner_reference
  var sender           = body.sender   || {}
  var receiver         = body.receiver || {}
  var pkg              = body.package  || {}

  var missing = {}
  if (!service_type)     missing.service_type        = 'Required'
  if (!sender.name)      missing['sender.name']      = 'Required'
  if (!sender.phone)     missing['sender.phone']     = 'Required'
  if (!sender.address)   missing['sender.address']   = 'Required'
  if (!sender.city)      missing['sender.city']      = 'Required'
  if (!receiver.name)    missing['receiver.name']    = 'Required'
  if (!receiver.phone)   missing['receiver.phone']   = 'Required'
  if (!receiver.address) missing['receiver.address'] = 'Required'
  if (!receiver.city)    missing['receiver.city']    = 'Required'
  if (!pkg.weight)       missing['package.weight']   = 'Required'

  if (Object.keys(missing).length) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Required fields missing.', fields: missing })
  }

  var awb     = generateAwb()
  var now     = new Date()
  var dateStr = now.toISOString().slice(0, 10)
  var timeStr = now.toTimeString().slice(0, 5)

  db.transaction(function() {
    insertShipment.run({
      awb              : awb,
      partner_id       : (req.partner && req.partner.id) ? req.partner.id : null,
      partner_reference: partner_reference || null,
      status           : 'Booked',
      service_type     : service_type,
      sender_name      : sender.name    || '',
      sender_phone     : sender.phone   || '',
      sender_address   : sender.address || '',
      sender_city      : sender.city    || '',
      sender_country   : sender.country || 'Zambia',
      sender_email     : sender.email   || null,
      receiver_name    : receiver.name    || '',
      receiver_phone   : receiver.phone   || '',
      receiver_address : receiver.address || '',
      receiver_city    : receiver.city    || '',
      receiver_country : receiver.country || 'Zambia',
      receiver_email   : receiver.email   || null,
      weight     : pkg.weight      || 0,
      length     : pkg.length      || 0,
      width      : pkg.width       || 0,
      height     : pkg.height      || 0,
      quantity   : pkg.quantity    || 1,
      description: pkg.description || '',
      value      : pkg.value       || 0,
      currency   : pkg.currency    || 'ZMW',
    })
    insertEvent.run({
      awb       : awb,
      activity  : 'Shipment Booked',
      details   : partner_reference ? 'Booked via API - Partner ref: ' + partner_reference : 'Created via Partner API',
      status    : 'Booked',
      city      : sender.city || '',
      date      : dateStr,
      time      : timeStr,
      new_status: 'B',
      source    : 'partner_api',
    })
  })()

  const created = getOne.get(awb)

  // Fire booking confirmation email (non-blocking)
  sendNotification('booked', created)
    .catch(err => console.error('[notifications] booking email error:', err.message))

  return res.status(201).json({ success: true, message: 'Shipment created successfully.', ...fmt(created) })
})

/* ── GET /api/v1/shipments — List partner shipments ─────────────────────── */
router.get('/', function(req, res) {
  var pid    = req.partner && req.partner.id
  var page   = Math.max(1, parseInt(req.query.page  || '1',  10))
  var limit  = Math.min(100, parseInt(req.query.limit || '20', 10))
  var offset = (page - 1) * limit
  var total  = (countOwn.get(pid) || { n: 0 }).n
  var rows   = getOwn.all(pid, limit, offset)
  return res.json({
    shipments : rows.map(function(r) { return fmt(r, false) }),
    pagination: { page: page, limit: limit, total: total, total_pages: Math.ceil(total / limit) },
  })
})

/* ── GET /api/v1/shipments/:awb — Single shipment with events ────────────── */
router.get('/:awb', function(req, res) {
  var row = getOne.get(req.params.awb)
  if (!row) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Shipment ' + req.params.awb + ' not found.' })
  }
  if (row.partner_id && req.partner && row.partner_id !== req.partner.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this shipment.' })
  }
  return res.json(fmt(row, true))
})

/* ── GET /api/v1/shipments/:awb/label — Label data ───────────────────────── */
router.get('/:awb/label', function(req, res) {
  var row = getOne.get(req.params.awb)
  if (!row) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Shipment not found.' })
  }
  if (row.partner_id && req.partner && row.partner_id !== req.partner.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied.' })
  }
  var base = process.env.APP_URL || 'http://163.245.221.133'
  return res.json({
    label: {
      awb         : row.awb,
      service_type: row.service_type,
      barcode     : row.awb,
      qr_data     : base + '/track?awb=' + row.awb,
      from: {
        name   : row.sender_name,
        phone  : row.sender_phone,
        address: row.sender_address,
        city   : row.sender_city,
        country: row.sender_country,
      },
      to: {
        name   : row.receiver_name,
        phone  : row.receiver_phone,
        address: row.receiver_address,
        city   : row.receiver_city,
        country: row.receiver_country,
      },
      weight     : row.weight,
      quantity   : row.quantity,
      description: row.description,
      created_at : row.created_at,
    },
  })
})

module.exports = router
