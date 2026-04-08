/**
 * Tracking Routes
 *
 * GET  /api/v1/tracking/:awb  — TrackShipment
 *   Returns tracking events in DPEX-compatible format so any partner
 *   that already parses DPEX responses can consume this endpoint unchanged.
 *
 * POST /api/v1/tracking/:awb  — PushTracking
 *   Partners push status updates (e.g. "Out for Delivery") into Online Express.
 */

const express = require('express')
const db      = require('../db')
const { sendNotification, mapStatusToEvent } = require('../mailer')
const { sendShipmentSMS } = require('../sms')

const router = express.Router()

// ── Prepared statements ──────────────────────────────────────────────────────
const getShipment     = db.prepare('SELECT * FROM shipments WHERE awb = ?')
const getByHawb       = db.prepare('SELECT * FROM shipments WHERE hawb = ? OR awb = ? LIMIT 1')
const getByMawb       = db.prepare('SELECT * FROM shipments WHERE mawb = ?')
const getEvents       = db.prepare(
  'SELECT * FROM tracking_events WHERE awb = ? ORDER BY id ASC'
)
const insertEvent = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)
const updateShipment = db.prepare(`
  UPDATE shipments
  SET status = @status, updated_at = datetime('now')
  WHERE awb = @awb
`)

// ── Status / Activity reference ───────────────────────────────────────────────
// Full list of supported statuses + DPEX-compatible short codes.
// Partners can push any activity string; code is auto-derived from the maps below.
const STATUS_REFERENCE = [
  { status: 'Booked',            code: 'BKD', activity: 'SHIPMENT CREATED',    description: 'Shipment booked and AWB assigned' },
  { status: 'Confirmed',         code: 'CNF', activity: 'SHIPMENT CONFIRMED',   description: 'Booking confirmed by operations' },
  { status: 'Picked Up',         code: 'PKU', activity: 'PICKED UP',            description: 'Shipment collected from sender' },
  { status: 'Origin Scanned',    code: 'OSC', activity: 'ORIGIN SCAN',          description: 'Scanned into origin warehouse' },
  { status: 'In Hub',            code: 'HUB', activity: 'IN HUB',               description: 'At origin hub, being processed' },
  { status: 'In Transit',        code: 'TRS', activity: 'IN TRANSIT',           description: 'Dispatched — in transit to destination hub' },
  { status: 'Hub Inbound',       code: 'HIB', activity: 'HUB INBOUND',          description: 'Arrived at destination hub' },
  { status: 'Out for Delivery',  code: 'OFD', activity: 'OUT FOR DELIVERY',     description: 'With delivery driver — out for delivery' },
  { status: 'Delivered',         code: 'DLV', activity: 'DELIVERED',            description: 'Successfully delivered to receiver' },
  { status: 'Delivery Failed',   code: 'DFL', activity: 'DELIVERY FAILED',      description: 'Delivery attempt failed' },
  { status: 'Non-Delivery',      code: 'NDR', activity: 'NON-DELIVERY',         description: 'Non-delivery reason recorded' },
  { status: 'Return to Sender',  code: 'RTS', activity: 'RETURN TO SENDER',     description: 'Returning shipment to original sender' },
  { status: 'Returned',          code: 'RTD', activity: 'RETURNED',             description: 'Shipment returned to sender' },
  { status: 'On Hold',           code: 'HLD', activity: 'ON HOLD',              description: 'Shipment held — pending resolution' },
  { status: 'Cancelled',         code: 'CXL', activity: 'CANCELLED',            description: 'Shipment cancelled' },
  { status: 'Customs Hold',      code: 'CSH', activity: 'CUSTOMS HOLD',         description: 'Held by customs for inspection/clearance' },
  { status: 'Customs Cleared',   code: 'CSC', activity: 'CUSTOMS CLEARED',      description: 'Released from customs — resuming delivery' },
  { status: 'Damaged',           code: 'DMG', activity: 'DAMAGED',              description: 'Shipment reported as damaged' },
  { status: 'Lost',              code: 'LST', activity: 'LOST',                 description: 'Shipment reported as lost' },
]

// Lookup: status name or existing code → normalised 3-letter code
const STATUS_CODES = {}
STATUS_REFERENCE.forEach(function(s) {
  STATUS_CODES[s.status]   = s.code
  STATUS_CODES[s.code]     = s.code      // accept code directly (e.g. 'OFD' → 'OFD')
  STATUS_CODES[s.activity] = s.code      // accept activity string too
})

// ── GET /api/v1/tracking/statuses — full status reference list ───────────────
// Returns all valid status codes, activity strings, and descriptions.
// Partners use this to map Online Express statuses to their own tracking events (e.g. DPEX).
router.get('/statuses', (req, res) => {
  return res.json({
    description: 'Full list of Online Express tracking statuses and their DPEX-compatible codes.',
    note       : 'Use the "code" value as new_status when pushing tracking events via POST /api/v1/tracking/:awb',
    statuses   : STATUS_REFERENCE,
  })
})

// ── GET /api/v1/tracking/:awb ─────────────────────────────────────────────────
router.get('/:awb', (req, res) => {
  const ref = req.params.awb
  // Try AWB first, then HAWB
  let shipment = getShipment.get(ref) || getByHawb.get(ref, ref)

  if (!shipment) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `AWB ${req.params.awb} not found.`,
    })
  }

  // ── Partner isolation: a partner may only query their own shipments ──────────
  // Prevents MailAmericas querying DPEX AWBs and vice versa.
  if (shipment.partner_id && req.partner && shipment.partner_id !== req.partner.id) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `AWB ${req.params.awb} not found.`,   // deliberate — don't confirm existence
    })
  }

  const events = getEvents.all(req.params.awb)

  // Most recent event = current location + status
  const latest = events[events.length - 1] || {}

  // Build DPEX-compatible value array (ascending order — same as DPEX)
  const value = events.map(evt => ({
    slip_no      : evt.awb,
    new_status   : evt.new_status || STATUS_CODES[evt.status] || '',
    time         : evt.time       || '',
    date         : evt.date       || '',
    Activites    : evt.activity,     // intentional DPEX typo
    Details      : evt.details   || '',
    Cancel_resion: null,             // intentional DPEX typo
    city         : evt.city      || '',
    Status       : evt.status    || '',
  }))

  return res.json({
    status          : 200,
    message         : 'Data successfully!',
    'AWB NO'        : shipment.awb,
    hawb            : shipment.hawb || shipment.awb,
    mawb            : shipment.mawb || null,
    origin_carrier  : shipment.origin_carrier || null,
    'Current Status': shipment.status,
    current_location: latest.city || '',
    sender: {
      name   : shipment.sender_name,
      city   : shipment.sender_city,
      country: shipment.sender_country,
    },
    receiver: {
      name   : shipment.receiver_name,
      city   : shipment.receiver_city,
      country: shipment.receiver_country,
    },
    payment_status  : shipment.payment_status || 'pending',
    delivery_method : shipment.delivery_method || 'domestic_courier',
    value,
  })
})

// ── POST /api/v1/tracking/:awb ───────────────────────────────────────────────
router.post('/:awb', (req, res) => {
  const shipment = getShipment.get(req.params.awb)

  if (!shipment) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `AWB ${req.params.awb} not found.`,
    })
  }

  // ── Partner isolation ────────────────────────────────────────────────────────
  if (shipment.partner_id && req.partner && shipment.partner_id !== req.partner.id) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `AWB ${req.params.awb} not found.`,
    })
  }

  const { activity, details, status, city, date, time } = req.body || {}

  if (!activity) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'activity is required.',
      fields : { activity: 'Required' },
    })
  }

  // Use provided date/time or default to now
  const now     = new Date()
  const dateStr = date || now.toISOString().slice(0, 10)
  const timeStr = time || now.toTimeString().slice(0, 5)
  const newStatus = status || activity

  // Derive short code if status matches known map
  const newStatusCode = STATUS_CODES[newStatus] || ''

  const pushTrackingTx = db.transaction(() => {
    insertEvent.run({
      awb        : req.params.awb,
      activity,
      details    : details   || '',
      status     : newStatus,
      city       : city      || '',
      date       : dateStr,
      time       : timeStr,
      new_status : newStatusCode,
      source     : 'partner',
    })
    updateShipment.run({ status: newStatus, awb: req.params.awb })
  })

  pushTrackingTx()

  // Fire notification email + SMS (async, non-blocking — never fail the API response)
  const event = mapStatusToEvent(newStatus)
  if (event) {
    sendNotification(event, shipment, { reason: details, city, date: dateStr })
      .catch(err => console.error('[notifications] tracking push email error:', err.message))
    sendShipmentSMS(shipment, event)
      .catch(err => console.error('[sms] tracking push SMS error:', err.message))
  }

  return res.json({
    success   : true,
    awb       : req.params.awb,
    new_status: newStatus,
    message   : `Tracking event "${activity}" recorded successfully.`,
  })
})

module.exports = router
