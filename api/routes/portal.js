/**
 * Portal Routes — self-service customer registration and authentication
 *
 * POST /api/portal/register             — create account, send OTP
 * POST /api/portal/verify-otp           — verify OTP, activate account
 * POST /api/portal/resend-verification  — resend OTP to email
 * POST /api/portal/login                — authenticate (email or customerId + password)
 * POST /api/portal/sync                 — lazy-migrate a localStorage user into SQLite
 */

const express = require('express')
const crypto  = require('crypto')
const db      = require('../db')
const router  = express.Router()

// ── Password hashing — pbkdf2 via built-in crypto, no extra deps ──────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function checkPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash || hash.length !== 128) return false
  try {
    const attempt = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(hash, 'hex'))
  } catch (_) {
    return false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeCustomerId() {
  return 'CUST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function makeInitials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'U'
}

function toUserObj(c) {
  return {
    id             : c.id,
    email          : c.email,
    firstName      : c.first_name   || '',
    surname        : c.surname      || '',
    name           : c.name,
    initials       : makeInitials(c.name),
    role           : 'customer',
    status         : c.email_verified ? 'active' : 'pending_verification',
    customerId     : c.id,
    customer_id    : c.id,
    phone          : c.phone        || '',
    gender         : c.gender       || '',
    pronouns       : c.pronouns     || '',
    town           : c.city         || '',
    physicalAddress: c.physical_address || '',
    tpin           : c.tpin         || '',
    occupation     : c.occupation   || '',
    kyc_status     : c.kyc_status   || 'not_started',
    wallet_balance : c.wallet_balance || 0,
    account_status : c.account_status,
    synced_to_server: true,
  }
}

// ── Prepared statements ───────────────────────────────────────────────────────
const getByEmail = db.prepare('SELECT * FROM customers WHERE LOWER(email) = LOWER(?)')
const getByPhone = db.prepare('SELECT * FROM customers WHERE phone = ?')
const getByTpin  = db.prepare("SELECT * FROM customers WHERE tpin = ? AND tpin IS NOT NULL AND tpin != ''")
const getById    = db.prepare('SELECT * FROM customers WHERE id = ?')

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const {
    firstName, surname, pronouns, gender, email, phone,
    plotNo, street, area, town, province, physicalAddress,
    tpin, occupation, password,
  } = req.body || {}

  if (!firstName || !surname)              return res.status(400).json({ code: 'MISSING_FIELDS', message: 'First name and surname are required.' })
  if (!email)                              return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Email address is required.' })
  if (!phone)                              return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Phone number is required.' })
  if (!password || password.length < 6)   return res.status(400).json({ code: 'WEAK_PASSWORD',  message: 'Password must be at least 6 characters.' })

  const normalEmail = email.trim().toLowerCase()
  const normalPhone = phone.trim()

  const existingEmail = getByEmail.get(normalEmail)
  if (existingEmail) {
    return res.status(409).json({ code: 'DUPLICATE_EMAIL', message: 'An account with this email address is already registered.' })
  }

  if (normalPhone) {
    const existingPhone = getByPhone.get(normalPhone)
    if (existingPhone) return res.status(409).json({ code: 'DUPLICATE_PHONE', message: 'An account with this phone number is already registered.' })
  }

  if (tpin && tpin.trim()) {
    const existingTpin = getByTpin.get(tpin.trim())
    if (existingTpin) return res.status(409).json({ code: 'DUPLICATE_TPIN', message: 'An account with this TPIN is already registered.' })
  }

  const name         = `${firstName.trim()} ${surname.trim()}`
  const id           = makeCustomerId()
  const otp          = makeOtp()
  const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const address      = physicalAddress || [plotNo, street, area, town, province].filter(Boolean).join(', ')

  db.prepare(`
    INSERT INTO customers
      (id, name, phone, email, city, country, wallet_balance, account_status,
       created_from, profile_complete,
       password_hash, otp_code, otp_expires_at, email_verified,
       first_name, surname, gender, pronouns, occupation, tpin,
       province, plot_no, street, area, physical_address)
    VALUES
      (@id, @name, @phone, @email, @city, 'Zambia', 0, 'pending',
       'portal', 0,
       @password_hash, @otp_code, @otp_expires_at, 0,
       @first_name, @surname, @gender, @pronouns, @occupation, @tpin,
       @province, @plot_no, @street, @area, @physical_address)
  `).run({
    id,
    name,
    phone          : normalPhone,
    email          : normalEmail,
    city           : town     || null,
    password_hash  : hashPassword(password),
    otp_code       : otp,
    otp_expires_at : otpExpiresAt,
    first_name     : firstName.trim(),
    surname        : surname.trim(),
    gender         : gender      || '',
    pronouns       : pronouns    || '',
    occupation     : occupation  || '',
    tpin           : tpin?.trim() || null,
    province       : province    || null,
    plot_no        : plotNo      || null,
    street         : street      || null,
    area           : area        || null,
    physical_address: address    || null,
  })

  setImmediate(async () => {
    try {
      const { sendOtpEmail } = require('../mailer')
      await sendOtpEmail({ name, email: normalEmail, otp })
    } catch (e) {
      console.error('[portal/register] OTP email failed:', e.message)
    }
  })

  return res.json({ ok: true, email: normalEmail })
})

// ── POST /verify-otp ──────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ message: 'email and otp are required.' })

  const customer = getByEmail.get(email.trim().toLowerCase())
  if (!customer) return res.status(404).json({ message: 'No account found for this email.' })
  if (customer.email_verified) return res.json({ ok: true, user: toUserObj(customer) })

  if (!customer.otp_code) {
    return res.status(400).json({ message: 'No verification code on file. Please request a new one.' })
  }
  if (customer.otp_code !== String(otp).trim()) {
    return res.status(400).json({ message: 'Incorrect code. Please check and try again.' })
  }
  if (customer.otp_expires_at && new Date(customer.otp_expires_at) < new Date()) {
    return res.status(400).json({ message: 'This code has expired. Please request a new one.' })
  }

  db.prepare(`
    UPDATE customers
    SET email_verified = 1, account_status = 'active',
        otp_code = NULL, otp_expires_at = NULL,
        profile_complete = 1, updated_at = datetime('now')
    WHERE id = ?
  `).run(customer.id)

  const updated = getById.get(customer.id)

  setImmediate(async () => {
    try {
      const { sendWelcomeEmail } = require('../mailer')
      await sendWelcomeEmail({ name: updated.name, email: updated.email, customerId: updated.id })
    } catch (e) {
      console.error('[portal/verify-otp] welcome email failed:', e.message)
    }
  })

  return res.json({ ok: true, user: toUserObj(updated) })
})

// ── POST /resend-verification ─────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'email is required.' })

  const customer = getByEmail.get(email.trim().toLowerCase())
  if (!customer) return res.status(404).json({ message: 'No account found for this email.' })
  if (customer.email_verified) return res.json({ ok: true, message: 'Account already verified.' })

  const otp          = makeOtp()
  const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  db.prepare(`UPDATE customers SET otp_code = ?, otp_expires_at = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(otp, otpExpiresAt, customer.id)

  setImmediate(async () => {
    try {
      const { sendOtpEmail } = require('../mailer')
      await sendOtpEmail({ name: customer.name, email: customer.email, otp })
    } catch (e) {
      console.error('[portal/resend-verification] OTP email failed:', e.message)
    }
  })

  return res.json({ ok: true })
})

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, customerId, password } = req.body || {}
  if (!password) return res.status(400).json({ message: 'Password is required.' })

  let customer = null
  if (email) {
    customer = getByEmail.get(email.trim().toLowerCase())
  } else if (customerId) {
    customer = getById.get(customerId.toUpperCase())
  }

  if (!customer || !customer.password_hash) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  if (!customer.email_verified) {
    return res.status(403).json({
      pendingVerification: true,
      email: customer.email,
      message: 'Please verify your email address first.',
    })
  }

  if (!checkPassword(password, customer.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  if (customer.account_status === 'suspended') {
    return res.status(403).json({ message: 'This account has been suspended. Please contact support.' })
  }

  return res.json({ user: toUserObj(customer) })
})

// ── POST /sync — lazy-migrate a localStorage user into SQLite ─────────────────
router.post('/sync', (req, res) => {
  const {
    email, password, firstName, surname, phone, gender,
    town, physicalAddress, tpin, occupation, pronouns,
  } = req.body || {}

  if (!email || !password) return res.status(400).json({ message: 'email and password are required.' })

  const normalEmail = email.trim().toLowerCase()
  const existing    = getByEmail.get(normalEmail)

  if (existing) {
    if (!existing.password_hash) {
      db.prepare(`UPDATE customers SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(hashPassword(password), existing.id)
    }
    return res.json({ ok: true })
  }

  const name = [firstName, surname].filter(Boolean).join(' ').trim() || 'Portal User'
  const id   = makeCustomerId()

  try {
    db.prepare(`
      INSERT INTO customers
        (id, name, phone, email, city, country, wallet_balance, account_status,
         created_from, profile_complete, password_hash, email_verified,
         first_name, surname, gender, pronouns, occupation, tpin, physical_address)
      VALUES
        (@id, @name, @phone, @email, @city, 'Zambia', 0, 'active',
         'portal_migrated', 1, @password_hash, 1,
         @first_name, @surname, @gender, @pronouns, @occupation, @tpin, @physical_address)
    `).run({
      id,
      name,
      phone          : phone?.trim()       || null,
      email          : normalEmail,
      city           : town                || null,
      password_hash  : hashPassword(password),
      first_name     : (firstName || '').trim(),
      surname        : (surname   || '').trim(),
      gender         : gender     || '',
      pronouns       : pronouns   || '',
      occupation     : occupation || '',
      tpin           : tpin?.trim()        || null,
      physical_address: physicalAddress    || null,
    })
  } catch (e) {
    console.error('[portal/sync]', e.message)
    return res.status(500).json({ message: 'Sync failed.' })
  }

  return res.json({ ok: true })
})

// ── POST /update-password — set a new password after reset-token is consumed ──
router.post('/update-password', (req, res) => {
  const { email, newPassword } = req.body || {}
  if (!email || !newPassword) return res.status(400).json({ message: 'email and newPassword are required.' })
  if (newPassword.length < 6)  return res.status(400).json({ message: 'Password must be at least 6 characters.' })

  const customer = getByEmail.get(email.trim().toLowerCase())
  if (!customer) return res.status(404).json({ message: 'No account found for this email.' })

  db.prepare("UPDATE customers SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hashPassword(newPassword), customer.id)

  return res.json({ ok: true })
})

// ── POST /admin-verify — admin manually activates without OTP ────────────────
router.post('/admin-verify', (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'email is required.' })

  const customer = getByEmail.get(email.trim().toLowerCase())
  if (!customer) return res.status(404).json({ message: 'No account found for this email.' })

  db.prepare(`
    UPDATE customers
    SET email_verified = 1, account_status = 'active',
        otp_code = NULL, otp_expires_at = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).run(customer.id)

  return res.json({ ok: true, user: toUserObj(getById.get(customer.id)) })
})

// ── POST /bulk-migrate — admin syncs all localStorage customers to SQLite ─────
// Body: { users: [{ email, password, firstName, surname, phone, gender, town,
//                   physicalAddress, tpin, occupation, pronouns }] }
// For each user: upsert into customers, send a welcome email.
router.post('/bulk-migrate', async (req, res) => {
  const { users = [] } = req.body || {}
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'users array is required.' })
  }

  const results = { synced: 0, skipped: 0, failed: 0, emailed: 0, details: [] }

  for (const u of users) {
    if (!u.email) { results.failed++; continue }
    const normalEmail = u.email.trim().toLowerCase()

    try {
      let customer = getByEmail.get(normalEmail)

      if (customer) {
        // Already exists — ensure password is set and account is active
        const updates = []
        const params  = { id: customer.id }
        if (!customer.password_hash && u.password) {
          updates.push('password_hash = @password_hash')
          params.password_hash = hashPassword(u.password)
        }
        if (!customer.email_verified) {
          updates.push('email_verified = 1', "account_status = 'active'")
        }
        if (updates.length) {
          updates.push("updated_at = datetime('now')")
          db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = @id`).run(params)
        }
        customer = getById.get(customer.id)
        results.skipped++
        results.details.push({ email: normalEmail, result: 'existing' })
      } else {
        // Create new record
        const name = [u.firstName, u.surname].filter(Boolean).join(' ').trim() || normalEmail
        const id   = makeCustomerId()
        db.prepare(`
          INSERT INTO customers
            (id, name, phone, email, city, country, wallet_balance, account_status,
             created_from, profile_complete, password_hash, email_verified,
             first_name, surname, gender, pronouns, occupation, tpin, physical_address)
          VALUES
            (@id, @name, @phone, @email, @city, 'Zambia', 0, 'active',
             'portal_migrated', 1, @password_hash, 1,
             @first_name, @surname, @gender, @pronouns, @occupation, @tpin, @physical_address)
        `).run({
          id,
          name,
          phone           : u.phone?.trim()       || null,
          email           : normalEmail,
          city            : u.town                || null,
          password_hash   : u.password ? hashPassword(u.password) : null,
          first_name      : (u.firstName || '').trim(),
          surname         : (u.surname   || '').trim(),
          gender          : u.gender     || '',
          pronouns        : u.pronouns   || '',
          occupation      : u.occupation || '',
          tpin            : u.tpin?.trim()        || null,
          physical_address: u.physicalAddress     || null,
        })
        customer = getById.get(id)
        results.synced++
        results.details.push({ email: normalEmail, result: 'created' })
      }

      // Send welcome email (non-blocking)
      if (customer && customer.email) {
        const c = customer
        setImmediate(async () => {
          try {
            const { sendWelcomeEmail } = require('../mailer')
            await sendWelcomeEmail({ name: c.name, email: c.email, customerId: c.id })
            results.emailed++
          } catch (e) {
            console.error('[portal/bulk-migrate] email failed for', c.email, e.message)
          }
        })
      }
    } catch (e) {
      console.error('[portal/bulk-migrate] failed for', normalEmail, e.message)
      results.failed++
      results.details.push({ email: normalEmail, result: 'error', error: e.message })
    }
  }

  return res.json({ ok: true, results })
})

module.exports = router
