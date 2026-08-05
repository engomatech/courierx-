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
   createMailOptions — returns { from, replyTo } safe for the SMTP provider.

   Gmail SMTP only allows sending from the authenticated account. If the
   configured smtp_from_email differs from smtp_user (e.g. noreply@onlineexpress.co.zm
   vs courierxpresszm@gmail.com), Gmail adds a "via gmail.com" annotation that
   triggers spam filters.  Fix: always send FROM the authenticated account, and
   set Reply-To to the branded address so replies still go to the right place.
─────────────────────────────────────────────────────────────────────────────── */
function createMailOptions() {
  const fromName  = getSetting('smtp_from_name',  'Online Express')
  const fromEmail = getSetting('smtp_from_email', '')
  const smtpUser  = getSetting('smtp_user',       '')
  const smtpHost  = getSetting('smtp_host',       '')

  const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.')
  // For Gmail: always send from the authenticated account to avoid spam flags
  const sender  = isGmail ? smtpUser : (fromEmail || smtpUser)
  const replyTo = isGmail && fromEmail && fromEmail !== smtpUser ? fromEmail : undefined

  return {
    from   : `"${fromName}" <${sender}>`,
    ...(replyTo ? { replyTo } : {}),
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   htmlToText — strips HTML to produce a plain-text alternative.
   Sending both text + html significantly improves deliverability.
─────────────────────────────────────────────────────────────────────────────── */
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi,      '\n\n')
    .replace(/<\/tr>/gi,     '\n')
    .replace(/<\/td>/gi,     '  ')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 [$1]')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g,     '')
    .replace(/&amp;/g,       '&')
    .replace(/&lt;/g,        '<')
    .replace(/&gt;/g,        '>')
    .replace(/&nbsp;/g,      ' ')
    .replace(/&#x2022;/g,    '•')
    .replace(/\n{3,}/g,      '\n\n')
    .trim()
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
              <a href="https://www.onlineexpress.co.zm/track?awb=${awb || ''}" style="color:${BRAND.primary};text-decoration:none;">Track your shipment</a>
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
      <a href="https://www.onlineexpress.co.zm/track?awb=${s.awb}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Shipment</a>
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
      <a href="https://www.onlineexpress.co.zm/track?awb=${s.awb}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Now</a>
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
      <a href="https://www.onlineexpress.co.zm" style="color:#f59e0b;">Visit our website</a> to book your next shipment.
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
  const trackUrl = `https://www.onlineexpress.co.zm/track/${s.hawb || s.awb}`
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
  const trackUrl = `https://www.onlineexpress.co.zm/track/${s.hawb || s.awb}`
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
  const APP_URL    = process.env.APP_URL || 'https://www.onlineexpress.co.zm'
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

/* ── Email Verification email ── */
function verificationEmail({ name, verifyUrl }) {
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${name}</strong>, thank you for registering with Online Express!
      Please verify your email address to activate your account.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${verifyUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block;letter-spacing:.3px;">
        Verify My Email Address →
      </a>
    </p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color:#7c3aed;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;text-align:center;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>`
  return {
    subject: 'Verify your Online Express account',
    html   : baseTemplate('Verify Your Email Address', body, null),
  }
}

/* ── Welcome / Registration email ── */
function welcomeEmail({ name, email, customerId }) {
  const APP_URL = process.env.APP_URL || 'https://www.onlineexpress.co.zm'
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${name}</strong>, welcome to Online Express! Your account has been created successfully.
    </p>
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px 24px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 6px;color:#6d28d9;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Your Customer ID</p>
      <p style="margin:0;color:#3b0764;font-size:32px;font-weight:900;font-family:monospace;letter-spacing:4px;">${customerId}</p>
      <p style="margin:8px 0 0;color:#7c3aed;font-size:12px;">Use this ID or your email address to log in at any time</p>
    </div>
    ${infoTable(
      row('Name',  name) +
      row('Email', email) +
      row('Customer ID', `<span style="font-family:monospace;font-weight:700;color:#7c3aed;">${customerId}</span>`)
    )}
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:16px 0;">
      Please keep your Customer ID safe — you can use it to log in instead of your email address.
    </p>
    <p style="margin:20px 0 0;">
      <a href="${APP_URL}/portal" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">Go to My Portal →</a>
    </p>`
  return {
    subject: `Welcome to Online Express — Your Customer ID: ${customerId}`,
    html   : baseTemplate('Welcome to Online Express', body, null),
  }
}

function dispatchedEmail(s, details = {}) {
  const name      = s.receiver_name || 'Customer'
  const hawb      = s.hawb || s.awb
  const trackUrl  = `https://www.onlineexpress.co.zm/track/${hawb}`
  const eta       = details.eta
    ? new Date(details.eta).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Lusaka' })
    : '—'
  const grossWt   = s.weight ? `${Number(s.weight).toFixed(4)} kg` : '—'
  const volWt     = s.volumetric_weight ? `${Number(s.volumetric_weight).toFixed(4)} kg` : '0.0000 kg'
  const chargeWt  = s.chargeable_weight || s.weight || '—'
  const goodsVal  = s.goods_value || s.declared_value || s.payment_amount || '—'
  const courier   = s.origin_carrier || s.service_type || details.courier || '—'
  const supplierRef = s.supplier_reference || s.partner_reference || s.mawb || '—'

  // Contents table — if s.contents is a JSON array of items
  let contentsHtml = ''
  try {
    const items = typeof s.contents === 'string' ? JSON.parse(s.contents) : s.contents
    if (Array.isArray(items) && items.length) {
      const rows = items.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${item.description || item.name || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${item.subcategory || item.category || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${item.value ? `${item.value}` : '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${item.weight ? `${item.weight} kg` : '—'}</td>
        </tr>`).join('')
      contentsHtml = `
        <h3 style="color:#1e293b;font-size:14px;font-weight:700;margin:24px 0 8px;">Contents Information</h3>
        <table width="100%" style="border-collapse:collapse;margin:0 0 16px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:left;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Description</th>
              <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:left;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Category</th>
              <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Value</th>
              <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Weight</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
    } else if (s.description) {
      contentsHtml = `<p style="color:#475569;font-size:13px;margin:12px 0;"><strong>Contents:</strong> ${s.description}</p>`
    }
  } catch (_) {
    if (s.description) contentsHtml = `<p style="color:#475569;font-size:13px;margin:12px 0;"><strong>Contents:</strong> ${s.description}</p>`
  }

  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Dear <strong>${name}</strong>,
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
      We are pleased to confirm that your parcel listed below has now left our warehouse and is in transit for forwarding to the destination country.
    </p>
    ${statusBadge('In Transit', '#3b82f6')}
    <p style="color:#475569;font-size:14px;font-weight:600;margin:16px 0 4px;">
      Estimated Arrival Date: <span style="color:#1e293b;">${eta}</span>
    </p>
    ${infoTable(
      row('HAWB (Tracking Number)', `<span style="font-family:monospace;font-weight:700;font-size:14px;">${hawb}</span>`) +
      row('Gross Weight',           grossWt) +
      row('Volume Weight',          volWt) +
      row('Chargeable Weight',      chargeWt) +
      row('Courier Company',        courier) +
      row('Supplier Tracking No.',  supplierRef) +
      row('Goods Value TOTAL',      goodsVal ? `<strong>${goodsVal}</strong>` : '—')
    )}
    ${contentsHtml}
    <p style="margin:20px 0 8px;">
      <a href="${trackUrl}" style="background:#3b82f6;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
        Track Your Parcel Online
      </a>
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700;">⚠️ Action Required — Profile Compliance</p>
      <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6;">
        To avoid delays, please ensure your account profile is up to date with:
      </p>
      <ul style="margin:6px 0 0;padding-left:18px;color:#92400e;font-size:12px;line-height:1.8;">
        <li>Full billing &amp; delivery address (house/flat number, road name, town, country and postal code)</li>
        <li>Your TPIN (Tax Payer Identification Number)</li>
      </ul>
      <p style="margin:8px 0 0;">
        <a href="https://www.onlineexpress.co.zm/portal/profile" style="color:#d97706;font-size:12px;font-weight:700;text-decoration:none;">
          Update My Profile →
        </a>
      </p>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;line-height:1.8;">
      For enquiries contact us:&nbsp;
      📞 <strong style="color:#475569;">+260 975 525 181</strong> &nbsp;·&nbsp;
      ✉ <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a><br>
      <a href="https://www.onlineexpress.co.zm/terms" style="color:#94a3b8;font-size:11px;">Terms &amp; Conditions</a>
    </p>`

  return {
    subject: `Parcel Dispatched — ${hawb} | ETA: ${eta}`,
    html   : baseTemplate(`Parcel Dispatched — In Transit`, body, hawb),
  }
}

function receivedAtHubEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been received at our hub and is now being processed.
    </p>
    ${statusBadge('Received at Hub', '#7c3aed')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Description', s.description || s.goodsDescription || '—') +
      row('Weight', s.weight ? `${s.weight} kg` : '—')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">We will notify you at each stage of processing.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Received at Hub — ${hawb}`, html: baseTemplate('Parcel Received at Hub', body, hawb) }
}

function receivedInZambiaEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, great news — your parcel has arrived in Zambia and has been received from the airline handlers.
    </p>
    ${statusBadge('Received in Zambia', '#0d9488')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Next Step', 'Customs clearance — we will keep you updated')
    )}
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#0d9488;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Your Parcel Has Arrived in Zambia — ${hawb}`, html: baseTemplate('Parcel Arrived in Zambia', body, hawb) }
}

function customsHoldEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been placed on hold by Zambia Customs for further assessment.
    </p>
    ${statusBadge('Customs Hold', '#dc2626')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Status', '<strong style="color:#dc2626;">On Hold — Action may be required</strong>') +
      row('TPIN Required', 'Ensure your TPIN is updated on your profile') +
      row('Description', s.description || '—')
    )}
    <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#9a3412;font-size:13px;font-weight:700;">⚠️ Action Required</p>
      <p style="margin:0;color:#9a3412;font-size:12px;line-height:1.6;">
        Our team will contact you with details. To avoid delays, please ensure your TPIN and full delivery address are up to date on your profile.
      </p>
      <p style="margin:8px 0 0;"><a href="https://www.onlineexpress.co.zm/portal/profile" style="color:#d97706;font-size:12px;font-weight:700;text-decoration:none;">Update My Profile →</a></p>
    </div>
    <p style="color:#475569;font-size:13px;">Contact us: 📞 <strong>+260 975 525 181</strong> · <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a></p>`
  return { subject: `⚠️ Customs Hold — Action Required — ${hawb}`, html: baseTemplate('Customs Hold — Action Required', body, hawb) }
}

function customsClearedEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has successfully cleared customs!
    </p>
    ${statusBadge('Customs Cleared ✓', '#16a34a')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Next Step', 'Proceeding to sorting centre for final delivery preparation')
    )}
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#16a34a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Customs Cleared ✓ — ${hawb}`, html: baseTemplate('Parcel Cleared Customs', body, hawb) }
}

function readyForCollectionEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const collectionPoint = s.receiver_city || 'Online Express branch'
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel is ready for collection!
    </p>
    ${statusBadge('Ready for Collection', '#059669')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Collection Point', `<strong>${collectionPoint}</strong>`) +
      row('What to Bring', 'Valid ID (NRC / Passport) + your Customer ID')
    )}
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0;color:#14532d;font-size:13px;font-weight:700;">📦 Ready — please collect at your earliest convenience</p>
      <p style="margin:6px 0 0;color:#166534;font-size:12px;">Storage charges may apply after the free storage period. Contact us if you cannot collect promptly.</p>
    </div>
    <p style="color:#475569;font-size:13px;">Contact us: 📞 <strong>+260 975 525 181</strong> · <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a></p>`
  return { subject: `Parcel Ready for Collection — ${hawb}`, html: baseTemplate('Ready for Collection', body, hawb) }
}

function collectedEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been successfully collected. Thank you for choosing Online Express!
    </p>
    ${statusBadge('Collected ✓', '#059669')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Collected by', s.receiver_name || '—') +
      row('Date', new Date().toLocaleDateString('en-GB'))
    )}
    <p style="color:#475569;font-size:14px;margin:20px 0 0;">
      We hope you are happy with your delivery. <a href="https://www.onlineexpress.co.zm" style="color:#f59e0b;">Book your next shipment</a> any time.
    </p>`
  return { subject: `Parcel Collected ✓ — ${hawb}`, html: baseTemplate('Parcel Collected — Thank You', body, hawb) }
}

function hubInspectionEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel is undergoing standard content verification at our hub.
    </p>
    ${statusBadge('Hub Inspection', '#7c3aed')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Status', 'Content verification in progress') +
      row('Next Step', 'Weighing and warehouse processing')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">We will notify you once processing is complete.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Under Hub Inspection — ${hawb}`, html: baseTemplate('Hub Inspection Underway', body, hawb) }
}

function parcelWeighedEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been weighed and the chargeable weight is being updated.
    </p>
    ${statusBadge('Parcel Weighed', '#a21caf')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Gross Weight', s.weight ? `${s.weight} kg` : 'Being updated') +
      row('Next Step', 'Warehouse processing before dispatch')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">Your chargeable weight will reflect on your shipment record shortly.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#a21caf;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Weighed — ${hawb}`, html: baseTemplate('Parcel Weighed', body, hawb) }
}

function processedAtWarehouseEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been processed at the warehouse and is ready for dispatch.
    </p>
    ${statusBadge('Processed at Warehouse', '#6d28d9')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Description', s.description || s.goodsDescription || '—') +
      row('Weight', s.weight ? `${s.weight} kg` : '—') +
      row('Next Step', 'Dispatch from hub')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">Your parcel is being prepared for dispatch. You will receive another notification when it leaves the hub.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#6d28d9;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Processed — Ready for Dispatch — ${hawb}`, html: baseTemplate('Processed at Warehouse', body, hawb) }
}

function dispatchedFromHubEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been dispatched from our hub and is on its way to Zambia.
    </p>
    ${statusBadge('Dispatched from Hub', '#1d4ed8')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Description', s.description || s.goodsDescription || '—') +
      row('Weight', s.weight ? `${s.weight} kg` : '—') +
      row('Next Update', 'In transit to Zambia')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">Your parcel is now on its way. We will notify you when it arrives in Zambia.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Dispatched from Hub — ${hawb}`, html: baseTemplate('Dispatched from Hub', body, hawb) }
}

function inTransitEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel is now in transit to Zambia.
    </p>
    ${statusBadge('In Transit', '#2563eb')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Description', s.description || s.goodsDescription || '—') +
      row('Weight', s.weight ? `${s.weight} kg` : '—') +
      row('Destination', `${s.receiver_city || '—'}, Zambia`)
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">We will notify you as soon as your parcel arrives in Zambia and clears customs.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel In Transit to Zambia — ${hawb}`, html: baseTemplate('Parcel In Transit', body, hawb) }
}

function underCustomsClearanceEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel is currently undergoing customs clearance with ZRA.
    </p>
    ${statusBadge('Under Customs Clearance', '#d97706')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Status', 'Customs clearance in progress') +
      row('TPIN', 'Ensure your TPIN is updated on your profile')
    )}
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0 0 4px;color:#92400e;font-size:13px;font-weight:700;">💡 Tip — Avoid Delays</p>
      <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6;">
        Make sure your TPIN and delivery address are up to date on your profile to avoid any hold-ups during clearance.
      </p>
      <p style="margin:8px 0 0;"><a href="https://www.onlineexpress.co.zm/portal/profile" style="color:#d97706;font-size:12px;font-weight:700;text-decoration:none;">Update My Profile →</a></p>
    </div>
    <p style="color:#475569;font-size:13px;">Contact us: 📞 <strong>+260 975 525 181</strong> · <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a></p>`
  return { subject: `Parcel Under Customs Clearance — ${hawb}`, html: baseTemplate('Customs Clearance in Progress', body, hawb) }
}

function arrivedAtSortingEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has cleared customs and arrived at our sorting centre.
    </p>
    ${statusBadge('Arrived at Sorting', '#0891b2')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Location', 'Online Express Sorting Centre') +
      row('Next Step', 'Your parcel will be ready for collection shortly')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">We are preparing your parcel for collection. You will be notified as soon as it is ready.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#0891b2;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel Arrived at Sorting Centre — ${hawb}`, html: baseTemplate('Arrived at Sorting Centre', body, hawb) }
}

function atDistributionCentreEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has arrived at our distribution centre and is being prepared for onward transfer.
    </p>
    ${statusBadge('At Distribution Centre', '#0f766e')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Location', 'Online Express Distribution Centre') +
      row('Delivery City', s.receiver_city || '—') +
      row('Next Step', 'Inland transfer to your local collection point')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">We will notify you when your parcel is transferred to your local branch.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel at Distribution Centre — ${hawb}`, html: baseTemplate('At Distribution Centre', body, hawb) }
}

function inlandTransferEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has been dispatched to your local collection point.
    </p>
    ${statusBadge('Inland Transfer', '#0369a1')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Destination Branch', s.receiver_city || '—') +
      row('Next Step', 'Arrival at your local Online Express branch')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">Your parcel is on its way to your area. We will notify you when it arrives at your local branch and is ready for collection.</p>
    <p style="margin:16px 0 0;"><a href="https://www.onlineexpress.co.zm/track/${hawb}" style="background:#0369a1;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Track Your Parcel</a></p>`
  return { subject: `Parcel In Transit to Your Local Branch — ${hawb}`, html: baseTemplate('Inland Transfer Underway', body, hawb) }
}

function arrivedAtLocalBranchEmail(s) {
  const name = s.receiver_name || 'Customer'
  const hawb = s.hawb || s.awb
  const branch = s.receiver_city || 'your local Online Express branch'
  const body = `
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Dear <strong>${name}</strong>, your parcel has arrived at your local Online Express branch in <strong>${branch}</strong> and will be ready for collection shortly.
    </p>
    ${statusBadge('Arrived at Local Branch', '#0e7490')}
    ${infoTable(
      row('HAWB / Tracking', `<span style="font-family:monospace;font-weight:700;">${hawb}</span>`) +
      row('Branch', branch) +
      row('What to Bring', 'Valid ID (NRC / Passport) + your Customer ID') +
      row('Next Step', 'Ready for collection notification coming soon')
    )}
    <p style="color:#475569;font-size:13px;margin:16px 0;">You will receive a final notification when your parcel is confirmed ready for collection.</p>
    <p style="color:#475569;font-size:13px;">Contact us: 📞 <strong>+260 975 525 181</strong> · <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a></p>`
  return { subject: `Parcel Arrived at ${branch} Branch — ${hawb}`, html: baseTemplate('Arrived at Local Branch', body, hawb) }
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
  booked                    : { buildEmail: bookedEmail,                  recipient: 'sender',   settingKey: 'notify_booked' },
  // Hub process — origin
  hub_received              : { buildEmail: receivedAtHubEmail,           recipient: 'receiver', settingKey: 'notify_booked' },
  hub_inspection            : { buildEmail: hubInspectionEmail,           recipient: 'receiver', settingKey: 'notify_booked' },
  parcel_weighed            : { buildEmail: parcelWeighedEmail,           recipient: 'receiver', settingKey: 'notify_booked' },
  processed_at_warehouse    : { buildEmail: processedAtWarehouseEmail,    recipient: 'receiver', settingKey: 'notify_booked' },
  dispatched_from_hub       : { buildEmail: dispatchedFromHubEmail,       recipient: 'receiver', settingKey: 'notify_booked' },
  in_transit                : { buildEmail: inTransitEmail,               recipient: 'receiver', settingKey: 'notify_booked' },
  dispatched                : { buildEmail: dispatchedEmail,              recipient: 'receiver', settingKey: 'notify_booked' },
  // Zambia arrival
  received_in_zambia        : { buildEmail: receivedInZambiaEmail,        recipient: 'receiver', settingKey: 'notify_booked' },
  under_customs_clearance   : { buildEmail: underCustomsClearanceEmail,   recipient: 'receiver', settingKey: 'notify_booked' },
  customs_hold              : { buildEmail: customsHoldEmail,             recipient: 'receiver', settingKey: 'notify_booked' },
  customs_cleared           : { buildEmail: customsClearedEmail,          recipient: 'receiver', settingKey: 'notify_booked' },
  arrived_at_sorting        : { buildEmail: arrivedAtSortingEmail,        recipient: 'receiver', settingKey: 'notify_booked' },
  ready_for_collection      : { buildEmail: readyForCollectionEmail,      recipient: 'receiver', settingKey: 'notify_booked' },
  collected                 : { buildEmail: collectedEmail,               recipient: 'receiver', settingKey: 'notify_booked' },
  // Outstation
  at_distribution_centre    : { buildEmail: atDistributionCentreEmail,    recipient: 'receiver', settingKey: 'notify_booked' },
  inland_transfer           : { buildEmail: inlandTransferEmail,          recipient: 'receiver', settingKey: 'notify_booked' },
  arrived_at_local_branch   : { buildEmail: arrivedAtLocalBranchEmail,    recipient: 'receiver', settingKey: 'notify_booked' },
  out_for_delivery      : { buildEmail: outForDeliveryEmail,      recipient: 'receiver', settingKey: 'notify_out_for_delivery' },
  delivered             : { buildEmail: deliveredEmail,           recipient: 'receiver', settingKey: 'notify_delivered' },
  delivery_failed       : { buildEmail: failedEmail,              recipient: 'receiver', settingKey: 'notify_delivery_failed' },
  return                : { buildEmail: returnEmail,              recipient: 'sender',   settingKey: 'notify_return' },
  payment_request       : { buildEmail: paymentRequestEmail,      recipient: 'receiver', settingKey: 'notify_booked' },
  payment_confirmed     : { buildEmail: paymentConfirmedEmail,    recipient: 'receiver', settingKey: 'notify_booked' },
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
  const transporter = createTransporter()
  const opts        = createMailOptions()
  const to          = [recipientEmail, opsEmail].filter(Boolean).join(', ')

  const info = await transporter.sendMail({
    ...opts, to, subject, html,
    text: htmlToText(html),
  })

  return { success: true, messageId: info.messageId, to }
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendTestEmail — for admin SMTP verification
─────────────────────────────────────────────────────────────────────────────── */
async function sendTestEmail(toEmail) {
  const transporter = createTransporter()
  const opts        = createMailOptions()

  const html = baseTemplate(
    'SMTP Test Successful',
    `<p style="color:#475569;font-size:15px;line-height:1.6;">
      Your SMTP configuration is working correctly. Online Express notification emails are ready to send.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">✓ Connection successful</p>
      <p style="margin:4px 0 0;color:#166534;font-size:13px;">Sent from: ${opts.from}</p>
    </div>`,
    null
  )

  const info = await transporter.sendMail({
    ...opts,
    to     : toEmail,
    subject: 'Online Express — SMTP Test Email',
    html,
    text   : 'SMTP test successful. Your Online Express email configuration is working.',
  })

  return { success: true, messageId: info.messageId }
}

/* ─────────────────────────────────────────────────────────────────────────────
   mapStatusToEvent — convert a status string to notification event key
─────────────────────────────────────────────────────────────────────────────── */
function mapStatusToEvent(status) {
  const MAP = {
    'Booked'                    : 'booked',
    // Hub process — origin
    'Received at Hub'           : 'hub_received',
    'Hub Inspection'            : 'hub_inspection',
    'Parcel Weighed'            : 'parcel_weighed',
    'Processed at Warehouse'    : 'processed_at_warehouse',
    'Dispatched from Hub'       : 'dispatched_from_hub',
    'In Transit'                : 'in_transit',
    'Manifested'                : 'dispatched',
    'Dispatched'                : 'dispatched',
    // Zambia arrival
    'Received in Zambia'        : 'received_in_zambia',
    'Under Customs Clearance'   : 'under_customs_clearance',
    'Customs Hold'              : 'customs_hold',
    'Customs Cleared'           : 'customs_cleared',
    'Arrived at Sorting'        : 'arrived_at_sorting',
    'Ready for Collection'      : 'ready_for_collection',
    'Collected'                 : 'collected',
    // Outstation
    'At Distribution Centre'    : 'at_distribution_centre',
    'Inland Transfer'           : 'inland_transfer',
    'Arrived at Local Branch'   : 'arrived_at_local_branch',
    // Domestic delivery
    'Out for Delivery'          : 'out_for_delivery',
    'Delivered'                 : 'delivered',
    'Delivery Failed'           : 'delivery_failed',
    'NDR'                       : 'delivery_failed',
    'Non-Delivery'              : 'delivery_failed',
    'Return'                    : 'return',
    'Returned'                  : 'return',
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
  const transporter = createTransporter()
  const opts        = createMailOptions()
  const info = await transporter.sendMail({
    ...opts,
    to     : customer.email,
    subject,
    html,
    text   : htmlToText(html),
  })

  return { success: true, messageId: info.messageId, to: customer.email }
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendWelcomeEmail — sent after successful registration
   customer: { name, email, customerId }
─────────────────────────────────────────────────────────────────────────────── */
async function sendWelcomeEmail(customer) {
  const { name, email, customerId } = customer
  if (!email) throw new Error('No email address provided.')

  const { subject, html } = welcomeEmail({ name, email, customerId })
  const transporter = createTransporter()
  const opts        = createMailOptions()
  const info = await transporter.sendMail({
    ...opts,
    to     : email,
    subject,
    html,
    text   : htmlToText(html),
  })

  return { success: true, messageId: info.messageId, to: email }
}

async function sendVerificationEmail(customer) {
  const { name, email, verifyUrl } = customer
  if (!email) throw new Error('No email address provided.')
  const { subject, html } = verificationEmail({ name, verifyUrl })
  const transporter = createTransporter()
  const opts        = createMailOptions()
  const info = await transporter.sendMail({
    ...opts,
    to     : email,
    subject,
    html,
    text   : htmlToText(html),
  })
  return { success: true, messageId: info.messageId, to: email }
}

async function sendPasswordResetEmail({ name, email, resetUrl }) {
  if (!email) throw new Error('No email address provided.')
  const firstName   = (name || '').split(' ')[0] || 'there'
  const transporter = createTransporter()
  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="margin:0 0 20px;">We received a request to reset the password for your Online Express account. Click the button below to set a new password.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">Reset My Password →</a>
    </div>
    <p style="margin:0 0 8px;color:#666;font-size:14px;">Or copy and paste this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:12px;color:#888;word-break:break-all;">${resetUrl}</p>
    <p style="margin:0 0 8px;color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
  `
  const html = baseTemplate('Password Reset', bodyHtml)
  const info = await transporter.sendMail({
    ...createMailOptions(),
    to     : email,
    subject: 'Reset your Online Express password',
    html,
    text   : `Hi ${firstName},\n\nReset your Online Express password here:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  })
  return { success: true, messageId: info.messageId, to: email }
}

async function sendOtpEmail({ name, email, otp }) {
  if (!email) throw new Error('No email address provided.')
  const firstName   = (name || '').split(' ')[0] || 'there'
  const transporter = createTransporter()
  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="margin:0 0 16px;">Thank you for registering with Online Express. Enter the code below to verify your email address and activate your account.</p>
    <div style="background:#f4f4f4;border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#666;font-weight:600;">YOUR VERIFICATION CODE</p>
      <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:monospace;">${otp}</p>
      <p style="margin:12px 0 0;font-size:13px;color:#888;">This code expires in 24 hours.</p>
    </div>
    <p style="margin:0 0 8px;color:#666;font-size:14px;">Enter this code on the verification page to complete your registration.</p>
    <p style="margin:0;color:#aaa;font-size:12px;">If you did not register for an Online Express account, you can safely ignore this email.</p>
  `
  const html = baseTemplate('Verify Your Email', bodyHtml)
  const info = await transporter.sendMail({
    ...createMailOptions(),
    to     : email,
    subject: `Your Online Express verification code: ${otp}`,
    html,
    text   : `Hi ${firstName},\n\nYour Online Express verification code is: ${otp}\n\nThis code expires in 24 hours. If you didn't register, ignore this email.`,
  })
  return { success: true, messageId: info.messageId, to: email }
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendKycReminderEmail — weekly nudge to customers with pending/rejected KYC
─────────────────────────────────────────────────────────────────────────────── */
async function sendKycReminderEmail(customer) {
  if (!customer.email) throw new Error('No email address.')
  const APP_URL    = process.env.APP_URL || 'https://www.onlineexpress.co.zm'
  const profileUrl = `${APP_URL}/portal/profile`
  const firstName  = (customer.name || '').split(' ')[0] || 'there'
  const isRejected = customer.kyc_status === 'rejected'

  const bodyHtml = `
    <p style="font-size:15px;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
    ${isRejected ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px 16px;margin:0 0 20px;">
      <p style="margin:0;color:#991b1b;font-size:14px;font-weight:700;">⚠️ Your KYC Verification Was Rejected</p>
      ${customer.kyc_rejection_reason ? `<p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">${customer.kyc_rejection_reason}</p>` : ''}
      <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">Please update your details and resubmit.</p>
    </div>` : `
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Your Online Express account is active, but your identity verification (KYC) is still pending.
      You need to complete it to clear customs and receive your parcels without delays.
    </p>`}
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:18px 20px;margin:0 0 20px;">
      <p style="margin:0 0 10px;color:#6d28d9;font-size:13px;font-weight:700;">What you need to complete KYC:</p>
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:2;">
        <li>Your TPIN (Tax Payer Identification Number from ZRA)</li>
        <li>Your NRC, Passport, or Driving Licence number</li>
        <li>A clear photo or scan of your ID document (JPG, PNG, or PDF)</li>
      </ul>
    </div>
    <p style="margin:0 0 20px;">
      <a href="${profileUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:13px 30px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
        Complete My Verification →
      </a>
    </p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.8;margin:0;">
      Questions? Contact us: 📞 <strong style="color:#475569;">+260 975 525 181</strong>
      &nbsp;·&nbsp; <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a><br>
      <a href="${APP_URL}/portal" style="color:#94a3b8;">Log in to your portal</a>
      &nbsp;·&nbsp;
      <a href="${profileUrl}" style="color:#94a3b8;">Update profile</a>
    </p>
  `

  const subject = isRejected
    ? 'Action Required: Resubmit Your KYC — Online Express'
    : 'Reminder: Complete Your Identity Verification — Online Express'

  const html = baseTemplate(
    isRejected ? 'KYC Resubmission Required' : 'Complete Your Identity Verification',
    bodyHtml,
    null
  )

  const transporter = createTransporter()
  const info = await transporter.sendMail({
    ...createMailOptions(),
    to     : customer.email,
    subject,
    html,
    text   : `Hi ${firstName},\n\n${isRejected
      ? `Your KYC verification was rejected. Please update your details and resubmit at: ${profileUrl}`
      : `Your identity verification (KYC) is still pending. Please complete it at: ${profileUrl}`
    }\n\nYou will need: your TPIN, your ID number (NRC/Passport/Driving Licence), and a scan of your ID document.\n\nOnline Express\n+260 975 525 181\nzamaccounts@onlineexpress.co.zm`,
  })

  return { success: true, messageId: info.messageId, to: customer.email }
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendKycReminders — batch: query all pending/rejected customers, send, track
   Returns { sent, failed, skipped, errors }
─────────────────────────────────────────────────────────────────────────────── */
async function sendKycReminders(dbInstance) {
  const target = (dbInstance || db).prepare(`
    SELECT id, name, email, kyc_status, kyc_rejection_reason, kyc_reminder_sent_at
    FROM   customers
    WHERE  email IS NOT NULL
      AND  email_verified  = 1
      AND  account_status  = 'active'
      AND  kyc_status      IN ('not_started', 'rejected')
      AND  (kyc_reminder_sent_at IS NULL
            OR kyc_reminder_sent_at < datetime('now', '-6 days'))
  `).all()

  const results = { sent: 0, failed: 0, skipped: target.length === 0 ? 0 : undefined, errors: [] }
  if (target.length === 0) { results.skipped = 0; return results }

  const markSent = (dbInstance || db).prepare(
    "UPDATE customers SET kyc_reminder_sent_at = datetime('now') WHERE id = ?"
  )

  for (const customer of target) {
    try {
      await sendKycReminderEmail(customer)
      markSent.run(customer.id)
      results.sent++
    } catch (e) {
      results.failed++
      results.errors.push({ email: customer.email, error: e.message })
      console.error('[kyc-reminder] failed for', customer.email, e.message)
    }
  }

  return results
}

/* ─────────────────────────────────────────────────────────────────────────────
   sendCustomerIdEmail — confirms a customer's permanent CX ID to them.
   Called after ID normalisation so every portal user knows their fixed ID.
─────────────────────────────────────────────────────────────────────────────── */
async function sendCustomerIdEmail(customer) {
  if (!customer.email) throw new Error('No email address.')
  const APP_URL    = process.env.APP_URL || 'https://www.onlineexpress.co.zm'
  const portalUrl  = `${APP_URL}/portal/dashboard`
  const firstName  = (customer.first_name || customer.name || '').split(' ')[0] || 'Valued Customer'

  const bodyHtml = `
    <p style="font-size:15px;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
      We are writing to confirm your unique Online Express Customer ID.
      This ID is permanently assigned to your account and will never change.
    </p>
    <div style="background:#faf5ff;border:2px dashed #c4b5fd;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Permanent Customer ID</p>
      <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:6px;color:#3b0764;font-family:monospace;">${customer.id}</p>
      <p style="margin:10px 0 0;color:#7c3aed;font-size:12px;">Keep this safe — it never changes</p>
    </div>
    <p style="color:#475569;font-size:13px;line-height:1.8;margin:0 0 20px;">
      You may need your Customer ID when:
    </p>
    <ul style="color:#475569;font-size:13px;line-height:2;margin:0 0 20px;padding-left:18px;">
      <li>Collecting a parcel at our branch (bring this ID + valid photo ID)</li>
      <li>Contacting our support team about your account</li>
      <li>Logging in to the portal using your Customer ID instead of your email</li>
    </ul>
    <p style="margin:0 0 20px;">
      <a href="${portalUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Go to My Portal →</a>
    </p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.8;margin:0;">
      Need help? 📞 <strong style="color:#475569;">+260 975 525 181</strong>
      &nbsp;·&nbsp; <a href="mailto:zamaccounts@onlineexpress.co.zm" style="color:#f59e0b;">zamaccounts@onlineexpress.co.zm</a>
    </p>
  `

  const html = baseTemplate('Your Customer ID Confirmed', bodyHtml, null)
  const transporter = createTransporter()
  const info = await transporter.sendMail({
    ...createMailOptions(),
    to     : customer.email,
    subject: `Your Online Express Customer ID: ${customer.id}`,
    html,
    text   : `Hi ${firstName},\n\nYour permanent Online Express Customer ID is: ${customer.id}\n\nThis ID will never change. Keep it safe — you may need it when collecting parcels or contacting support.\n\nLog in to your portal: ${portalUrl}\n\nOnline Express\n+260 975 525 181\nzamaccounts@onlineexpress.co.zm`,
  })

  return { success: true, messageId: info.messageId, to: customer.email }
}

module.exports = { sendNotification, sendTestEmail, mapStatusToEvent, getAllSettings, getSetting, sendKycInvitation, sendWelcomeEmail, sendVerificationEmail, sendOtpEmail, sendPasswordResetEmail, sendKycReminderEmail, sendKycReminders, sendCustomerIdEmail }
