import { useState } from 'react'
import { Calculator, Search, Package, FileText, Globe, MapPin, Truck, Clock } from 'lucide-react'
import { useAdminStore } from '../../admin/adminStore'

// Compute rate for a service given weight, origin city, destination city
function computeRate(serviceId, weight, originCityId, destCityId, services, domZones, intZones, pricing, countries, cities, mode) {
  const service = services.find((s) => s.id === serviceId)
  if (!service) return null

  const pricingData = pricing[serviceId]
  if (!pricingData) return null

  let zoneId = null

  if (mode === 'Domestic') {
    // Find domestic zone containing destination city
    zoneId = domZones.find((z) => z.cities.includes(destCityId))?.id
  } else {
    // Find destination country, then find int zone containing it
    const destCity = cities.find((c) => c.id === destCityId)
    if (destCity) {
      zoneId = intZones.find((z) => z.countries.includes(destCity.countryId))?.id
    }
  }

  if (!zoneId) return null

  const { slabs, extraKgRates } = pricingData
  if (!slabs?.length) return null

  // Find matching slab
  let matchedSlab = slabs[slabs.length - 1] // default to last slab
  for (const slab of slabs) {
    if (weight >= slab.min && weight <= slab.max) {
      matchedSlab = slab
      break
    }
  }

  const baseRate = matchedSlab.rates[zoneId]
  if (baseRate === undefined) return null

  let total = baseRate
  if (weight > matchedSlab.max && extraKgRates?.[zoneId]) {
    total += (weight - matchedSlab.max) * extraKgRates[zoneId]
  }

  return { total: +total.toFixed(2), zoneId }
}

export default function CustomerRateCalculator() {
  const services  = useAdminStore((s) => s.services)
  const domZones  = useAdminStore((s) => s.domZones)
  const intZones  = useAdminStore((s) => s.intZones)
  const pricing   = useAdminStore((s) => s.pricing)
  const countries = useAdminStore((s) => s.countries)
  const cities    = useAdminStore((s) => s.cities)

  const [mode, setMode] = useState('Domestic') // Domestic | International
  const [form, setForm] = useState({
    fromCityId: '',
    toCityId: '',
    toCityCountryId: '',
    hsCode: '',
    weight: '',
    height: '',
    width: '',
    length: '',
    quantity: '1',
    productType: 'Parcel', // Parcel | Document
  })
  const [results, setResults] = useState(null)
  const [searched, setSearched] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Available cities for from/to
  const domesticCities = cities.filter((c) => c.status === 'Active')
  const activeCountries = countries.filter((c) => c.status === 'Active')
  const toCities = mode === 'Domestic'
    ? domesticCities
    : cities.filter((c) => c.countryId === form.toCityCountryId && c.status === 'Active')

  const handleGetQuote = () => {
    const w = +form.weight || 1
    const modeServices = services.filter((s) =>
      s.status === 'Active' &&
      s.mode === mode &&
      (mode === 'Domestic' || s.productType === form.productType || form.productType === 'Document')
    )

    const quotes = modeServices.map((svc) => {
      const rate = computeRate(
        svc.id, w,
        form.fromCityId, form.toCityId,
        services, domZones, intZones, pricing, countries, cities, mode
      )
      return { service: svc, rate }
    }).filter((q) => q.rate !== null)

    setResults(quotes)
    setSearched(true)
  }

  const isFormValid = form.weight && +form.weight > 0 && form.fromCityId && form.toCityId

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Rate Calculator</h2>
        <p className="text-sm text-slate-400 mt-1">Get an instant shipping quote for domestic and international shipments.</p>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 w-fit">
        {['Domestic', 'International'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResults(null); setSearched(false) }}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors
              ${mode === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {m === 'Domestic' ? <><MapPin size={14} className="inline mr-1.5" />Domestic</> : <><Globe size={14} className="inline mr-1.5" />International</>}
          </button>
        ))}
      </div>

      {/* Calculator card */}
      <div className="bg-[#dce8f5] rounded-2xl p-6 space-y-4">
        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">From</label>
            <select
              value={form.fromCityId}
              onChange={(e) => set('fromCityId', e.target.value)}
              className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
            >
              <option value="">Choose a city...</option>
              {domesticCities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">To</label>
            {mode === 'International' && (
              <select
                value={form.toCityCountryId}
                onChange={(e) => { set('toCityCountryId', e.target.value); set('toCityId', '') }}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent mb-1"
              >
                <option value="">Choose country...</option>
                {activeCountries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <select
              value={form.toCityId}
              onChange={(e) => set('toCityId', e.target.value)}
              className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
            >
              <option value="">Choose a city...</option>
              {toCities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* HS Code (international only) + dimensions row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mode === 'International' && (
            <div className="bg-white rounded-xl p-3 col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-400 mb-1 block">HS Code</label>
              <input
                value={form.hsCode}
                onChange={(e) => set('hsCode', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="e.g. 8471"
              />
            </div>
          )}
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">Weight</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0" step="0.1"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-semibold">KG</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">Height</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0"
                value={form.height}
                onChange={(e) => set('height', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-semibold">CM</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">Width</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0"
                value={form.width}
                onChange={(e) => set('width', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-semibold">CM</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">Length</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0"
                value={form.length}
                onChange={(e) => set('length', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-semibold">CM</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3">
            <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min="1"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                className="w-full text-sm text-slate-700 focus:outline-none bg-transparent"
                placeholder="1"
              />
              <button
                onClick={() => set('quantity', String(+form.quantity + 1))}
                className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-base leading-none hover:bg-slate-700"
              >+</button>
            </div>
          </div>
        </div>

        {/* Product type */}
        <div>
          <label className="text-xs text-slate-600 font-semibold block mb-2">Shipment Product Type:</label>
          <div className="flex items-center gap-6">
            {['Parcel', 'Document'].map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="radio"
                  name="productType"
                  value={t}
                  checked={form.productType === t}
                  onChange={() => set('productType', t)}
                  className="w-4 h-4 accent-violet-600"
                />
                {t === 'Parcel' ? <Package size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-500" />}
                {t}
              </label>
            ))}
          </div>
        </div>

        {/* Get Quote button */}
        <button
          disabled={!isFormValid}
          onClick={handleGetQuote}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={16} /> Get Quote
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {results?.length ? `${results.length} service${results.length > 1 ? 's' : ''} available` : 'No services available for this route'}
          </h3>
          {results?.length > 0 ? (
            <div className="space-y-3">
              {results.map(({ service, rate }) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm hover:border-violet-300 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${service.deliveryType === 'Express' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    {service.deliveryType === 'Express'
                      ? <Truck size={20} className="text-amber-600" />
                      : <Package size={20} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{service.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={11} /> {service.deliveryDays} business days</span>
                      <span className="flex items-center gap-1"><Package size={11} /> Up to {service.maxWeight}kg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">Estimated</div>
                    <div className="text-xl font-extrabold text-violet-700">ZK {rate.total.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">for {form.weight}kg</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
              <Calculator size={28} className="text-slate-300 mx-auto mb-2" />
              <div className="text-slate-500 text-sm font-medium">No rates available</div>
              <div className="text-slate-400 text-xs mt-1">
                No services are configured for this route/zone combination yet. Please contact support.
              </div>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">
            * Rates are estimates based on weight and zone. Actual charges may vary. Volumetric weight may apply for large, light packages.
          </p>
        </div>
      )}
    </div>
  )
}
