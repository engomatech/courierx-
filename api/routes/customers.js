/**
 * Customers Routes — PMS consignee account management
 *
 * GET    /api/v1/admin/customers                     — list all customers
 * GET    /api/v1/admin/customers/:id                 — get one customer + transactions
 * POST   /api/v1/admin/customers                     — create customer manually
 * PATCH  /api/v1/admin/customers/:id                 — update profile / status
 * POST   /api/v1/admin/customers/:id/wallet/credit   — credit wallet (Ops top-up after POP)
 * GET    /api/v1/admin/customers/:id/shipments        — shipments linked to this customer
 */

const express = require('express')
const db      = require('../db')
const router  = express.Router()

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function makeCustomerId() {
  return 'CUST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
}

/* ── Prepared statements ────────────────────────────────────────────────────── */
const listCustomers    = db.prepare('SELECT * FROM customers ORDER BY created_at DESC')
const getCustomer      = db.prepare('SELECT * FROM customers WHERE id = ?')
const getByPhone       = db.prepare('SELECT * FROM customers WHERE phone = ?')
const getByEmail       = db.prepare('SELECT * FROM customers WHERE email = ?')
const insertCustomer   = db.prepare(`
  INSERT INTO customers (id, name, phone, email, city, country, wallet_balance, account_status, created_from, profile_complete)
  VALUES (@id, @name, @phone, @email, @city, @country, @wallet_balance, @account_status, @created_from, @profile_complete)
`)
const updateCustomer   = db.prepare(`
  UPDATE customers SET name=@name, phone=@phone, email=@email, city=@city, country=@country,
    account_status=@account_status, profile_complete=@profile_complete, updated_at=datetime('now')
  WHERE id=@id
`)
const creditWallet     = db.prepare(`
  UPDATE customers SET wallet_balance = wallet_balance + @amount, updated_at=datetime('now') WHERE id=@id
`)
const debitWallet      = db.prepare(`
  UPDATE customers SET wallet_balance = wallet_balance - @amount, updated_at=datetime('now') WHERE id=@id
`)
const insertTx         = db.prepare(`
  INSERT INTO payment_transactions (customer_id, awb, type, amount, currency, method, reference, notes, recorded_by)
  VALUES (@customer_id, @awb, @type, @amount, @currency, @method, @reference, @notes, @recorded_by)
`)
const getTxByCustomer  = db.prepare('SELECT * FROM payment_transactions WHERE customer_id = ? ORDER BY created_at DESC')
const getShipmentsByCust = db.prepare('SELECT * FROM shipments WHERE customer_id = ? ORDER BY created_at DESC')

/* ── GET /customers ─────────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const customers = listCustomers.all()
  return res.json({ customers })
})

/* ── GET /customers/:id ─────────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  const transactions = getTxByCustomer.all(req.params.id)
  return res.json({ customer, transactions })
})

/* ── POST /customers — manual create ────────────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, phone, email, city, country = 'Zambia', created_from = 'manual' } = req.body || {}
  if (!name || !phone) return res.status(400).json({ error: 'MISSING_FIELDS', message: 'name and phone are required.' })

  // Prevent duplicates by phone
  const existing = getByPhone.get(phone)
  if (existing) return res.status(409).json({ error: 'DUPLICATE', message: 'A customer with this phone number already exists.', customer: existing })

  const id = makeCustomerId()
  insertCustomer.run({ id, name, phone, email: email || null, city: city || null, country, wallet_balance: 0, account_status: 'active', created_from, profile_complete: 1 })
  const customer = getCustomer.get(id)
  return res.status(201).json({ customer })
})

/* ── PATCH /customers/:id ───────────────────────────────────────────────────── */
router.patch('/:id', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  const { name, phone, email, city, country, account_status, profile_complete } = req.body || {}
  updateCustomer.run({
    id: req.params.id,
    name            : name             ?? customer.name,
    phone           : phone            ?? customer.phone,
    email           : email            ?? customer.email,
    city            : city             ?? customer.city,
    country         : country          ?? customer.country,
    account_status  : account_status   ?? customer.account_status,
    profile_complete: profile_complete ?? customer.profile_complete,
  })
  return res.json({ customer: getCustomer.get(req.params.id) })
})

/* ── POST /customers/:id/wallet/credit — Ops top-up after POP verified ──────── */
router.post('/:id/wallet/credit', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })

  const { amount, method = 'mobile_money', reference, notes, recorded_by = 'ops' } = req.body || {}
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'INVALID_AMOUNT', message: 'amount must be a positive number.' })
  }

  const creditTx = db.transaction(() => {
    creditWallet.run({ id: req.params.id, amount: Number(amount) })
    insertTx.run({
      customer_id: req.params.id, awb: null, type: 'credit',
      amount: Number(amount), currency: 'ZMW',
      method, reference: reference || null, notes: notes || null, recorded_by,
    })
  })
  creditTx()

  return res.json({
    success: true,
    new_balance: getCustomer.get(req.params.id).wallet_balance,
  })
})

/* ── GET /customers/:id/shipments ───────────────────────────────────────────── */
router.get('/:id/shipments', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  const shipments = getShipmentsByCust.all(req.params.id)
  return res.json({ customer, shipments })
})

/* ── Exported helpers for use by other routes ───────────────────────────────── */
function findOrCreateCustomer({ name, phone, email, city, country = 'Zambia', created_from = 'partner_api' }) {
  // Try match by phone first, then email
  let customer = phone ? getByPhone.get(phone) : null
  if (!customer && email) customer = getByEmail.get(email)

  if (customer) {
    // Update name/city if provided and different
    if (name && name !== customer.name) {
      updateCustomer.run({ ...customer, name, city: city || customer.city })
    }
    return { customer: getCustomer.get(customer.id), created: false }
  }

  // Create new record (status = pending — notify to complete profile)
  const id = makeCustomerId()
  insertCustomer.run({ id, name: name || 'Unknown', phone: phone || null, email: email || null, city: city || null, country, wallet_balance: 0, account_status: 'pending', created_from, profile_complete: 0 })
  return { customer: getCustomer.get(id), created: true }
}

function debitCustomerWallet({ customer_id, amount, awb, method = 'wallet', reference = null, notes = null, recorded_by = 'system' }) {
  const customer = getCustomer.get(customer_id)
  if (!customer) throw new Error('Customer not found: ' + customer_id)
  if (customer.wallet_balance < amount) throw new Error('INSUFFICIENT_BALANCE')

  db.transaction(() => {
    debitWallet.run({ id: customer_id, amount })
    insertTx.run({ customer_id, awb, type: 'debit', amount, currency: 'ZMW', method, reference, notes, recorded_by })
  })()

  return getCustomer.get(customer_id)
}

module.exports = router
module.exports.findOrCreateCustomer = findOrCreateCustomer
module.exports.debitCustomerWallet  = debitCustomerWallet
