/**
 * Payment Gate Routes — PMS core enforcement
 *
 * GET    /api/v1/admin/payments/:awb          — get payment status for a shipment
 * POST   /api/v1/admin/payments/:awb/confirm  — Ops confirms payment received (wallet deduction or manual)
 * POST   /api/v1/admin/payments/:awb/quote    — calculate and set shipping fee for a shipment
 *
 * Payment Gate Rule:
 *   No parcel may be dispatched from any hub until payment_status = 'paid'
 *   OR the consignee holds a pre-approved credit account.
 *   This is enforced server-side on any dispatch/release action.
 */

const express = require('express')
const db      = require('../db')
const { sendNotification } = require('../mailer')
const { debitCustomerWallet } = require('./customers')
const router  = express.Router()

/* ── Prepared statements ────────────────────────────────────────────────────── */
const getShipment       = db.prepare('SELECT * FROM shipments WHERE awb = ?')
const getCustomer       = db.prepare('SELECT * FROM customers WHERE id = ?')
const setPaymentStatus  = db.prepare(`
  UPDATE shipments SET
    payment_status    = @payment_status,
    payment_method    = @payment_method,
    payment_paid_at   = datetime('now'),
    payment_reference = @payment_reference,
    updated_at        = datetime('now')
  WHERE awb = @awb
`)
const setPaymentQuote   = db.prepare(`
  UPDATE shipments SET
    payment_amount   = @payment_amount,
    payment_currency = @payment_currency,
    payment_status   = 'quoted',
    updated_at       = datetime('now')
  WHERE awb = @awb
`)
const insertEvent       = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)
const insertTx          = db.prepare(`
  INSERT INTO payment_transactions (customer_id, awb, type, amount, currency, method, reference, notes, recorded_by)
  VALUES (@customer_id, @awb, @type, @amount, @currency, @method, @reference, @notes, @recorded_by)
`)

function nowParts() {
  const d = new Date()
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
  }
}

/* ── GET /payments/:awb ─────────────────────────────────────────────────────── */
router.get('/:awb', (req, res) => {
  const shipment = getShipment.get(req.params.awb)
  if (!shipment) return res.status(404).json({ error: 'NOT_FOUND', message: `Shipment ${req.params.awb} not found.` })

  const customer = shipment.customer_id ? getCustomer.get(shipment.customer_id) : null

  return res.json({
    awb             : shipment.awb,
    payment_status  : shipment.payment_status,
    payment_amount  : shipment.payment_amount,
    payment_currency: shipment.payment_currency || 'ZMW',
    payment_method  : shipment.payment_method,
    payment_paid_at : shipment.payment_paid_at,
    payment_reference: shipment.payment_reference,
    gate_cleared    : shipment.payment_status === 'paid' || shipment.payment_status === 'credit_approved',
    customer_wallet : customer ? customer.wallet_balance : null,
  })
})

/* ── POST /payments/:awb/quote — set shipping fee ───────────────────────────── */
router.post('/:awb/quote', (req, res) => {
  const shipment = getShipment.get(req.params.awb)
  if (!shipment) return res.status(404).json({ error: 'NOT_FOUND', message: `Shipment ${req.params.awb} not found.` })

  const { amount, currency = 'ZMW' } = req.body || {}
  if (!amount || isNaN(amount) || Number(amount) < 0) {
    return res.status(400).json({ error: 'INVALID_AMOUNT', message: 'amount must be a non-negative number.' })
  }

  setPaymentQuote.run({ awb: req.params.awb, payment_amount: Number(amount), payment_currency: currency })

  // Log event
  const { date, time } = nowParts()
  insertEvent.run({
    awb: req.params.awb, activity: 'AWAITING PAYMENT',
    details: `Shipping fee quoted: ${currency} ${Number(amount).toFixed(2)}. Payment required before dispatch.`,
    status: 'Awaiting Payment', city: shipment.receiver_city || '', date, time,
    new_status: 'Awaiting Payment', source: 'ops',
  })

  // Send payment request notification (non-blocking)
  sendNotification('payment_request', { ...shipment, payment_amount: amount, payment_currency: currency })
    .catch(() => {})

  return res.json({ success: true, awb: req.params.awb, payment_amount: amount, payment_currency: currency })
})

/* ── POST /payments/:awb/confirm — Ops confirms payment, gate clears ────────── */
router.post('/:awb/confirm', (req, res) => {
  const shipment = getShipment.get(req.params.awb)
  if (!shipment) return res.status(404).json({ error: 'NOT_FOUND', message: `Shipment ${req.params.awb} not found.` })

  if (shipment.payment_status === 'paid') {
    return res.json({ success: true, message: 'Payment already confirmed.', gate_cleared: true })
  }

  const { method = 'wallet', reference, recorded_by = 'ops' } = req.body || {}
  const { date, time } = nowParts()

  // If method = wallet, deduct from customer wallet
  if (method === 'wallet' && shipment.customer_id && shipment.payment_amount) {
    try {
      debitCustomerWallet({
        customer_id: shipment.customer_id,
        amount     : shipment.payment_amount,
        awb        : shipment.awb,
        method     : 'wallet',
        reference  : reference || null,
        notes      : 'Shipping fee deducted — payment gate cleared',
        recorded_by,
      })
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        return res.status(402).json({
          error: 'INSUFFICIENT_BALANCE',
          message: 'Customer wallet balance is insufficient. Top up required before gate can be cleared.',
        })
      }
      throw err
    }
  } else if (method !== 'wallet' && shipment.customer_id && shipment.payment_amount) {
    // Non-wallet payment — log transaction without deducting wallet
    insertTx.run({
      customer_id: shipment.customer_id, awb: shipment.awb, type: 'debit',
      amount: shipment.payment_amount || 0, currency: shipment.payment_currency || 'ZMW',
      method, reference: reference || null, notes: 'Manual payment gate clearance', recorded_by,
    })
  }

  // Mark shipment as paid
  setPaymentStatus.run({
    awb              : req.params.awb,
    payment_status   : 'paid',
    payment_method   : method,
    payment_reference: reference || null,
  })

  // Log tracking event
  insertEvent.run({
    awb: req.params.awb, activity: 'PAYMENT CONFIRMED',
    details: `Payment gate cleared. Method: ${method}. Reference: ${reference || 'N/A'}. Ready for dispatch.`,
    status: 'Payment Confirmed', city: shipment.receiver_city || '', date, time,
    new_status: 'Payment Confirmed', source: 'ops',
  })

  // Send payment confirmed notification (non-blocking)
  sendNotification('payment_confirmed', shipment).catch(() => {})

  return res.json({ success: true, awb: req.params.awb, gate_cleared: true, method })
})

/* ── Exported gate check — used by dispatch endpoints ───────────────────────── */
function checkPaymentGate(awb) {
  const shipment = getShipment.get(awb)
  if (!shipment) return { blocked: false }  // if shipment unknown, don't block here
  const cleared = shipment.payment_status === 'paid' || shipment.payment_status === 'credit_approved'
  return {
    blocked        : !cleared,
    payment_status : shipment.payment_status,
    payment_amount : shipment.payment_amount,
    payment_currency: shipment.payment_currency || 'ZMW',
  }
}

module.exports = router
module.exports.checkPaymentGate = checkPaymentGate
