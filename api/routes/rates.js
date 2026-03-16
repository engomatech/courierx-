/**
 * Rates Route
 *
 * POST /api/v1/rates — GetRates
 *
 * Returns pricing for all active services that cover the requested
 * origin/destination pair. Uses the same zone + slab pricing logic
 * as CustomerRateCalculator.jsx in the React frontend.
 *
 * Request body:
 *   { "from_city": "Lusaka", "to_city": "Ndola", "weight": 3.5,
 *     "length": 40, "width": 30, "height": 20 }
 *
 * Response:
 *   { "rates": [{ "service_id", "name", "code", "delivery_days", "price", "currency" }] }
 */

const express = require('express')
const db      = require('../db')

const router = express.Router()

// ── Prepared statements ──────────────────────────────────────────────────────
const getServices  = db.prepare("SELECT * FROM pricing_services WHERE status = 'Active'")
const getZones     = db.prepare('SELECT * FROM pricing_zones')
const getSlabs     = db.prepare('SELECT * FROM pricing_slabs WHERE service_id = ? ORDER BY min_weight ASC')
const getCities    = db.prepare('SELECT * FROM cities')

// ── computeRate — mirrors CustomerRateCalculator.jsx logic ───────────────────
function computeRate(serviceId, weight, originCityId, destCityId, services, zones, slabsCache) {
  const service = services.find(s => s.id === serviceId)
  if (!service) return null

  // Check weight limits
  if (weight < service.min_weight || weight > service.max_weight) return null

  const domZones = zones.filter(z => z.mode === 'Domestic')
  const intZones = zones.filter(z => z.mode === 'International')

  let zoneId = null

  if (service.mode === 'Domestic') {
    for (const z of domZones) {
      const members = JSON.parse(z.members)
      if (members.includes(destCityId)) { zoneId = z.id; break }
    }
  } else {
    // International: look up destination country via cities table
    // Cities are keyed by id; we match by name so need to find countryId
    // For simplicity: intZones store country IDs — we match dest city → country via a lookup
    // (The city table we seeded only has Zambian cities; for international,
    //  we rely on city IDs from the broader city list stored in zones members)
    for (const z of intZones) {
      const members = JSON.parse(z.members)
      if (members.includes(destCityId)) { zoneId = z.id; break }
    }
  }

  if (!zoneId) return null

  const slabs = slabsCache[serviceId] || []
  if (!slabs.length) return null

  // Find the best matching slab that has a rate for this zone.
  // Multiple slabs may cover the same weight range (e.g. US zones vs Zambian zones
  // are stored as separate slab rows) — scan all and pick the first with a rate.
  const weightMatches = slabs.filter(s => weight >= s.min_weight && weight <= s.max_weight)
  if (!weightMatches.length) {
    // Fallback: use the last slab (covers heaviest items)
    weightMatches.push(slabs[slabs.length - 1])
  }

  let matchedSlab = null
  for (const slab of weightMatches) {
    const r = JSON.parse(slab.rates_json)
    if (r[zoneId] !== undefined) { matchedSlab = slab; break }
  }
  if (!matchedSlab) return null

  const rates      = JSON.parse(matchedSlab.rates_json)
  const extraRates = JSON.parse(matchedSlab.extra_rates || '{}')

  const baseRate = rates[zoneId]
  if (baseRate === undefined) return null

  let total = baseRate
  if (weight > matchedSlab.max_weight && extraRates[zoneId]) {
    total += (weight - matchedSlab.max_weight) * extraRates[zoneId]
  }

  return +(total.toFixed(2))
}

// ── POST /api/v1/rates ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { from_city, to_city, weight, length, width, height } = req.body || {}

  if (!to_city || weight === undefined) {
    return res.status(422).json({
      error  : 'VALIDATION_ERROR',
      message: 'to_city and weight are required.',
      fields : {
        ...(!to_city             && { to_city: 'Required' }),
        ...(weight === undefined && { weight: 'Required' }),
      },
    })
  }

  const numWeight = parseFloat(weight) || 0

  // Volumetric weight (divisor 5000 matches adminStore.js setting)
  let volumetricWeight = 0
  if (length && width && height) {
    volumetricWeight = (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 5000
  }
  const chargeableWeight = Math.max(numWeight, volumetricWeight)

  // Load data from DB
  const services = getServices.all()
  const zones    = getZones.all()
  const allCities = getCities.all()

  // Pre-load all slabs grouped by service
  const slabsCache = {}
  services.forEach(svc => {
    slabsCache[svc.id] = getSlabs.all(svc.id)
  })

  // Resolve city IDs from names (case-insensitive)
  const normalize = s => (s || '').trim().toLowerCase()
  const findCityId = name => {
    const city = allCities.find(c => normalize(c.name) === normalize(name))
    return city?.id || name  // fallback: use name as-is (may match zone member lists)
  }

  const originCityId = findCityId(from_city || '')
  const destCityId   = findCityId(to_city)

  // Compute rates for all active services
  const rates = []
  for (const svc of services) {
    const price = computeRate(svc.id, chargeableWeight, originCityId, destCityId, services, zones, slabsCache)
    if (price !== null) {
      rates.push({
        service_id    : svc.id,
        name          : svc.name,
        code          : svc.code,
        mode          : svc.mode,
        delivery_days : svc.delivery_days,
        price,
        currency      : 'ZMW',
        chargeable_weight: chargeableWeight,
      })
    }
  }

  return res.json({
    from_city        : from_city  || '',
    to_city,
    weight           : numWeight,
    volumetric_weight: +volumetricWeight.toFixed(3),
    chargeable_weight: +chargeableWeight.toFixed(3),
    rates,
  })
})

module.exports = router
