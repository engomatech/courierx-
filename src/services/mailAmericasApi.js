/**
 * MailAmericas Provider Events API — Integration Service
 *
 * Online Express acts as a last-mile delivery PROVIDER for MailAmericas.
 * When we collect, attempt, or deliver a MailAmericas shipment, we push
 * a status event back to MailAmericas via their Provider Events API.
 *
 * API Reference: https://wiki.mailamericas.com/en/providers/provider-events-api
 *
 * Authentication: Bearer token in Authorization header
 * Credentials are obtained from your MailAmericas account manager and
 * stored in .env — never commit real values to git.
 *
 * Required .env variables:
 *   VITE_MLA_EVENTS_URL    — Provider Events API base URL
 *                            default: https://api.mailamericas.com
 *   VITE_MLA_ACCESS_TOKEN  — Bearer token from MailAmericas
 *   VITE_MLA_PROVIDER_CODE — Your provider/carrier code assigned by MailAmericas
 */

const BASE_URL      = import.meta.env.VITE_MLA_EVENTS_URL    || 'https://api.mailamericas.com'
const ACCESS_TOKEN  = import.meta.env.VITE_MLA_ACCESS_TOKEN  || ''
const PROVIDER_CODE = import.meta.env.VITE_MLA_PROVIDER_CODE || ''

/* ─────────────────────────────────────────────────────────────
   EVENT CODES
   Standard MailAmericas provider event codes.
   Confirm the full list with your MailAmericas integration contact.
───────────────────────────────────────────────────────────── */
export const MLA_EVENT_CODES = {
  COLLECTED          : 'COLLECTED',           // Picked up from MailAmericas hub
  IN_TRANSIT         : 'IN_TRANSIT',          // In transit to recipient
  OUT_FOR_DELIVERY   : 'OUT_FOR_DELIVERY',    // Out for delivery today
  DELIVERED          : 'DELIVERED',           // Successfully delivered
  FAILED_ATTEMPT     : 'FAILED_ATTEMPT',      // Delivery attempted, recipient absent
  RETURNED_TO_SENDER : 'RETURNED_TO_SENDER',  // Returned after failed attempts
  IN_CUSTOMS         : 'IN_CUSTOMS',          // Held at customs
  CUSTOMS_CLEARED    : 'CUSTOMS_CLEARED',     // Cleared customs
  DAMAGED            : 'DAMAGED',             // Parcel damaged in transit
  LOST               : 'LOST',               // Parcel lost
}

/* ─────────────────────────────────────────────────────────────
   EVENT CODE → human-readable label
───────────────────────────────────────────────────────────── */
export const MLA_EVENT_LABELS = {
  COLLECTED          : 'Collected from Hub',
  IN_TRANSIT         : 'In Transit',
  OUT_FOR_DELIVERY   : 'Out for Delivery',
  DELIVERED          : 'Delivered',
  FAILED_ATTEMPT     : 'Delivery Attempted — No One Home',
  RETURNED_TO_SENDER : 'Returned to Sender',
  IN_CUSTOMS         : 'Held at Customs',
  CUSTOMS_CLEARED    : 'Customs Cleared',
  DAMAGED            : 'Parcel Damaged',
  LOST               : 'Parcel Lost',
}

/* ─────────────────────────────────────────────────────────────
   pushEvent
   Push a single tracking event to MailAmericas for a shipment
   they handed to Online Express for last-mile delivery.

   @param {object} params
     tracking_code     {string}  — MailAmericas tracking number (e.g. MLA123456789ZM)
     event_code        {string}  — One of MLA_EVENT_CODES
     event_date        {string}  — ISO date: "2026-03-19"
     event_time        {string}  — 24h time: "14:30"
     city              {string}  — City where event occurred
     country           {string}  — ISO 3166-1 alpha-2 (e.g. "ZM")
     notes             {string?} — Optional delivery notes
     recipient_name    {string?} — Name of person who signed (DELIVERED events)
     failure_reason    {string?} — Reason for failed attempt (FAILED_ATTEMPT events)

   @param {object?} carrier
     Optional carrier config from adminStore (takes priority over .env values)
     { apiKey, eventsUrl }

   @returns {object} { success: true, reference: "..." } or throws
───────────────────────────────────────────────────────────── */
export async function pushEvent(params, carrier = null) {
  const baseUrl = carrier?.eventsUrl || `${BASE_URL}/api/v1/provider/events`
  const token   = carrier?.apiKey    || ACCESS_TOKEN

  if (!token) {
    throw new Error(
      'No MailAmericas access token configured. ' +
      'Go to Admin → Settings → Third Party Carriers → MailAmericas and enter your API key.'
    )
  }

  const {
    tracking_code,
    event_code,
    event_date,
    event_time,
    city,
    country       = 'ZM',
    notes         = '',
    recipient_name = '',
    failure_reason = '',
  } = params

  if (!tracking_code) throw new Error('tracking_code is required')
  if (!event_code)    throw new Error('event_code is required')
  if (!event_date)    throw new Error('event_date is required')
  if (!event_time)    throw new Error('event_time is required')
  if (!city)          throw new Error('city is required')

  const payload = {
    tracking_code,
    provider_code : PROVIDER_CODE,
    event_code,
    event_date,
    event_time,
    location: {
      city,
      country,
    },
    event_description: MLA_EVENT_LABELS[event_code] || event_code,
    ...(notes          && { notes }),
    ...(recipient_name && { recipient_name }),
    ...(failure_reason && { failure_reason }),
  }

  let res
  try {
    res = await fetch(baseUrl, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (networkErr) {
    throw new Error(`Cannot reach MailAmericas API: ${networkErr.message}`)
  }

  let data
  try { data = await res.json() } catch { data = {} }

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || `MailAmericas API error: ${res.status} ${res.statusText}`
    )
  }

  return {
    success  : true,
    reference: data?.reference || data?.event_id || null,
    raw      : data,
  }
}

/* ─────────────────────────────────────────────────────────────
   pushDelivered  — convenience wrapper for delivered events
───────────────────────────────────────────────────────────── */
export function pushDelivered({ tracking_code, city, recipient_name = '', notes = '', carrier = null }) {
  const now   = new Date()
  return pushEvent({
    tracking_code,
    event_code     : MLA_EVENT_CODES.DELIVERED,
    event_date     : now.toISOString().slice(0, 10),
    event_time     : now.toTimeString().slice(0, 5),
    city,
    recipient_name,
    notes,
  }, carrier)
}

/* ─────────────────────────────────────────────────────────────
   pushFailedAttempt — convenience wrapper for failed delivery
───────────────────────────────────────────────────────────── */
export function pushFailedAttempt({ tracking_code, city, failure_reason = '', notes = '', carrier = null }) {
  const now = new Date()
  return pushEvent({
    tracking_code,
    event_code     : MLA_EVENT_CODES.FAILED_ATTEMPT,
    event_date     : now.toISOString().slice(0, 10),
    event_time     : now.toTimeString().slice(0, 5),
    city,
    failure_reason,
    notes,
  }, carrier)
}

/* ─────────────────────────────────────────────────────────────
   mapInternalStatusToMlaEvent
   Maps Online Express internal status codes to MailAmericas event codes.
   Use this when syncing OE pipeline status updates to MailAmericas.
───────────────────────────────────────────────────────────── */
export function mapStatusToMlaEvent(oeStatus) {
  const MAP = {
    'Picked Up'        : MLA_EVENT_CODES.COLLECTED,
    'In Transit'       : MLA_EVENT_CODES.IN_TRANSIT,
    'In Hub'           : MLA_EVENT_CODES.IN_TRANSIT,
    'Out for Delivery' : MLA_EVENT_CODES.OUT_FOR_DELIVERY,
    'Delivered'        : MLA_EVENT_CODES.DELIVERED,
    'Delivery Failed'  : MLA_EVENT_CODES.FAILED_ATTEMPT,
    'NDR'              : MLA_EVENT_CODES.FAILED_ATTEMPT,
    'Return'           : MLA_EVENT_CODES.RETURNED_TO_SENDER,
    'Customs'          : MLA_EVENT_CODES.IN_CUSTOMS,
  }
  return MAP[oeStatus] || null
}
