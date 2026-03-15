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

/**
 * Fetch tracking data for a given AWB number from DPEX.
 *
 * Expected DPEX response shape:
 * {
 *   status: 200,
 *   message: "Data successfully!",
 *   "AWB NO": "120000075",
 *   "Current Status": "Delivered",
 *   current_location: "Acampo",
 *   value: [
 *     {
 *       slip_no, new_status, time, date,
 *       Activites, Details, Cancel_resion, city, Status
 *     },
 *     ...
 *   ]
 * }
 * Events are in ASCENDING order (oldest first).
 */
export async function fetchTracking(awb) {
  if (!BASE_URL) {
    throw new Error(
      'DPEX API not configured yet. Add credentials to .env once received from DPEX.'
    )
  }

  const headers = {
    'Content-Type' : 'application/json',
    'X-API-Key'    : API_KEY,
    'X-Account-No' : ACCOUNT_NO,
    'X-Entity-ID'  : ENTITY_ID,
    'X-Entity-Pin' : ENTITY_PIN,
    'X-Username'   : USERNAME,
    'X-Password'   : PASSWORD,
  }

  // Remove empty header values so we don't send blank strings
  Object.keys(headers).forEach(k => { if (!headers[k]) delete headers[k] })

  let res
  try {
    res = await fetch(`${BASE_URL}/api/track/${awb}`, { headers })
  } catch (networkErr) {
    throw new Error(`Cannot reach DPEX API: ${networkErr.message}`)
  }

  if (!res.ok) {
    throw new Error(`DPEX API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.status !== 200) {
    throw new Error(data.message || 'AWB not found in DPEX system')
  }

  return normaliseTracking(data)
}

/**
 * Normalise the DPEX response into a clean internal shape.
 * Reverses the event array so newest event is shown first.
 */
function normaliseTracking(data) {
  const events = (data.value || []).map(item => ({
    activity : item.Activites     || '',
    details  : item.Details       || '',
    status   : item.Status        || '',
    city     : item.city          || '',
    date     : item.date          || '',
    time     : item.time          || '',
    cancelled: item.Cancel_resion || null,
  }))

  events.reverse() // newest first

  return {
    awb            : data['AWB NO']         || '',
    currentStatus  : data['Current Status'] || '',
    currentLocation: data.current_location  || '',
    events,
  }
}

/* ── Status colour badges ── */
export const TRACKING_STATUS_COLORS = {
  'Booked'    : 'bg-blue-100 text-blue-700',
  'Picked Up' : 'bg-yellow-100 text-yellow-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Delivered' : 'bg-green-100 text-green-700',
  'Cancelled' : 'bg-red-100 text-red-700',
}

export function statusColor(status) {
  return TRACKING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
}

/* ── Activity icon map ── */
export const ACTIVITY_ICONS = {
  'Shipment Booked'      : '📦',
  'Proceed For Pickup'   : '🚗',
  'Picked up'            : '🤝',
  'Picked Up And In Hub' : '🏭',
  'Despatched'           : '🚚',
  'Out for Delivery'     : '🛵',
  'Delivered'            : '✅',
}

export function activityIcon(activity) {
  if (activity.startsWith('Arrived At')) return '📍'
  return ACTIVITY_ICONS[activity] || '🔵'
}
