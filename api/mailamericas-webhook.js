/**
 * MailAmericas Webhook Integration
 *
 * Pushes shipment status events to MailAmericas tracking system in real time.
 * Uses OAuth2 client_credentials flow; token is cached until expiry.
 *
 * Env vars required:
 *   MA_CLIENT_ID      — provided by MailAmericas
 *   MA_CLIENT_SECRET  — provided by MailAmericas
 *   MA_ENV            — "production" | "test" (default: "test")
 */

const https = require('https')
const http  = require('http')
const url   = require('url')

const TEST_BASE = 'https://qa.tracking.mailamericas.com'
const PROD_BASE = 'https://tracking.mailamericas.com'

function getBase () {
  return (process.env.MA_ENV || 'test') === 'production' ? PROD_BASE : TEST_BASE
}

// ── Status → MailAmericas description mapping ────────────────────────────────
const STATUS_MAP = {
  'Booked'           : 'Order Created',
  'Confirmed'        : 'Booking Confirmed',
  'PRS Assigned'     : 'Pickup Assigned',
  'Out for Pickup'   : 'Out for Pickup',
  'Picked Up'        : 'Shipment Collected',
  'Origin Scanned'   : 'Origin Scan',
  'Bagged'           : 'Bagged at Origin',
  'Manifested'       : 'Manifested',
  'In Transit'       : 'In Transit',
  'Hub Inbound'      : 'Arrived at Hub',
  'DRS Assigned'     : 'Out for Delivery',
  'Out for Delivery' : 'Out for Delivery',
  'Delivered'        : 'Delivered',
  'NDR'              : 'Delivery Attempt Failed',
  'RTS'              : 'Return to Sender Initiated',
  'Held'             : 'Shipment On Hold',
  'Cancelled'        : 'Shipment Cancelled',
}

// ── Token cache ──────────────────────────────────────────────────────────────
let _token      = null
let _tokenExpiry = 0

async function getToken () {
  if (_token && Date.now() < _tokenExpiry) return _token

  const clientId     = process.env.MA_CLIENT_ID
  const clientSecret = process.env.MA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[MA Webhook] MA_CLIENT_ID / MA_CLIENT_SECRET not configured — skipping.')
    return null
  }

  const body = JSON.stringify({
    grant_type   : 'client_credentials',
    client_id    : clientId,
    client_secret: clientSecret,
    scope        : '*',
  })

  const data = await httpPost(getBase() + '/oauth/token', body, {})
  if (!data || !data.access_token) {
    console.error('[MA Webhook] Failed to obtain OAuth token:', data)
    return null
  }

  _token       = data.access_token
  // expires_in is in seconds; cache with 60s buffer
  _tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000
  return _token
}

// ── HTTP POST helper ─────────────────────────────────────────────────────────
function httpPost (endpoint, bodyStr, extraHeaders) {
  return new Promise((resolve) => {
    const parsed  = url.parse(endpoint)
    const lib     = parsed.protocol === 'https:' ? https : http
    const options = {
      hostname: parsed.hostname,
      port    : parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path    : parsed.path,
      method  : 'POST',
      headers : Object.assign({
        'Content-Type'  : 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      }, extraHeaders),
    }

    const req = lib.request(options, (resp) => {
      let raw = ''
      resp.on('data', (c) => { raw += c })
      resp.on('end', () => {
        try { resolve(JSON.parse(raw)) }
        catch (_) { resolve({ _raw: raw, _status: resp.statusCode }) }
      })
    })

    req.on('error', (e) => {
      console.error('[MA Webhook] HTTP error:', e.message)
      resolve(null)
    })

    req.setTimeout(10000, () => {
      console.error('[MA Webhook] Request timed out')
      req.destroy()
      resolve(null)
    })

    req.write(bodyStr)
    req.end()
  })
}

// ── Main: push event to MailAmericas ─────────────────────────────────────────
/**
 * @param {object} shipment  — row from DB (must have partner_reference, awb, weight, quantity, etc.)
 * @param {string} newStatus — new status string e.g. "Delivered"
 * @param {object} [extra]   — optional extra fields: { city, received_by, delivery_proof, gcs }
 */
async function pushEvent (shipment, newStatus, extra) {
  const clientId = process.env.MA_CLIENT_ID
  if (!clientId) return  // not configured — silently skip

  const token = await getToken()
  if (!token) return

  // Use partner_reference as the tracking number (MailAmericas' own tracking number)
  // Fall back to our AWB if partner_reference not set
  const tracking = shipment.partner_reference || shipment.awb

  const description = STATUS_MAP[newStatus] || newStatus

  const payload = {
    tracking      : tracking,
    date          : new Date().toISOString(),
    description   : description,
    city          : (extra && extra.city)           || shipment.receiver_city  || null,
    office        : null,
    received_by   : (extra && extra.received_by)    || null,
    relationship  : null,
    delivery_proof: (extra && extra.delivery_proof) || [],
    file_base64   : null,
    vol_weight    : shipment.vol_weight || shipment.weight || null,
    weight        : shipment.weight     || null,
    gcs           : (extra && extra.gcs)            || null,
    details       : `AWB: ${shipment.awb}`,
  }

  const endpoint = getBase() + '/api/v1/providers/events'
  const result   = await httpPost(endpoint, JSON.stringify(payload), {
    'Authorization': 'Bearer ' + token,
  })

  if (result && result.error === false) {
    console.log(`[MA Webhook] ✓ Event pushed — ${tracking} → "${description}"`)
  } else {
    console.error(`[MA Webhook] ✗ Failed to push event for ${tracking}:`, result)
  }
}

module.exports = { pushEvent }
