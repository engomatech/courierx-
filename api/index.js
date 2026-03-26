/**
 * Online Express Partner REST API
 *
 * Express server — runs on port 3001 (configured via API_PORT env var).
 * In development, Vite proxies /api/* to this server so the React frontend
 * and the API run seamlessly on the same origin.
 *
 * In production (InterServer VPS), Nginx proxies /api/* to port 3001
 * and serves the built React app for all other paths.
 *
 * Authentication: all /api/v1/* routes (except /admin/*) require
 * the X-API-Key header with a valid cx_live_... key.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const express      = require('express')
const cors         = require('cors')
const path         = require('path')
const fs           = require('fs')

// Ensure KYC uploads directory exists on startup
const KYC_UPLOAD_DIR = path.join(__dirname, 'uploads', 'kyc')
if (!fs.existsSync(KYC_UPLOAD_DIR)) fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true })
const auth         = require('./middleware/auth')
const errorHandler = require('./middleware/errorHandler')

const shipmentsRouter     = require('./routes/shipments')
const trackingRouter      = require('./routes/tracking')
const ratesRouter         = require('./routes/rates')
const adminRouter         = require('./routes/admin')
const notificationsRouter = require('./routes/notifications')
const customersRouter     = require('./routes/customers')
const paymentsRouter      = require('./routes/payments')
const trackRouter         = require('./routes/track')

const app  = express()
const PORT = process.env.API_PORT || 3001

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin     : process.env.CORS_ORIGIN || '*',  // restrict in production via .env
  credentials: true,
}))
app.use(express.json())

// ── KYC document serving (ops-facing, no public access needed beyond the token) ─
app.use('/uploads/kyc', express.static(KYC_UPLOAD_DIR))

// ── Health check (no auth required) ─────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const start   = Date.now()
  const checks  = {}

  // ── Database ───────────────────────────────────────────────────
  try {
    const db = require('./db')
    db.prepare('SELECT 1').get()
    const key = '_hc_' + Date.now()
    db.prepare('INSERT OR REPLACE INTO notification_settings (key,value) VALUES (?,?)').run(key, '1')
    db.prepare('DELETE FROM notification_settings WHERE key = ?').run(key)
    const tableCount = db.prepare("SELECT COUNT(*) as n FROM sqlite_master WHERE type='table'").get().n
    checks.database = { status: 'ok', message: `Read/write OK · ${tableCount} tables` }
  } catch (e) {
    checks.database = { status: 'error', message: e.message }
  }

  // ── SMTP ───────────────────────────────────────────────────────
  try {
    const db   = require('./db')
    const host = db.prepare("SELECT value FROM notification_settings WHERE key='smtp_host'").get()?.value || ''
    const user = db.prepare("SELECT value FROM notification_settings WHERE key='smtp_user'").get()?.value || ''
    if (!host || !user) {
      checks.smtp = { status: 'warn', message: 'Not configured — emails disabled' }
    } else {
      checks.smtp = { status: 'ok', message: `Configured · ${user} @ ${host}` }
    }
  } catch (e) {
    checks.smtp = { status: 'error', message: e.message }
  }

  // ── Memory ─────────────────────────────────────────────────────
  const mem         = process.memoryUsage()
  const heapUsedMB  = Math.round(mem.heapUsed  / 1024 / 1024)
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024)
  const rssMB       = Math.round(mem.rss        / 1024 / 1024)
  checks.memory = {
    status    : heapUsedMB > 450 ? 'warn' : 'ok',
    message   : `Heap ${heapUsedMB}MB / ${heapTotalMB}MB · RSS ${rssMB}MB`,
    heapUsedMB, heapTotalMB, rssMB,
  }

  // ── Disk ───────────────────────────────────────────────────────
  try {
    const { execSync } = require('child_process')
    const raw  = execSync("df / | tail -1 | awk '{print $5}'", { timeout: 3000 }).toString().trim()
    const pct  = parseInt(raw)
    checks.disk = {
      status : pct > 90 ? 'error' : pct > 75 ? 'warn' : 'ok',
      message: `${raw} of root disk used`,
      usedPercent: pct,
    }
  } catch (_) {
    checks.disk = { status: 'ok', message: 'Disk check skipped' }
  }

  // ── Uploads directory ──────────────────────────────────────────
  try {
    const uploadsOk = fs.existsSync(path.join(__dirname, 'uploads', 'kyc'))
    checks.uploads = { status: uploadsOk ? 'ok' : 'warn', message: uploadsOk ? 'KYC upload dir present' : 'KYC upload dir missing' }
  } catch (e) {
    checks.uploads = { status: 'warn', message: e.message }
  }

  // ── Overall ────────────────────────────────────────────────────
  const statuses = Object.values(checks).map(c => c.status)
  const overall  = statuses.includes('error') ? 'degraded' : statuses.includes('warn') ? 'warn' : 'ok'

  const sec = Math.floor(process.uptime())
  const h   = Math.floor(sec / 3600)
  const m   = Math.floor((sec % 3600) / 60)
  const s   = sec % 60
  const uptimeFormatted = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`

  res.json({
    status: overall, service: 'Online Express API', version: '1.0.0',
    uptime: sec, uptimeFormatted,
    responseMs: Date.now() - start,
    timestamp : new Date().toISOString(),
    checks,
  })
})

// ── Public: verification email after registration (no API key required) ──────
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { name, email, verifyUrl } = req.body || {}
    if (!name || !email || !verifyUrl) {
      return res.status(400).json({ error: 'name, email and verifyUrl are required' })
    }
    const { sendVerificationEmail } = require('./mailer')
    const result = await sendVerificationEmail({ name, email, verifyUrl })
    res.json(result)
  } catch (err) {
    console.error('[send-verification]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Public: welcome email after registration (no API key required) ───────────
app.post('/api/auth/send-welcome', async (req, res) => {
  try {
    const { name, email, customerId } = req.body || {}
    if (!name || !email || !customerId) {
      return res.status(400).json({ error: 'name, email and customerId are required' })
    }
    const { sendWelcomeEmail } = require('./mailer')
    const result = await sendWelcomeEmail({ name, email, customerId })
    res.json(result)
  } catch (err) {
    console.error('[welcome-email]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Public tracking (no auth) ─────────────────────────────────────────────────
app.use('/api/v1/track', trackRouter)

// ── Admin routes — more specific paths first ─────────────────────────────────
app.use('/api/v1/admin/notifications', notificationsRouter)   // before /admin
app.use('/api/v1/admin/customers',     customersRouter)        // before /admin
app.use('/api/v1/admin/payments',      paymentsRouter)         // before /admin
app.use('/api/v1/admin',               adminRouter)

// ── Partner routes (X-API-Key required) ──────────────────────────────────────
app.use('/api/v1/shipments', auth, shipmentsRouter)
app.use('/api/v1/tracking',  auth, trackingRouter)
app.use('/api/v1/rates',     auth, ratesRouter)

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error  : 'NOT_FOUND',
    message: `${req.method} ${req.path} is not a valid API endpoint.`,
  })
})

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Online Express API] Listening on port ${PORT}`)
  console.log(`[Online Express API] Health: http://localhost:${PORT}/api/health`)
})
