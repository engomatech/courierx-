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

// Map full status → DPEX new_status short code
const STATUS_CODES = {
  'Booked'           : 'B',
  'Picked Up'        : 'P',
  'In Hub'           : 'H',
  'In Transit'       : 'T',
  'Out for Delivery' : 'O',
  'Delivered'        : 'D',
  'Delivery Failed'  : 'F',
  'NDR'              : 'N',
  'Return'           : 'R',
  'Cancelled'        : 'C',
  'On Hold'          : 'X',
}

// ── GET /api/v1/tracking/:awb — public, no auth, accepts AWB or HAWB ─────────
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

  // Fire notification email (async, non-blocking — never fail the API response)
  const event = mapStatusToEvent(newStatus)
  if (event) {
    sendNotification(event, shipment, { reason: details, city, date: dateStr })
      .catch(err => console.error('[notifications] tracking push email error:', err.message))
  }

  return res.json({
    success   : true,
    awb       : req.params.awb,
    new_status: newStatus,
    message   : `Tracking event "${activity}" recorded successfully.`,
  })
})

module.exports = router
