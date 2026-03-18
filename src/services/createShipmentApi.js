/**
 * Online Express — CreateShipment API Service
 *
 * Endpoint: POST https://onlineexpressdev.shop/api/developer/V1/CreateShipment
 *
 * This module pushes new shipments from CourierX into the Online Express
 * (partner) system so they appear in the partner's pipeline.
 *
 * ⚠️  Field names marked with TODO should be confirmed against the
 *     Online Express developer portal once credentials are available.
 *     URL: https://onlineexpressdev.shop/login
 */

/* ─────────────────────────────────────────────────────────────────────────────
   ERROR CODES
   Covers all known failure modes so the UI can show meaningful messages
   instead of raw network/HTTP errors.
───────────────────────────────────────────────────────────────────────────── */
export const CREATE_ERRORS = {
  NO_CARRIER        : 'NO_CARRIER',        // No active carrier configured in admin
  NO_ENDPOINT       : 'NO_ENDPOINT',       // createShipmentUrl not set on carrier
  NETWORK           : 'NETWORK',           // Cannot reach the API server
  AUTH              : 'AUTH',              // 401 / 403 — bad credentials
  VALIDATION        : 'VALIDATION',        // 422 — missing / invalid fields
  DUPLICATE         : 'DUPLICATE',         // AWB already exists in partner system
  SERVER            : 'SERVER',            // 500 — partner server error
  UNKNOWN           : 'UNKNOWN',           // Anything else
}

/* ─────────────────────────────────────────────────────────────────────────────
   buildPayload
   Maps a CourierX shipment object into the Online Express request body.

   TODO: Confirm exact field names from the Online Express developer portal.
         The names below follow the URL pattern + standard courier API conventions
         and will match in most cases, but some may need renaming.
───────────────────────────────────────────────────────────────────────────── */
function buildPayload(shipment, carrier) {
  return {
    // ── Authentication ────────────────────────────────────────────
    // TODO: confirm which auth fields Online Express requires in the body vs headers
    api_key      : carrier.apiKey    || '',
    account_no   : carrier.accountNo || '',
    entity_id    : carrier.entityId  || '',
    entity_pin   : carrier.entityPin || '',
    username     : carrier.username  || '',
    password     : carrier.password  || '',

    // ── Shipment reference ────────────────────────────────────────
    // TODO: confirm field name — may be "awb_no", "slip_no", "reference_no"
    awb_no       : shipment.awb          || '',
    service_type : shipment.serviceType  || '',

    // ── Sender ───────────────────────────────────────────────────
    // TODO: confirm nested vs flat structure
    sender_name    : shipment.sender?.name    || '',
    sender_phone   : shipment.sender?.phone   || '',
    sender_address : shipment.sender?.address || '',
    sender_city    : shipment.sender?.city    || '',
    sender_country : shipment.sender?.country || 'Zambia',

    // ── Receiver ─────────────────────────────────────────────────
    receiver_name    : shipment.receiver?.name    || '',
    receiver_phone   : shipment.receiver?.phone   || '',
    receiver_address : shipment.receiver?.address || '',
    receiver_city    : shipment.receiver?.city    || '',
    receiver_country : shipment.receiver?.country || 'Zambia',

    // ── Package ──────────────────────────────────────────────────
    description : shipment.description || '',
    weight      : shipment.weight      || 0,
    length      : shipment.length      || 0,
    width       : shipment.width       || 0,
    height      : shipment.height      || 0,
    quantity    : shipment.quantity    || 1,
    value       : shipment.valueZK     || 0,
    currency    : 'ZMW',  // Zambian Kwacha
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   parseError
   Turns any HTTP / network error into a structured { code, message } object
   so the UI always gets a consistent, human-readable result.
───────────────────────────────────────────────────────────────────────────── */
function parseError(status, body) {
  // 401 / 403 — authentication failure
  if (status === 401 || status === 403) {
    return {
      code   : CREATE_ERRORS.AUTH,
      message: 'Authentication failed. Check your API key and credentials in Admin → Settings → Third Party Carriers.',
    }
  }

  // 422 — field validation error (most common during setup)
  if (status === 422) {
    const details = body?.errors
      ? Object.entries(body.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      : body?.message || 'One or more required fields are missing or invalid.'
    return {
      code   : CREATE_ERRORS.VALIDATION,
      message: `Validation error — ${details}`,
    }
  }

  // 409 — duplicate shipment
  if (status === 409) {
    return {
      code   : CREATE_ERRORS.DUPLICATE,
      message: body?.message || 'This AWB already exists in the Online Express system.',
    }
  }

  // 5xx — partner server error (not our fault)
  if (status >= 500) {
    return {
      code   : CREATE_ERRORS.SERVER,
      message: `Online Express server error (${status}). Please try again in a few minutes or contact Online Express support.`,
    }
  }

  // Fallback
  return {
    code   : CREATE_ERRORS.UNKNOWN,
    message: body?.message || `Unexpected error (HTTP ${status}).`,
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   createShipment
   Main export — pushes a CourierX shipment to Online Express.

   @param {object} shipment   — Online Express shipment object
   @param {object} carrier    — Active carrier from adminStore
   @returns {{ success, awb, partnerRef, message, error? }}
───────────────────────────────────────────────────────────────────────────── */
export async function createShipment(shipment, carrier) {
  // ── Guard: no active carrier ────────────────────────────────────
  if (!carrier) {
    return {
      success: false,
      error  : {
        code   : CREATE_ERRORS.NO_CARRIER,
        message: 'No active carrier configured. Go to Admin → Settings → Third Party Carriers.',
      },
    }
  }

  // ── Guard: createShipmentUrl not set on this carrier ────────────
  const endpoint = carrier.createShipmentUrl || 'https://onlineexpressdev.shop/api/developer/V1/CreateShipment'
  if (!endpoint) {
    return {
      success: false,
      error  : {
        code   : CREATE_ERRORS.NO_ENDPOINT,
        message: 'CreateShipment URL not configured on the carrier. Edit the carrier in Admin → Settings.',
      },
    }
  }

  // ── Build payload ────────────────────────────────────────────────
  const payload = buildPayload(shipment, carrier)

  // ── POST to Online Express ───────────────────────────────────────
  let res
  try {
    res = await fetch(endpoint, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body   : JSON.stringify(payload),
    })
  } catch (networkErr) {
    return {
      success: false,
      error  : {
        code   : CREATE_ERRORS.NETWORK,
        message: `Cannot reach Online Express: ${networkErr.message}. Check your internet connection or the API URL.`,
      },
    }
  }

  // ── Parse response body ──────────────────────────────────────────
  let body = null
  try { body = await res.json() } catch { /* non-JSON response is OK */ }

  // ── Error responses ──────────────────────────────────────────────
  if (!res.ok) {
    return { success: false, error: parseError(res.status, body) }
  }

  // ── Success ──────────────────────────────────────────────────────
  // TODO: confirm exact field names from Online Express success response
  // Common patterns: body.awb_no / body.slip_no / body.reference / body.data.awb
  return {
    success   : true,
    awb       : shipment.awb,
    partnerRef: body?.awb_no || body?.slip_no || body?.reference || body?.data?.awb || '',
    message   : body?.message || 'Shipment created successfully in Online Express.',
    raw       : body, // keep full response for debugging
  }
}
