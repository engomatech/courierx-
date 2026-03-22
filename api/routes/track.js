/**
 * Public Tracking Route — no authentication required
 *
 * GET /api/v1/track/:ref
 *   Accepts AWB, HAWB, or MAWB — resolves to the shipment and returns
 *   full tracking journey in DPEX-compatible format.
 *   Called by the public /track/:hawb page — no X-API-Key needed.
 */

const express = require('express')
const db      = require('../db')

const router = express.Router()

const getByAwb  = db.prepare('SELECT * FROM shipments WHERE awb = ?')
const getByHawb = db.prepare('SELECT * FROM shipments WHERE hawb = ? OR awb = ? LIMIT 1')
const getByMawb = db.prepare('SELECT * FROM shipments WHERE mawb = ? LIMIT 1')
const getEvents = db.prepare(
  'SELECT * FROM tracking_events WHERE awb = ? ORDER BY id ASC'
)

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

router.get('/:ref', (req, res) => {
  const ref = req.params.ref.trim()

  // Resolve: AWB → HAWB → MAWB
  let shipment = getByAwb.get(ref)
  if (!shipment) shipment = getByHawb.get(ref, ref)
  if (!shipment) shipment = getByMawb.get(ref)

  if (!shipment) {
    return res.status(404).json({
      error  : 'NOT_FOUND',
      message: `Tracking reference "${ref}" not found. Please check your tracking number and try again.`,
    })
  }

  const events = getEvents.all(shipment.awb)
  const latest = events[events.length - 1] || {}

  // DPEX-compatible value array
  const value = events.map(evt => ({
    slip_no      : evt.awb,
    new_status   : evt.new_status || STATUS_CODES[evt.status] || '',
    time         : evt.time       || '',
    date         : evt.date       || '',
    Activites    : evt.activity,        // intentional DPEX typo
    Details      : evt.details   || '',
    Cancel_resion: null,                // intentional DPEX typo
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
    delivery_method : shipment.delivery_method || 'domestic_courier',
    'Current Status': shipment.status,
    current_location: latest.city || '',
    payment_status  : shipment.payment_status || 'pending',
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
    value,
  })
})

module.exports = router
