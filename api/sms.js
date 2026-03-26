/**
 * Zamtel Bulk SMS Integration
 *
 * API Docs: Zamtel BulkSMS v2.1.1
 * Endpoint: https://bulksms.zamtel.co.zm/api/v2.1/action/send/
 *           api_key/:key/contacts/:contacts/senderId/:senderId/message/:message
 */

const https = require('https')
const http  = require('http')

const ZAMTEL_BASE = 'https://bulksms.zamtel.co.zm/api/v2.1/action/send'

/**
 * Send an SMS via Zamtel Bulk SMS API
 *
 * @param {object} opts
 * @param {string|string[]} opts.to      - E.164 number(s) e.g. '260965778086' or ['260965778086','260977...']
 * @param {string}          opts.message - Plain text message (will be URL-encoded)
 * @param {string}          [opts.senderId] - Sender ID (defaults to ZAMTEL_SENDER_ID env or 'OnlineExp')
 * @returns {Promise<{success:boolean, raw:string, status:number}>}
 */
async function sendSMS({ to, message, senderId }) {
  const apiKey  = process.env.ZAMTEL_SMS_API_KEY
  const sender  = senderId || process.env.ZAMTEL_SENDER_ID || 'OnlineExp'

  if (!apiKey) {
    throw new Error('ZAMTEL_SMS_API_KEY is not configured in .env')
  }

  // Normalise contacts — strip leading +, wrap in brackets for multiple
  const contacts = Array.isArray(to)
    ? to.map(n => n.replace(/^\+/, '')).join(',')
    : to.replace(/^\+/, '')

  const encodedMsg = encodeURIComponent(message)
  const url = `${ZAMTEL_BASE}/api_key/${apiKey}/contacts/${contacts}/senderId/${sender}/message/${encodedMsg}`

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300
        console.log(`[SMS] ${success ? 'OK' : 'FAIL'} → ${contacts} | status=${res.statusCode} | ${body.trim()}`)
        resolve({ success, raw: body.trim(), status: res.statusCode })
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('SMS request timed out')) })
  })
}

/**
 * Send a shipment status SMS notification
 * Only sends if ZAMTEL_SMS_API_KEY is set and the shipment has a receiver phone
 */
async function sendShipmentSMS(shipment, eventType) {
  // Handle both flat DB rows (receiver_phone) and formatted objects (receiver.phone)
  const phone = shipment?.receiver?.phone || shipment?.receiver_phone
  if (!phone || !process.env.ZAMTEL_SMS_API_KEY) return null

  const awb = shipment.awb || shipment.hawb || 'N/A'
  const messages = {
    booked:             `Online Express: Your shipment ${awb} has been booked. Track at onlineexpress.co.zm/track/${awb}`,
    confirmed:          `Online Express: Shipment ${awb} confirmed & being processed. Track: onlineexpress.co.zm/track/${awb}`,
    picked_up:          `Online Express: Shipment ${awb} picked up by our courier. Track: onlineexpress.co.zm/track/${awb}`,
    out_for_delivery:   `Online Express: Shipment ${awb} is out for delivery today. Track: onlineexpress.co.zm/track/${awb}`,
    delivered:          `Online Express: Shipment ${awb} successfully delivered. Thank you for choosing Online Express!`,
    delivery_failed:    `Online Express: Delivery attempt for ${awb} was unsuccessful. We will retry. Call 260XXXXXXX for help.`,
    return_to_sender:   `Online Express: Shipment ${awb} is being returned to sender. Contact us: 260XXXXXXX`,
    return:             `Online Express: Shipment ${awb} is being returned to sender. Contact us: 260XXXXXXX`,
  }

  const msg = messages[eventType]
  if (!msg) return null

  try {
    return await sendSMS({ to: phone, message: msg })
  } catch (err) {
    console.error(`[SMS] Failed to send ${eventType} SMS to ${phone}:`, err.message)
    return null
  }
}

module.exports = { sendSMS, sendShipmentSMS }
