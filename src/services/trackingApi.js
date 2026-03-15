/**
 * Tracking API Service — DPEX Integration
 *
 * CourierX pulls shipment tracking events from the DPEX partner API.
 * Credentials are requested from the DPEX sales/support team and
 * stored in .env (never commit real values to git).
 *
 * Required .env variables:
 *   VITE_TRACKING_API_URL      — DPEX API base URL
 *   VITE_TRACKING_API_KEY      — API key (new API version)
 *   VITE_TRACKING_ACCOUNT_NO   — DPEX account number
 *   VITE_TRACKING_ENTITY_ID    — Entity ID
 *   VITE_TRACKING_ENTITY_PIN   — Entity PIN
 *   VITE_TRACKING_USERNAME     — Username
 *   VITE_TRACKING_PASSWORD     — Password
 */

const BASE_URL   = import.meta.env.VITE_TRACKING_API_URL    || ''
const API_KEY    = import.meta.env.VITE_TRACKING_API_KEY    || ''
const ACCOUNT_NO = import.meta.env.VITE_TRACKING_ACCOUNT_NO || ''
const ENTITY_ID  = import.meta.env.VITE_TRACKING_ENTITY_ID  || ''
const ENTITY_PIN = import.meta.env.VITE_TRACKING_ENTITY_PIN || ''
const USERNAME   = import.meta.env.VITE_TRACKING_USERNAME   || ''
const PASSWORD   = import.meta.env.VITE_TRACKING_PASSWORD   || ''

/* ─────────────────────────────────────────────────────────────
   DPEX new_status short-code lookup
   Confirmed from email: "B" = Booked
   Others are standard DPEX codes — update if DPEX provides full list
───────────────────────────────────────────────────────────── */
export const NEW_STATUS_CODES = {
  B : 'Booked',
  P : 'Picked Up',
  H : 'In Hub',
  T : 'In Transit',
  O : 'Out for Delivery',
  D : 'Delivered',
  F : 'Delivery Failed',
  N : 'NDR',
  R : 'Return',
  C : 'Cancelled',
  X : 'On Hold',
}

/* ─────────────────────────────────────────────────────────────
   fetchTracking
   Fetch tracking data for a given AWB number from DPEX.

   Full DPEX response shape (from email trail):
   {
     status          : 200,
     message         : "Data successfully!",
     "AWB NO"        : "120000075",
     "Current Status": "Delivered",
     current_location: "Acampo",
     value: [
       {
         slip_no       : "120000075",   ← per-event slip/AWB ref
         new_status    : "B",           ← short status code
         time          : "06:50",
         date          : "2025-10-01",
         Activites     : "Shipment Booked",   ← note DPEX typo (missing 'i')
         Details       : "Shipment Created",
         Cancel_resion : null,                ← note DPEX typo ('resion')
         city          : "Chama",
         Status        : "Booked"
       }
     ]
   }
   Events arrive in ASCENDING order (oldest first) — we reverse for UI.
───────────────────────────────────────────────────────────── */
/**
 * fetchTracking(awb, carrier?)
 *
 * `carrier` is the active carrier object from the admin store.
 * If provided, its credentials take priority over .env values.
 * Falls back to .env so the app still works during initial setup.
 *
 * Example carrier object (from adminStore settings.carriers):
 * {
 *   id, name, status,
 *   trackUrl,   ← base URL
 *   apiKey,     ← API key
 *   accountNo,  ← DPEX account number
 *   entityId,   ← Entity ID
 *   entityPin,  ← Entity PIN
 *   username,   ← Username
 *   password,   ← Password
 * }
 */
export async function fetchTracking(awb, carrier = null) {
  // Merge: store carrier credentials take priority over .env
  const url      = carrier?.trackUrl  || BASE_URL
  const apiKey   = carrier?.apiKey    || API_KEY
  const acctNo   = carrier?.accountNo || ACCOUNT_NO
  const entityId = carrier?.entityId  || ENTITY_ID
  const entityPn = carrier?.entityPin || ENTITY_PIN
  const uname    = carrier?.username  || USERNAME
  const pwd      = carrier?.password  || PASSWORD

  if (!url) {
    throw new Error(
      'No active carrier configured. Go to Admin → Settings → Third Party Carriers and add DPEX credentials.'
    )
  }

  const headers = {
    'Content-Type' : 'application/json',
    'X-API-Key'    : apiKey,
    'X-Account-No' : acctNo,
    'X-Entity-ID'  : entityId,
    'X-Entity-Pin' : entityPn,
    'X-Username'   : uname,
    'X-Password'   : pwd,
  }

  // Strip empty header values — don't send blank strings to DPEX
  Object.keys(headers).forEach(k => { if (!headers[k]) delete headers[k] })

  let res
  try {
    res = await fetch(`${url}/api/track/${awb}`, { headers })
  } catch (networkErr) {
    throw new Error(`Cannot reach carrier API: ${networkErr.message}`)
  }

  if (!res.ok) {
    throw new Error(`Carrier API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.status !== 200) {
    throw new Error(data.message || 'AWB not found in DPEX system')
  }

  return normaliseTracking(data)
}

/* ─────────────────────────────────────────────────────────────
   normaliseTracking
   Maps every DPEX field (including previously missing slip_no
   and new_status) into a clean internal shape.
───────────────────────────────────────────────────────────── */
function normaliseTracking(data) {
  const events = (data.value || []).map(item => ({
    // ── Confirmed fields from DPEX email ──────────────────────
    activity      : item.Activites      || '',   // DPEX typo: 'Activites'
    details       : item.Details        || '',
    status        : item.Status         || '',
    city          : item.city           || '',
    date          : item.date           || '',
    time          : item.time           || '',
    cancelReason  : item.Cancel_resion  || null, // DPEX typo: 'Cancel_resion'

    // ── Previously missing fields — now captured ──────────────
    slipNo        : item.slip_no        || '',   // per-event AWB/slip reference
    newStatusCode : item.new_status     || '',   // short code e.g. "B", "D"
    newStatusLabel: NEW_STATUS_CODES[item.new_status] || item.new_status || '',
  }))

  events.reverse() // newest first in UI

  return {
    awb            : data['AWB NO']         || '',
    currentStatus  : data['Current Status'] || '',
    currentLocation: data.current_location  || '',
    events,
  }
}

/* ─────────────────────────────────────────────────────────────
   Status colour badges
   Covers all known DPEX statuses + common edge cases
───────────────────────────────────────────────────────────── */
export const TRACKING_STATUS_COLORS = {
  // Core statuses confirmed in DPEX email
  'Booked'           : 'bg-blue-100 text-blue-700',
  'Picked Up'        : 'bg-yellow-100 text-yellow-700',
  'In Transit'       : 'bg-orange-100 text-orange-700',
  'Delivered'        : 'bg-green-100 text-green-700',
  'Cancelled'        : 'bg-red-100 text-red-700',

  // Additional statuses DPEX may send
  'In Hub'           : 'bg-cyan-100 text-cyan-700',
  'Out for Delivery' : 'bg-indigo-100 text-indigo-700',
  'Delivery Failed'  : 'bg-red-100 text-red-700',
  'NDR'              : 'bg-rose-100 text-rose-700',
  'Return'           : 'bg-purple-100 text-purple-700',
  'On Hold'          : 'bg-gray-100 text-gray-600',
  'Customs'          : 'bg-amber-100 text-amber-700',
}

export function statusColor(status) {
  return TRACKING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
}

/* ─────────────────────────────────────────────────────────────
   Activity icon map
   Covers all 8 confirmed DPEX activities from email +
   common extras DPEX may send
───────────────────────────────────────────────────────────── */
export const ACTIVITY_ICONS = {
  // Confirmed from DPEX email trail
  'Shipment Booked'       : '📦',
  'Proceed For Pickup'    : '🚗',
  'Picked up'             : '🤝',
  'Picked Up And In Hub'  : '🏭',
  'Despatched'            : '🚚',
  'Out for Delivery'      : '🛵',
  'Delivered'             : '✅',

  // Additional activities DPEX may send
  'Delivery Attempted'    : '🔔',
  'Delivery Failed'       : '❌',
  'NDR - No One Home'     : '🚪',
  'NDR - Rejected'        : '🚫',
  'NDR - Wrong Address'   : '📍',
  'Return Initiated'      : '↩️',
  'Return In Transit'     : '🔄',
  'Return Delivered'      : '📬',
  'Cancelled'             : '🚫',
  'On Hold'               : '⏸️',
  'Customs Clearance'     : '🛃',
  'Arrived At Hub'        : '🏭',
}

export function activityIcon(activity) {
  // Handle dynamic city names: "Arrived At Chama", "Arrived At Ndola" etc.
  if (activity.startsWith('Arrived At'))  return '📍'
  if (activity.startsWith('NDR'))         return '🔔'
  if (activity.startsWith('Return'))      return '↩️'
  if (activity.startsWith('Customs'))     return '🛃'
  return ACTIVITY_ICONS[activity] || '🔵'
}
