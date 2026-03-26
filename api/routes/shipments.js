/**
 * Partner Shipments API
 *
 * POST   /api/v1/shipments            — Create a shipment (partner e-commerce)
 * GET    /api/v1/shipments            — List partner's own shipments (paginated)
 * GET    /api/v1/shipments/:awb       — Get a single shipment + tracking events
 * GET    /api/v1/shipments/:awb/label — Label data for printing
 *
 * All routes require X-API-Key header (enforced by auth middleware).
 */

const express = require('express')
const db      = require('../db')
const { sendNotification } = require('../mailer')
const { findOrCreateCustomer } = require('./customers')
const router  = express.Router()

/* ── AWB Generator: OEX-YYYY-NNNNN sequential ─────────────────────────────── */
const countByYear = db.prepare("SELECT COUNT(*) as n FROM shipments WHERE awb LIKE ?")

function generateAwb() {
  const year = new Date().getFullYear()
  const row  = countByYear.get(`OEX-${year}-%`)
  const seq  = String((row?.n || 0) + 1).padStart(5, '0')
  return `OEX-${year}-${seq}`
}

/* ── Prepared statements ──────────────────────────────────────────────────── */
const insertShipment = db.prepare(`
  INSERT INTO shipments
    (awb, partner_id, partner_reference, status, service_type,
     sender_name, sender_phone, sender_address, sender_city, sender_country, sender_email,
     receiver_name, receiver_phone, receiver_address, receiver_city, receiver_country, receiver_email,
     weight, length, width, height, quantity, description, value, currency,
     mawb, hawb, origin_carrier, delivery_method, payment_status, customer_id, kyc_hold)
  VALUES
    (@awb, @partner_id, @partner_reference, @status, @service_type,
     @sender_name, @sender_phone, @sender_address, @sender_city, @sender_country, @sender_email,
     @receiver_name, @receiver_phone, @receiver_address, @receiver_city, @receiver_country, @receiver_email,
     @weight, @length, @width, @height, @quantity, @description, @value, @currency,
     @mawb, @hawb, @origin_carrier, @delivery_method, @payment_status, @customer_id, @kyc_hold)
`)

const insertEvent = db.prepare(`
  INSERT INTO tracking_events (awb, activity, details, status, city, date, time, new_status, source)
  VALUES (@awb, @activity, @details, @status, @city, @date, @time, @new_status, @source)
`)

const getOne    = db.prepare('SELECT * FROM shipments WHERE awb = ?')
const getOwn    = db.prepare('SELECT * FROM shipments WHERE partner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
const countOwn  = db.prepare('SELECT COUNT(*) as n FROM shipments WHERE partner_id = ?')
const getEvents = db.prepare('SELECT * FROM tracking_events WHERE awb = ? ORDER BY date DESC, time DESC')
const updateStatus = db.prepare("UPDATE shipments SET status = ?, updated_at = datetime('now') WHERE awb = ?")

/* ── Format DB row into API response shape ───────────────────────────────── */
function fmt(row, withEvents) {
  const base = process.env.APP_URL || 'http://163.245.221.133'
  const obj  = {
    awb              : row.awb,
    partner_reference: row.partner_reference || null,
    status           : row.status,
    service_type     : row.service_type,
    sender  : {
      name   : row.sender_name,
      phone  : row.sender_phone,
      address: row.sender_address,
      city   : row.sender_city,
      country: row.sender_country,
    },
    receiver: {
      name   : row.receiver_name,
      phone  : row.receiver_phone,
      address: row.receiver_address,
      city   : row.receiver_city,
      country: row.receiver_country,
    },
    package: {
      weight     : row.weight,
      length     : row.length,
      width      : row.width,
      height     : row.height,
      quantity   : row.quantity,
      description: row.description,
      value      : row.value,
      currency   : row.currency,
    },
    tracking_url     : base + '/track/' + (row.hawb || row.awb),
    tracking_url_mawb: row.mawb ? base + '/track/' + row.mawb : null,
    label_url        : base + '/api/v1/shipments/' + row.awb + '/label',
    label_url_pdf    : base + '/api/v1/shipments/' + row.awb + '/label?format=pdf',
    mawb            : row.mawb || null,
    hawb            : row.hawb || row.awb,
    origin_carrier  : row.origin_carrier || null,
    delivery_method : row.delivery_method || 'domestic_courier',
    payment_status  : row.payment_status || 'pending',
    payment_amount  : row.payment_amount || null,
    payment_currency: row.payment_currency || 'ZMW',
    customs_status  : row.customs_status || 'not_required',
    customer_id     : row.customer_id || null,
    kyc_hold        : row.kyc_hold === 1,
    created_at      : row.created_at,
    updated_at      : row.updated_at,
  }
  if (withEvents) {
    obj.events = getEvents.all(row.awb).map(function(e) {
      return { activity: e.activity, details: e.details, status: e.status, city: e.city, date: e.date, time: e.time }
    })
  }
  return obj
}

/* ── POST /api/v1/shipments — Create shipment ────────────────────────────── */
router.post('/', function(req, res) {
  var body              = req.body || {}
  var service_type      = body.service_type
  var partner_reference = body.partner_reference
  var mawb              = body.mawb || null
  var hawb              = body.hawb || null
  var origin_carrier    = body.origin_carrier || (req.partner && req.partner.partner_name) || null
  var delivery_method   = body.delivery_method || 'domestic_courier'
  var sender            = body.sender   || {}
  var receiver          = body.receiver || {}
  var pkg               = body.package  || {}

  var missing = {}
  if (!service_type)                  missing.service_type           = 'Required'
  if (!sender.name)                   missing['sender.name']         = 'Required'
  if (!sender.phone)                  missing['sender.phone']        = 'Required'
  if (!sender.address)                missing['sender.address']      = 'Required'
  if (!sender.city)                   missing['sender.city']         = 'Required'
  if (!receiver.name)                 missing['receiver.name']       = 'Required'
  if (!receiver.phone)                missing['receiver.phone']      = 'Required'
  if (!receiver.address)              missing['receiver.address']    = 'Required'
  if (!receiver.city)                 missing['receiver.city']       = 'Required'
  if (!pkg.weight)                    missing['package.weight']      = 'Required'
  if (pkg.weight && pkg.weight <= 0)  missing['package.weight']      = 'Must be greater than 0'
  if (sender.phone   && String(sender.phone).replace(/\D/g,'').length < 7)   missing['sender.phone']   = 'Invalid phone number'
  if (receiver.phone && String(receiver.phone).replace(/\D/g,'').length < 7) missing['receiver.phone'] = 'Invalid phone number'

  if (Object.keys(missing).length) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Required fields missing or invalid.', fields: missing })
  }

  // Auto-create or match customer from receiver details
  var customerResult = null
  if (receiver.name || receiver.phone || receiver.email) {
    try {
      customerResult = findOrCreateCustomer({
        name        : receiver.name,
        phone       : receiver.phone || null,
        email       : receiver.email || null,
        city        : receiver.city  || null,
        country     : receiver.country || 'Zambia',
        created_from: origin_carrier || 'partner_api',
      })
    } catch(_) { /* non-blocking — proceed without customer link */ }
  }

  // KYC compliance gate: applies only to customer portal bookings.
  // Partner API shipments bypass KYC hold — partners are pre-vetted businesses
  // responsible for their own customer compliance.
  var kycHold = 0

  var awb     = generateAwb()
  var now     = new Date()
  var dateStr = now.toISOString().slice(0, 10)
  var timeStr = now.toTimeString().slice(0, 5)

  db.transaction(function() {
    insertShipment.run({
      awb              : awb,
      partner_id       : (req.partner && req.partner.id) ? req.partner.id : null,
      partner_reference: partner_reference || null,
      status           : 'Booked',
      service_type     : service_type,
      sender_name      : sender.name    || '',
      sender_phone     : sender.phone   || '',
      sender_address   : sender.address || '',
      sender_city      : sender.city    || '',
      sender_country   : sender.country || 'Zambia',
      sender_email     : sender.email   || null,
      receiver_name    : receiver.name    || '',
      receiver_phone   : receiver.phone   || '',
      receiver_address : receiver.address || '',
      receiver_city    : receiver.city    || '',
      receiver_country : receiver.country || 'Zambia',
      receiver_email   : receiver.email   || null,
      weight         : pkg.weight      || 0,
      length         : pkg.length      || 0,
      width          : pkg.width       || 0,
      height         : pkg.height      || 0,
      quantity       : pkg.quantity    || 1,
      description    : pkg.description || '',
      value          : pkg.value       || 0,
      currency       : pkg.currency    || 'ZMW',
      mawb           : mawb,
      hawb           : hawb || awb,   // default HAWB to our OEX AWB if partner doesn't provide one
      origin_carrier : origin_carrier,
      delivery_method: delivery_method,
      payment_status : 'pending',
      customer_id    : customerResult ? customerResult.customer.id : null,
      kyc_hold       : kycHold,
    })
    insertEvent.run({
      awb       : awb,
      activity  : 'SHIPMENT CREATED',
      details   : [
        origin_carrier ? 'Carrier: ' + origin_carrier : null,
        mawb ? 'MAWB: ' + mawb : null,
        hawb ? 'HAWB: ' + hawb : null,
        partner_reference ? 'Partner ref: ' + partner_reference : null,
      ].filter(Boolean).join(' | ') || 'Created via Partner API',
      status    : 'Booked',
      city      : sender.city || '',
      date      : dateStr,
      time      : timeStr,
      new_status: 'Booked',
      source    : 'partner_api',
    })
  })()

  const created = getOne.get(awb)

  // Fire booking confirmation email (non-blocking)
  sendNotification('booked', created)
    .catch(err => console.error('[notifications] booking email error:', err.message))

  const response = { success: true, message: 'Shipment created successfully.', ...fmt(created) }
  if (kycHold) {
    response.kyc_warning = 'Customer KYC is incomplete. Shipment is on hold and cannot be dispatched until KYC is verified.'
  }
  return res.status(201).json(response)
})

/* ── GET /api/v1/shipments — List partner shipments ─────────────────────── */
router.get('/', function(req, res) {
  var pid    = req.partner && req.partner.id
  var page   = Math.max(1, parseInt(req.query.page  || '1',  10))
  var limit  = Math.min(100, parseInt(req.query.limit || '20', 10))
  var offset = (page - 1) * limit
  var total  = (countOwn.get(pid) || { n: 0 }).n
  var rows   = getOwn.all(pid, limit, offset)
  return res.json({
    shipments : rows.map(function(r) { return fmt(r, false) }),
    pagination: { page: page, limit: limit, total: total, total_pages: Math.ceil(total / limit) },
  })
})

/* ── GET /api/v1/shipments/:awb — Single shipment with events ────────────── */
router.get('/:awb', function(req, res) {
  var row = getOne.get(req.params.awb)
  if (!row) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Shipment ' + req.params.awb + ' not found.' })
  }
  if (row.partner_id && req.partner && row.partner_id !== req.partner.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this shipment.' })
  }
  return res.json(fmt(row, true))
})

/* ── GET /api/v1/shipments/:awb/label — Printable label, PDF, or JSON ────── */
router.get('/:awb/label', async function(req, res) {
  var row = getOne.get(req.params.awb)
  if (!row) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Shipment not found.' })
  }
  if (row.partner_id && req.partner && row.partner_id !== req.partner.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied.' })
  }

  var base     = process.env.APP_URL || 'http://163.254.221.133'
  var trackUrl = base + '/track/' + (row.hawb || row.awb)
  var format   = (req.query.format || 'html').toLowerCase()

  // ── JSON label data ──────────────────────────────────────────────────────
  if (format === 'json') {
    return res.json({
      label: {
        awb: row.awb, hawb: row.hawb || row.awb, service_type: row.service_type,
        barcode: row.awb, barcode_format: 'CODE128', qr_data: trackUrl,
        from: { name: row.sender_name, phone: row.sender_phone, address: row.sender_address, city: row.sender_city, country: row.sender_country },
        to:   { name: row.receiver_name, phone: row.receiver_phone, address: row.receiver_address, city: row.receiver_city, country: row.receiver_country },
        weight: row.weight, quantity: row.quantity, description: row.description, created_at: row.created_at,
      },
    })
  }

  // ── Generate real Code 128 barcode as base64 PNG ─────────────────────────
  var bwipjs = require('bwip-js')
  var barcodePng
  try {
    barcodePng = await bwipjs.toBuffer({
      bcid       : 'code128',
      text       : row.awb,
      scale      : 3,
      height     : 12,
      includetext: false,
      backgroundcolor: 'ffffff',
    })
  } catch(e) {
    barcodePng = null
  }
  var barcodeDataUri = barcodePng
    ? 'data:image/png;base64,' + barcodePng.toString('base64')
    : null

  // ── PDF format ───────────────────────────────────────────────────────────
  if (format === 'pdf') {
    var PDFDocument = require('pdfkit')
    var doc = new PDFDocument({ size: [283, 425], margin: 0 }) // 100mm × 150mm at 72dpi≈283×425pt

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="label-' + row.awb + '.pdf"')
    doc.pipe(res)

    var svcIsExpress = row.service_type && row.service_type.includes('EXP')

    // Header bar
    doc.rect(0, 0, 283, 36).fill('#1e293b')
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text('Online Express', 10, 12)
    doc.rect(200, 8, 73, 20).fill(svcIsExpress ? '#d97706' : '#2563eb')
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text(row.service_type || 'STD', 204, 13, { width: 65, align: 'center' })

    // Real Code 128 barcode
    if (barcodePng) {
      doc.image(barcodePng, 10, 44, { width: 263, height: 48 })
    }
    // AWB number below barcode
    doc.fillColor('#000000').fontSize(13).font('Courier-Bold')
      .text(row.awb, 0, 96, { width: 283, align: 'center' })

    // Divider
    doc.moveTo(0, 118).lineTo(283, 118).lineWidth(1.5).stroke('#000000')

    // FROM box
    doc.rect(0, 118, 142, 1).fill('#000').rect(141, 118, 1, 100).fill('#000')
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
      .text('FROM', 10, 124)
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
      .text(row.sender_name || '', 10, 135, { width: 125 })
    doc.fillColor('#374151').fontSize(8).font('Helvetica')
      .text((row.sender_address || '') + '\n' + (row.sender_city || '') + ', ' + (row.sender_country || ''), 10, 148, { width: 125 })
    doc.fillColor('#6b7280').fontSize(7)
      .text(row.sender_phone || '', 10, 190)

    // TO box
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
      .text('TO', 150, 124)
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
      .text(row.receiver_name || '', 150, 135, { width: 125 })
    doc.fillColor('#374151').fontSize(8).font('Helvetica')
      .text((row.receiver_address || '') + '\n' + (row.receiver_city || '') + ', ' + (row.receiver_country || ''), 150, 148, { width: 125 })
    doc.fillColor('#6b7280').fontSize(7)
      .text(row.receiver_phone || '', 150, 190)

    // Details row
    doc.moveTo(0, 218).lineTo(283, 218).lineWidth(0.5).stroke('#cccccc')
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
      .text('WEIGHT', 10, 224).text('PIECES', 100, 224).text('DIMS (cm)', 185, 224)
    doc.fillColor('#111111').fontSize(9).font('Helvetica-Bold')
      .text((row.weight || 0) + ' kg', 10, 234)
      .text(String(row.quantity || 1), 100, 234)
      .text((row.length||0) + '×' + (row.width||0) + '×' + (row.height||0), 185, 234)

    // Description
    if (row.description) {
      doc.moveTo(0, 248).lineTo(283, 248).lineWidth(0.5).stroke('#cccccc')
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold').text('CONTENTS', 10, 254)
      doc.fillColor('#374151').fontSize(8).font('Helvetica').text(row.description, 10, 264, { width: 263 })
    }

    // Footer
    doc.rect(0, 395, 283, 30).fill('#f8fafc')
    doc.fillColor('#475569').fontSize(7).font('Helvetica')
      .text('Track: ' + trackUrl, 10, 403, { width: 220 })
    doc.fillColor('#94a3b8').fontSize(7)
      .text((row.created_at || '').slice(0, 10), 220, 403, { width: 55, align: 'right' })

    doc.end()
    return
  }

  // ── HTML printable label (default) ────────────────────────────────────────
  var svcColor = row.service_type && row.service_type.includes('EXP') ? '#d97706' : '#2563eb'
  var barcodeImg = barcodeDataUri
    ? `<img src="${barcodeDataUri}" style="width:100%;height:48px;display:block;" alt="barcode">`
    : `<div style="font-family:monospace;font-size:24px;letter-spacing:-1px;color:#000;line-height:1;">||||| ||| |||| ||||| ||| ||||</div>`

  var html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Shipping Label — ${row.awb}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:#f0f0f0;display:flex;flex-direction:column;align-items:center;padding:20px;gap:12px;}
  .label{background:#fff;width:100mm;border:2px solid #000;page-break-inside:avoid;}
  .header{background:#1e293b;color:#fff;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;}
  .header .brand{font-weight:700;font-size:13px;letter-spacing:0.5px;}
  .header .svc{background:${svcColor};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:3px;}
  .awb-bar{background:#f8fafc;border-bottom:2px solid #000;padding:8px 10px;text-align:center;}
  .awb-num{font-size:16px;font-weight:900;font-family:monospace;letter-spacing:2px;margin-top:4px;}
  .section{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #000;}
  .box{padding:8px 10px;}
  .box.left{border-right:1px solid #000;}
  .box-label{font-size:8px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:3px;letter-spacing:0.5px;}
  .box-name{font-size:11px;font-weight:700;color:#0f172a;line-height:1.3;}
  .box-addr{font-size:10px;color:#374151;line-height:1.4;margin-top:2px;}
  .box-phone{font-size:10px;color:#6b7280;margin-top:2px;}
  .details{padding:8px 10px;border-bottom:1px solid #ccc;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;}
  .det-label{font-size:8px;text-transform:uppercase;color:#64748b;font-weight:700;}
  .det-val{font-size:11px;font-weight:700;color:#111;margin-top:1px;}
  .footer{padding:6px 10px;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;}
  .footer .track{font-size:8px;color:#475569;word-break:break-all;}
  .footer .date{font-size:8px;color:#94a3b8;}
  .actions{display:flex;gap:10px;}
  .btn{padding:10px 24px;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;text-decoration:none;display:inline-block;}
  .btn-print{background:#1e293b;color:#fff;}
  .btn-pdf{background:#2563eb;color:#fff;}
  @media print{body{background:#fff;padding:0;}.actions{display:none;}.label{border:1px solid #000;width:100%;}}
</style>
</head>
<body>
<div class="label">
  <div class="header">
    <span class="brand">Online Express</span>
    <span class="svc">${row.service_type || 'STD'}</span>
  </div>
  <div class="awb-bar">
    ${barcodeImg}
    <div class="awb-num">${row.awb}</div>
  </div>
  <div class="section">
    <div class="box left">
      <div class="box-label">From</div>
      <div class="box-name">${row.sender_name}</div>
      <div class="box-addr">${row.sender_address}<br>${row.sender_city}, ${row.sender_country}</div>
      <div class="box-phone">${row.sender_phone}</div>
    </div>
    <div class="box">
      <div class="box-label">To</div>
      <div class="box-name">${row.receiver_name}</div>
      <div class="box-addr">${row.receiver_address}<br>${row.receiver_city}, ${row.receiver_country}</div>
      <div class="box-phone">${row.receiver_phone}</div>
    </div>
  </div>
  <div class="details">
    <div class="det-item"><div class="det-label">Weight</div><div class="det-val">${row.weight} kg</div></div>
    <div class="det-item"><div class="det-label">Pieces</div><div class="det-val">${row.quantity || 1}</div></div>
    <div class="det-item"><div class="det-label">Dims</div><div class="det-val">${row.length||0}×${row.width||0}×${row.height||0}</div></div>
  </div>
  ${row.description ? `<div style="padding:6px 10px;border-bottom:1px solid #ccc;font-size:10px;color:#374151;"><span style="font-weight:700;font-size:8px;text-transform:uppercase;color:#64748b;">Contents: </span>${row.description}</div>` : ''}
  <div class="footer">
    <span class="track">Track: ${trackUrl}</span>
    <span class="date">${(row.created_at||'').slice(0,10)}</span>
  </div>
</div>
<div class="actions">
  <button class="btn btn-print" onclick="window.print()">🖨 Print Label</button>
  <a class="btn btn-pdf" href="?format=pdf">⬇ Download PDF</a>
</div>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.send(html)
})

module.exports = router
