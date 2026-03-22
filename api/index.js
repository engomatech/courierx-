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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Online Express API', version: '1.0.0' })
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
