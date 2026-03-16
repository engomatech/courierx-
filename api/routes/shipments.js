/**
 * Shipments Routes
 *
 * POST /api/v1/shipments  — CreateShipment
 * GET  /api/v1/shipments/:awb — GetShipment
 */

const express = require('express')
const db      = require('../db')

const router = express.Router()

// ── AWB generator: CX + 10 random digits ────────────────────────────────────
function generateAwb() {
  const digits = Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000
  return `CX${digits}`
}

// ── Prepared statements ──────────────────────────────────────────────────────
const insertShipment = db.prepare(`
  INSERT INTO shipments
    (awb, partner_id, status, service_type,
     sender_name, sender_phone, sender_address, sender_city, sender_country,
     receiver_name, receiver_phone, receiver_address, receiver_city, receiver_country,
     weight, length, width, height, quantity, description, value, currency)
  VALUES
    (@awb, @partner_id, @status, @service_type,
     @sender_name, @sender_phone, @sender_address, @sender_city, @sender_country,
     @receiver_name, @receiver_phone, @receiver_address, @receiver_city, @receiver_country,
     @weight, @length, @width, @height, @quantity, @description, @value, @currency)
`)

const insertFirstEvent = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)

const getShipment = db.prepare('SELECT * FROM shipments WHERE awb = ?')

// ── POST /api/v1/shipments ───────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { service_type, sender = {}, receiver = {}, package: pkg = {} } = req.body || {}

  // ── Validation ──────────────────────────────────────────────────────────
  const missing = {}
  if (!service_type)       missing.service_type       = 'Required'
  if (!sender.name)        missing['sender.name']     = 'Required'
  if (!sender.phone)       missing['sender.phone']    = 'Required'
  if (!sender.address)     missing['sender.address']  = 'Required'
  if (!sender.city)        missing['sender.city']     = 'Required'
  if (!receiver.name)      missing['receiver.name']   = 'Required'
  if (!receiver.phone)     missing['receiver.phone']  = 'Required'
  if (!receiver.address)   missing['receiver.address']= 'Required'
  if (!receiver.city)      missing['receiver.city']   = 'Required'
  if (!pkg.weight)         missing['package.weight']  = 'Required'

  if (Object.keys(missing).length > 0) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'One or more required fields are missing.',
      fields : missing,
    })
  }

  // ── Generate AWB (retry once on collision) ──────────────────────────────
  let awb = generateAwb()
  if (getShipment.get(awb)) awb = generateAwb()

  // ── Today's date/time for the first tracking event ─────────────────────
  const now     = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 5)

  // ── Write shipment + first event in a transaction ───────────────────────
  const createShipmentTx = db.transaction(() => {
    insertShipment.run({
      awb,
      partner_id      : req.partner?.id || null,
      status          : 'Booked',
      service_type,
      sender_name     : sender.name    || '',
      sender_phone    : sender.phone   || '',
      sender_address  : sender.address || '',
      sender_city     : sender.city    || '',
      sender_country  : sender.country || 'Zambia',
      receiver_name   : receiver.name    || '',
      receiver_phone  : receiver.phone   || '',
      receiver_address: receiver.address || '',
      receiver_city   : receiver.city    || '',
      receiver_country: receiver.country || 'Zambia',
      weight    : pkg.weight   || 0,
      length    : pkg.length   || 0,
      width     : pkg.width    || 0,
      height    : pkg.height   || 0,
      quantity  : pkg.quantity || 1,
      description: pkg.description || '',
      value     : pkg.value    || 0,
      currency  : pkg.currency || 'ZMW',
    })

    insertFirstEvent.run({
      awb,
      activity   : 'Shipment Booked',
      details    : 'Shipment created via API',
      status     : 'Booked',
      city       : sender.city || '',
      date       : dateStr,
      time       : timeStr,
      new_status : 'B',
      source     : 'system',
    })
  })

  createShipmentTx()

  const created = getShipment.get(awb)

  return res.status(201).json({
    success   : true,
    awb       : created.awb,
    status    : created.status,
    created_at: created.created_at,
  })
})

// ── GET /api/v1/shipments/:awb ───────────────────────────────────────────────
router.get('/:awb', (req, res) => {
  const row = getShipment.get(req.params.awb)

  if (!row) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `Shipment ${req.params.awb} not found.`,
    })
  }

  return res.json({
    awb         : row.awb,
    status      : row.status,
    service_type: row.service_type,
    sender: {
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
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
})

module.exports = router
