/**
 * Customers Routes — PMS consignee account management
 *
 * GET    /api/v1/admin/customers                        — list all customers
 * GET    /api/v1/admin/customers/join/:token            — validate invitation token (public)
 * GET    /api/v1/admin/customers/:id                    — get one customer + transactions
 * POST   /api/v1/admin/customers                        — create customer manually
 * PATCH  /api/v1/admin/customers/:id                    — update profile / status
 * POST   /api/v1/admin/customers/:id/wallet/credit      — credit wallet (Ops top-up after POP)
 * GET    /api/v1/admin/customers/:id/shipments           — shipments linked to this customer
 * POST   /api/v1/admin/customers/:id/kyc/submit         — submit KYC form + upload ID doc
 * POST   /api/v1/admin/customers/:id/kyc/verify         — ops verifies KYC
 * POST   /api/v1/admin/customers/:id/kyc/reject         — ops rejects KYC with reason
 * GET    /api/v1/admin/customers/:id/kyc/document       — serve uploaded KYC document
 * POST   /api/v1/admin/customers/:id/kyc/resend-invite  — resend invitation email
 */

const express  = require('express')
const path     = require('path')
const crypto   = require('crypto')
const multer   = require('multer')
const db       = require('../db')
const router   = express.Router()

/* ── Multer — KYC document uploads ─────────────────────────────────────────── */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'kyc')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename   : (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `kyc_${req.params.id}_${Date.now()}${ext}`)
  },
})
const upload = multer({
  storage,
  limits    : { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, or PDF files are allowed.'))
  },
})

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function makeCustomerId() {
  return 'CUST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
}
function makeInvitationToken() {
  return crypto.randomBytes(20).toString('hex')
}

/* ── Prepared statements ────────────────────────────────────────────────────── */
const listCustomers    = db.prepare('SELECT * FROM customers ORDER BY created_at DESC')
const getCustomer      = db.prepare('SELECT * FROM customers WHERE id = ?')
const getByPhone       = db.prepare('SELECT * FROM customers WHERE phone = ?')
const getByEmail       = db.prepare('SELECT * FROM customers WHERE email = ?')
const getByToken       = db.prepare('SELECT * FROM customers WHERE invitation_token = ?')
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

/* ── GET /customers/join/:token — PUBLIC — validate invitation ───────────────── */
router.get('/join/:token', (req, res) => {
  const customer = getByToken.get(req.params.token)
  if (!customer) {
    return res.status(404).json({ error: 'INVALID_TOKEN', message: 'This invitation link is invalid or has expired.' })
  }
  // Return safe subset (no wallet, no internal fields)
  return res.json({
    id           : customer.id,
    name         : customer.name,
    email        : customer.email,
    phone        : customer.phone,
    city         : customer.city,
    country      : customer.country,
    kyc_status   : customer.kyc_status || 'not_started',
    created_from : customer.created_from,
  })
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
  const { name, phone, email, city, country, account_status, profile_complete,
          national_id, date_of_birth, physical_address, kyc_document_type, portal_user_id } = req.body || {}

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

  // Update extended fields separately
  const extras = {}
  if (national_id       !== undefined) extras.national_id        = national_id
  if (date_of_birth     !== undefined) extras.date_of_birth      = date_of_birth
  if (physical_address  !== undefined) extras.physical_address   = physical_address
  if (kyc_document_type !== undefined) extras.kyc_document_type  = kyc_document_type
  if (portal_user_id    !== undefined) extras.portal_user_id     = portal_user_id

  if (Object.keys(extras).length > 0) {
    const setClauses = Object.keys(extras).map(k => `${k}=@${k}`).join(', ')
    db.prepare(`UPDATE customers SET ${setClauses}, updated_at=datetime('now') WHERE id=@id`)
      .run({ ...extras, id: req.params.id })
  }

  return res.json({ customer: getCustomer.get(req.params.id) })
})

/* ── POST /customers/:id/wallet/credit ──────────────────────────────────────── */
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

  return res.json({ success: true, new_balance: getCustomer.get(req.params.id).wallet_balance })
})

/* ── GET /customers/:id/shipments ───────────────────────────────────────────── */
router.get('/:id/shipments', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  const shipments = getShipmentsByCust.all(req.params.id)
  return res.json({ customer, shipments })
})

/* ── POST /customers/:id/kyc/submit — multipart KYC form + doc upload ────────── */
router.post('/:id/kyc/submit', upload.single('kyc_document'), (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })

  const { national_id, kyc_document_type, date_of_birth, physical_address, name, portal_user_id } = req.body || {}

  if (!national_id || !kyc_document_type || !date_of_birth || !physical_address) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'national_id, kyc_document_type, date_of_birth, and physical_address are required.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'MISSING_DOCUMENT', message: 'An ID document (jpg, png, or pdf) is required.' })
  }

  const docPath = req.file.filename

  db.prepare(`
    UPDATE customers SET
      kyc_status = 'submitted',
      national_id = @national_id,
      kyc_document_type = @kyc_document_type,
      kyc_document_path = @kyc_document_path,
      date_of_birth = @date_of_birth,
      physical_address = @physical_address,
      kyc_submitted_at = datetime('now'),
      profile_complete = 1,
      account_status = CASE WHEN account_status = 'pending' THEN 'pending' ELSE account_status END,
      portal_user_id = COALESCE(@portal_user_id, portal_user_id),
      name = COALESCE(@name, name),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: req.params.id, national_id, kyc_document_type, kyc_document_path: docPath,
           date_of_birth, physical_address, portal_user_id: portal_user_id || null, name: name || null })

  return res.json({ success: true, customer: getCustomer.get(req.params.id) })
})

/* ── POST /customers/:id/kyc/verify — ops verifies KYC ─────────────────────── */
router.post('/:id/kyc/verify', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })

  const { verified_by = 'ops' } = req.body || {}

  db.prepare(`
    UPDATE customers SET
      kyc_status = 'verified',
      kyc_verified_at = datetime('now'),
      kyc_verified_by = @verified_by,
      account_status = 'active',
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: req.params.id, verified_by })

  // Clear kyc_hold on all this customer's shipments
  db.prepare(`UPDATE shipments SET kyc_hold = 0, updated_at = datetime('now') WHERE customer_id = ?`)
    .run(req.params.id)

  return res.json({ success: true, message: 'KYC verified. All shipment holds cleared.', customer: getCustomer.get(req.params.id) })
})

/* ── POST /customers/:id/kyc/reject — ops rejects KYC ──────────────────────── */
router.post('/:id/kyc/reject', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })

  const { reason = 'Document unclear or ID number mismatch.', rejected_by = 'ops' } = req.body || {}

  db.prepare(`
    UPDATE customers SET
      kyc_status = 'rejected',
      kyc_rejection_reason = @reason,
      kyc_verified_by = @rejected_by,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: req.params.id, reason, rejected_by })

  return res.json({ success: true, message: 'KYC rejected.', customer: getCustomer.get(req.params.id) })
})

/* ── GET /customers/:id/kyc/document — serve uploaded doc ──────────────────── */
router.get('/:id/kyc/document', (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  if (!customer.kyc_document_path) return res.status(404).json({ error: 'NO_DOCUMENT', message: 'No KYC document on file.' })

  const filePath = path.join(UPLOAD_DIR, customer.kyc_document_path)
  return res.sendFile(filePath)
})

/* ── POST /customers/:id/kyc/resend-invite — resend invitation email ────────── */
router.post('/:id/kyc/resend-invite', async (req, res) => {
  const customer = getCustomer.get(req.params.id)
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' })
  if (!customer.email) return res.status(400).json({ error: 'NO_EMAIL', message: 'Customer has no email address on file.' })

  // Regenerate token
  const token = makeInvitationToken()
  db.prepare(`UPDATE customers SET invitation_token = @token, invitation_sent_at = datetime('now'), updated_at = datetime('now') WHERE id = @id`)
    .run({ id: req.params.id, token })

  try {
    const { sendKycInvitation } = require('../mailer')
    await sendKycInvitation({ ...customer, invitation_token: token })
    return res.json({ success: true, message: `Invitation sent to ${customer.email}` })
  } catch (err) {
    return res.status(500).json({ error: 'EMAIL_FAILED', message: err.message })
  }
})

/* ── Exported helpers for use by other routes ───────────────────────────────── */
function findOrCreateCustomer({ name, phone, email, city, country = 'Zambia', created_from = 'partner_api' }) {
  let customer = phone ? getByPhone.get(phone) : null
  if (!customer && email) customer = getByEmail.get(email)

  if (customer) {
    if (name && name !== customer.name) {
      updateCustomer.run({ ...customer, name, city: city || customer.city })
    }
    return { customer: getCustomer.get(customer.id), created: false }
  }

  // Create new record — pending status, generate invitation token
  const id = makeCustomerId()
  const invitationToken = makeInvitationToken()
  insertCustomer.run({ id, name: name || 'Unknown', phone: phone || null, email: email || null, city: city || null, country, wallet_balance: 0, account_status: 'pending', created_from, profile_complete: 0 })

  // Store invitation token
  db.prepare(`UPDATE customers SET invitation_token = @token, updated_at = datetime('now') WHERE id = @id`)
    .run({ id, token: invitationToken })

  const newCustomer = getCustomer.get(id)

  // Send invitation email (non-blocking — don't let email failures crash booking)
  if (email) {
    setImmediate(async () => {
      try {
        const { sendKycInvitation } = require('../mailer')
        await sendKycInvitation(newCustomer)
        db.prepare(`UPDATE customers SET invitation_sent_at = datetime('now') WHERE id = ?`).run(id)
      } catch (e) {
        console.error('[KYC invite]', e.message)
      }
    })
  }

  return { customer: newCustomer, created: true }
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
