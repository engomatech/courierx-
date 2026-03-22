/**
 * Mailer — Nodemailer wrapper for Online Express notification emails
 *
 * Reads SMTP config from the notification_settings SQLite table at send time
 * (not at startup), so config changes take effect immediately without restart.
 *
 * Usage:
 *   const { sendNotification } = require('./mailer')
 *   await sendNotification('delivered', shipment)   // shipment from DB row
 */

const nodemailer = require('nodemailer')
const db = require('./db')

/* ─────────────────────────────────────────────────────────────────────────────
   getSetting — read a single key from notification_settings
─────────────────────────────────────────────────────────────────────────────── */
function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM notification_settings WHERE key = ?').get(key)
  return row?.value ?? fallback
}

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM notification_settings').all()
  const obj = {}
  rows.forEach(r => { obj[r.key] = r.value })
  return obj
}

/* ─────────────────────────────────────────────────────────────────────────────
   createTransporter — builds a Nodemailer transporter from DB config
─────────────────────────────────────────────────────────────────────────────── */
function createTransporter() {
  const host       = getSetting('smtp_host')
  const port       = parseInt(getSetting('smtp_port', '587'), 10)
  const encryption = getSetting('smtp_encryption', 'TLS')
  const user       = getSetting('smtp_user')
  const pass       = getSetting('smtp_pass')

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured. Go to Admin → Settings → SMTP Email.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: encryption === 'SSL',  // SSL = 465 (secure:true), TLS = 587 (STARTTLS)
    auth: { user, pass },
    tls: { rejectUnauthorized: false },  // allow self-signed certs
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   HTML email templates — one per event type
─────────────────────────────────────────────────────────────────────────────── */
const BRAND = {
  primary   : '#f59e0b',   // amber
  dark      : '#1e293b',   // slate-900
  text      : '#475569',   // slate-600
  light     : '#f8fafc',   // slate-50
  borderR   : '12px',
}

function baseTemplate(title, bodyHtml, awb) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:${BRAND.borderR};overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07);">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND.dark};padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:-.5px;">Online Express</span>
                  <span style="color:${BRAND.primary};font-size:11px;font-weight:bold;margin-left:8px;text-transform:uppercase;letter-spacing:1px;">Logistics</span>
                </td>
                ${awb ? `<td align="right"><span style="background:rgba(245,158,11,.15);color:${BRAND.primary};font-family:monospace;font-size:13px;font-weight:bold;padding:4px 10px;border-radius:6px;">${awb}</span></td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:${BRAND.dark};font-size:22px;">${title}</h2>
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:${BRAND.light};padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              © Online Express Logistics &nbsp;·&nbsp; Lusaka, Zambia<br>
              <a href="http://163.245.221.133/track?awb=${awb || ''}" style="color:${BRAND.primary};text-decoration:none;">Track your shipment</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function row(label, value) {
  return `<tr>
    <td style="padding:6px 0;color:#94a3b8;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:600;">${value || '—'}</td>
  </tr>`
}

function infoTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">${rows}</table>`
}

function statusBadge(status, color = '#f59e0b') {
  return `<span style="display:inline-block;background:${color}22;color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px;">${status}</span>`
}

/* ── Template builders ── */

function bookedEmail(s) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Your shipment has been successfully booked with Online Express. We will collect it shortly.
    </p>
    ${statusBadge('Booked', '#3b82f6')}
    ${infoTable(
      row('AWB Number', `<span style="font-family:monospace;">${s.awb}</span>`) +
      row('Service', s.service_type) +
      row('Receiver', s.receiver_name) +
      row('Destination', `${s.receiver_city}, ${s.receiver_country}`) +
      row('Weight', s.weight ? `${s.weight} kg` : '—') +
      row('Pieces', s.quantity || 1) +
      (s.partner_reference ? row('Your Ref', s.partner_reference) : '')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0 0;">
      <a href="http://163.245.221.133/track?awb=${s.awb}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Shipment</a>
    </p>`
  return {
    subject: `Shipment Booked — ${s.awb}`,
    html   : baseTemplate('Shipment Booked', body, s.awb),
  }
}

function outForDeliveryEmail(s) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Great news! Your parcel is on its way and will be delivered today.
    </p>
    ${statusBadge('Out for Delivery', '#f59e0b')}
    ${infoTable(
      row('AWB Number', `<span style="font-family:monospace;">${s.awb}</span>`) +
      row('Receiver', s.receiver_name) +
      row('Address', s.receiver_address) +
      row('City', s.receiver_city)
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0 0;">
      Please ensure someone is available to receive the parcel. If no one is available, our driver will leave a notification card.<br><br>
      <a href="http://163.245.221.133/track?awb=${s.awb}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Now</a>
    </p>`
  return {
    subject: `Your parcel is out for delivery — ${s.awb}`,
    html   : baseTemplate('Out for Delivery Today', body, s.awb),
  }
}

function deliveredEmail(s, details = {}) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Your shipment has been successfully delivered. Thank you for choosing Online Express!
    </p>
    ${statusBadge('Delivered', '#22c55e')}
    ${infoTable(
      row('AWB Number', `<span style="font-family:monospace;">${s.awb}</span>`) +
      row('Receiver', s.receiver_name) +
      row('Delivered to', details.recipient_name || s.receiver_name) +
      row('Delivered at', details.city || s.receiver_city) +
      row('Date', details.date || new Date().toLocaleDateString())
    )}
    <p style="color:#475569;font-size:14px;margin:20px 0 0;">
      We hope you are satisfied with our service.
      <a href="http://163.245.221.133" style="color:#f59e0b;">Visit our website</a> to book your next shipment.
    </p>`
  return {
    subject: `Delivered ✓ — ${s.awb}`,
    html   : baseTemplate('Shipment Delivered', body, s.awb),
  }
}

function failedEmail(s, details = {}) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      We attempted to deliver your shipment but were unable to complete the delivery.
    </p>
    ${statusBadge('Delivery Failed', '#ef4444')}
    ${infoTable(
      row('AWB Number', `<span style="font-family:monospace;">${s.awb}</span>`) +
      row('Reason', details.reason || 'Recipient not available') +
      row('Attempted at', details.city || s.receiver_city) +
      row('Date', details.date || new Date().toLocaleDateString())
    )}
    <p style="color:#475569;font-size:14px;margin:20px 0 0;">
      Our driver will attempt redelivery. You may also contact us at
      <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a>
      or call <strong>+260 975 525 181</strong> to arrange collection.
    </p>`
  return {
    subject: `Delivery Attempted — ${s.awb}`,
    html   : baseTemplate('Delivery Attempt Failed', body, s.awb),
  }
}

function paymentRequestEmail(s, details = {}) {
  const amount   = details.amount   || s.payment_amount
  const currency = details.currency || s.payment_currency || 'ZMW'
  const trackUrl = `http://163.245.221.133/track/${s.hawb || s.awb}`
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hi ${s.receiver_name}, your shipment from <strong>${s.sender_name || s.origin_carrier || 'your supplier'}</strong> has arrived at our hub and is ready for processing.
      A shipping fee is required before your parcel can be dispatched.
    </p>
    ${statusBadge('Payment Required', '#f59e0b')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;">${s.hawb || s.awb}</span>`) +
      row('OEX AWB', `<span style="font-family:monospace;">${s.awb}</span>`) +
      (s.mawb ? row('MAWB', `<span style="font-family:monospace;">${s.mawb}</span>`) : '') +
      row('Amount Due', amount ? `<strong style="color:#d97706;font-size:16px;">${currency} ${Number(amount).toFixed(2)}</strong>` : 'To be confirmed') +
      row('Delivery', (s.delivery_method || 'domestic_courier').replace(/_/g, ' ')) +
      row('Description', s.description || '—')
    )}
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:16px 0;">
      To pay and arrange delivery, please contact Online Express:<br>
      📞 <strong>+260 975 525 181</strong> &nbsp;·&nbsp;
      ✉ <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a>
    </p>
    <p style="margin:20px 0 0;">
      <a href="${trackUrl}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Shipment</a>
    </p>`
  return {
    subject: `Payment Required for Your Shipment — ${s.hawb || s.awb}`,
    html   : baseTemplate('Shipping Fee Payment Required', body, s.hawb || s.awb),
  }
}

function paymentConfirmedEmail(s) {
  const trackUrl = `http://163.245.221.133/track/${s.hawb || s.awb}`
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hi ${s.receiver_name}, your payment has been received and your shipment has been cleared for dispatch. We will be in touch shortly with delivery details.
    </p>
    ${statusBadge('Payment Confirmed', '#22c55e')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;">${s.hawb || s.awb}</span>`) +
      row('Amount Paid', s.payment_amount ? `${s.payment_currency || 'ZMW'} ${Number(s.payment_amount).toFixed(2)}` : '—') +
      row('Method', s.payment_method ? s.payment_method.replace(/_/g, ' ') : '—') +
      row('Status', 'Cleared for dispatch')
    )}
    <p style="margin:20px 0 0;">
      <a href="${trackUrl}" style="background:#22c55e;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Shipment</a>
    </p>`
  return {
    subject: `Payment Confirmed — Your Shipment is Being Processed`,
    html   : baseTemplate('Payment Confirmed ✓', body, s.hawb || s.awb),
  }
}

/* ── KYC Invitation email — sent to auto-created customers ── */
function kycInvitationEmail(customer, firstShipment = null) {
  const APP_URL    = process.env.APP_URL || 'http://163.245.221.133'
  const joinUrl    = `${APP_URL}/portal/join?token=${customer.invitation_token}`
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${customer.name}</strong>, a parcel from <strong>${customer.created_from || 'your supplier'}</strong> is on its way to you through Online Express!
    </p>
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;color:#6d28d9;font-size:14px;font-weight:700;">📦 Parcel in Transit</p>
      ${firstShipment
        ? `<p style="margin:6px 0 0;color:#475569;font-size:13px;">Tracking: <span style="font-family:monospace;font-weight:600;">${firstShipment.hawb || firstShipment.awb}</span></p>`
        : ''}
      <p style="margin:6px 0 0;color:#475569;font-size:13px;">To receive your parcel, please complete your profile and identity verification.</p>
    </div>
    ${infoTable(
      row('Your Name', customer.name) +
      row('Your Email', customer.email) +
      row('Your Phone', customer.phone || '—') +
      row('Delivery City', customer.city || '—')
    )}
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:16px 0;">
      As part of our compliance requirements, all customers must complete identity verification (KYC) before we can process your delivery. This only takes a few minutes.
    </p>
    <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px;">
      You will need:&nbsp; ✓ Your NRC / Passport &nbsp;·&nbsp; ✓ A clear photo or scan of your ID document
    </p>
    <p style="margin:0 0 8px;">
      <a href="${joinUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">Complete Your Profile →</a>
    </p>
    <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">This link is secure and expires in 30 days. Do not share it with anyone.</p>`
  return {
    subject: `Your parcel is on its way — complete your profile to receive it`,
    html   : baseTemplate('Complete Your Profile', body, firstShipment?.awb || null),
  }
}

function returnEmail(s) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Your shipment is being returned to the sender after failed delivery attempts.
    </p>
    ${statusBadge('Returned to Sender', '#8b5cf6')}
    ${infoTable(
      row('AWB Number', `<span style="font-family:monospace;">${s.awb}</span>`) +
      row('Original Receiver', s.receiver_name) +
      row('Returning to', s.sender_name) +
      row('Return City', s.sender_city)
    )}
    <p style="color:#475569;font-size:14px;margin:20px 0 0;">
      Please contact us at <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a> for further assistance.
    </p>`
  return {
    subject: `Shipment Return Initiated — ${s.awb}`,
    html   : baseTemplate('Shipment Returned to Sender', body, s.awb),
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   EVENT_MAP — maps event type → { template fn, recipient ('sender'|'receiver'|'ops') }
─────────────────────────────────────────────────────────────────────────────── */
const EVENT_MAP = {
  booked            : { buildEmail: bookedEmail,           recipient: 'sender',   settingKey: 'notify_booked' },
  out_for_delivery  : { buildEmail: outForDeliveryEmail,   recipient: 'receiver', settingKey: 'notify_out_for_delivery' },
  delivered         : { buildEmail: deliveredEmail,        recipient: 'receiver', settingKey: 'notify_delivered' },
  delivery_failed   : { buildEmail: failedEmail,           recipient: 'receiver', settingKey: 'notify_delivery_failed' },
  return            : { buildEmail: returnEmail,           recipient: 'sender',   settingKey: 'notify_return' },
  payment_request   : { buildEmail: paymentRequestEmail,   recipient: 'receiver', settingKey: 'notify_booked' },  // reuse booked toggle
  payment_confirmed : { buildEmail: paymentConfirmedEmail, recipient: 'receiver', settingKey: 'notify_booked' },
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendNotification — main function
   event: 'booked' | 'out_for_delivery' | 'delivered' | 'delivery_failed' | 'return'
   shipment: DB row from shipments table
   details: optional { reason, recipient_name, city, date }
   toEmail: optional override email address (if not set, uses shipment sender/receiver email)
─────────────────────────────────────────────────────────────────────────────── */
async function sendNotification(event, shipment, details = {}, toEmail = null) {
  const config = EVENT_MAP[event]
  if (!config) throw new Error(`Unknown notification event: ${event}`)

  // Check if this event is enabled
  const enabled = getSetting(config.settingKey, '1')
  if (enabled !== '1') {
    return { skipped: true, reason: `${event} notifications are disabled` }
  }

  // Resolve recipient email
  let recipientEmail = toEmail
  if (!recipientEmail) {
    if (config.recipient === 'sender')   recipientEmail = shipment.sender_email
    if (config.recipient === 'receiver') recipientEmail = shipment.receiver_email
  }
  // Also always CC/send to ops notification email if configured
  const opsEmail = getSetting('ops_notify_email', '')

  if (!recipientEmail && !opsEmail) {
    return { skipped: true, reason: 'No recipient email address available' }
  }

  const { subject, html } = config.buildEmail(shipment, details)
  const fromName  = getSetting('smtp_from_name', 'Online Express')
  const fromEmail = getSetting('smtp_from_email', '')

  const transporter = createTransporter()

  const to = [recipientEmail, opsEmail].filter(Boolean).join(', ')

  const info = await transporter.sendMail({
    from   : `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  })

  return { success: true, messageId: info.messageId, to }
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendTestEmail — for admin SMTP verification
─────────────────────────────────────────────────────────────────────────────── */
async function sendTestEmail(toEmail) {
  const fromName  = getSetting('smtp_from_name', 'Online Express')
  const fromEmail = getSetting('smtp_from_email', '')

  const transporter = createTransporter()

  const html = baseTemplate(
    'SMTP Test Successful',
    `<p style="color:#475569;font-size:15px;line-height:1.6;">
      Your SMTP configuration is working correctly. Online Express notification emails are ready to send.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">✓ Connection successful</p>
      <p style="margin:4px 0 0;color:#166534;font-size:13px;">Sent from: ${fromEmail}</p>
    </div>`,
    null
  )

  const info = await transporter.sendMail({
    from   : `"${fromName}" <${fromEmail}>`,
    to     : toEmail,
    subject: 'Online Express — SMTP Test Email',
    html,
  })

  return { success: true, messageId: info.messageId }
}

/* ─────────────────────────────────────────────────────────────────────────────
   mapStatusToEvent — convert a status string to notification event key
─────────────────────────────────────────────────────────────────────────────── */
function mapStatusToEvent(status) {
  const MAP = {
    'Booked'           : 'booked',
    'Out for Delivery' : 'out_for_delivery',
    'Delivered'        : 'delivered',
    'Delivery Failed'  : 'delivery_failed',
    'NDR'              : 'delivery_failed',
    'Return'           : 'return',
    'Returned'         : 'return',
  }
  return MAP[status] || null
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendKycInvitation — standalone invite (not via EVENT_MAP)
   customer: customers DB row (must have invitation_token + email)
   firstShipment: optional shipments DB row for tracking reference in email
─────────────────────────────────────────────────────────────────────────────── */
async function sendKycInvitation(customer, firstShipment = null) {
  if (!customer.email) throw new Error('Customer has no email address.')
  if (!customer.invitation_token) throw new Error('Customer has no invitation token.')

  const { subject, html } = kycInvitationEmail(customer, firstShipment)
  const fromName  = getSetting('smtp_from_name', 'Online Express')
  const fromEmail = getSetting('smtp_from_email', '')

  const transporter = createTransporter()
  const info = await transporter.sendMail({
    from   : `"${fromName}" <${fromEmail}>`,
    to     : customer.email,
    subject,
    html,
  })

  return { success: true, messageId: info.messageId, to: customer.email }
}

module.exports = { sendNotification, sendTestEmail, mapStatusToEvent, getAllSettings, getSetting, sendKycInvitation }
