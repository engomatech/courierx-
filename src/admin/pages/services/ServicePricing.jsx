import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Save, DollarSign, Info } from 'lucide-react'

function PricingMatrix({ service, pricing, zones, onSave }) {
  const initial = pricing[service.id] || { slabs: [], extraKgRates: {} }
  const [slabs, setSlabs]           = useState(initial.slabs)
  const [extraRates, setExtraRates] = useState(initial.extraKgRates || {})
  const [saved, setSaved]           = useState(false)

  const addSlab = () => setSlabs((s) => [
    ...s,
    { id: `sl-${Date.now()}`, min: '', max: '', rates: Object.fromEntries(zones.map((z) => [z.id, ''])) }
  ])

  const removeSlab = (id) => setSlabs((s) => s.filter((sl) => sl.id !== id))

  const updateSlab = (id, field, val) => setSlabs((s) =>
    s.map((sl) => sl.id === id ? { ...sl, [field]: val } : sl)
  )

  const updateRate = (slabId, zoneId, val) => setSlabs((s) =>
    s.map((sl) => sl.id === slabId ? { ...sl, rates: { ...sl.rates, [zoneId]: val } } : sl)
  )

  const handleSave = () => {
    onSave(service.id, {
      slabs: slabs.map((sl) => ({
        ...sl,
        min: +sl.min, max: +sl.max,
        rates: Object.fromEntries(Object.entries(sl.rates).map(([k, v]) => [k, +v])),
      })),
      extraKgRates: Object.fromEntries(Object.entries(extraRates).map(([k, v]) => [k, +v])),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Service info banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-violet-800">{service.name}</p>
          <p className="text-sm text-violet-600 mt-0.5">
            {service.mode} · {service.productType} · {service.deliveryType} · {service.deliveryDays} days
            {service.codSupport && ' · COD Supported'}
          </p>
        </div>
      </div>

      {zones.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-slate-400">
          <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
          <p>No {service.mode === 'Domestic' ? 'domestic' : 'international'} zones configured yet.</p>
          <p className="text-sm mt-1">Set up zones first in Zone Management.</p>
        </div>
      ) : (
        <>
          {/* Weight slab pricing table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-900">Weight Slab Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set price per weight range for each destination zone</p>
              </div>
              <button onClick={addSlab}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                <Plus size={13} /> Add Weight Slab
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Weight From (kg)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Weight To (kg)</th>
                    {zones.map((z) => (
                      <th key={z.id} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase whitespace-nowrap">
                        {z.code || z.name}
                      </th>
                    ))}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.length === 0 ? (
                    <tr>
                      <td colSpan={zones.length + 3} className="text-center py-8 text-slate-400">
                        No weight slabs. Click "Add Weight Slab" to start.
                      </td>
                    </tr>
                  ) : (
                    slabs.map((slab, i) => (
                      <tr key={slab.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" min="0" value={slab.min}
                            onChange={(e) => updateSlab(slab.id, 'min', e.target.value)}
                            className="w-24 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" min="0" value={slab.max}
                            onChange={(e) => updateSlab(slab.id, 'max', e.target.value)}
                            className="w-24 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </td>
                        {zones.map((z) => (
                          <td key={z.id} className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                              <input type="number" step="0.01" min="0"
                                value={slab.rates[z.id] ?? ''}
                                onChange={(e) => updateRate(slab.id, z.id, e.target.value)}
                                className="w-24 border rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <button onClick={() => removeSlab(slab.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extra KG rates */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-900">Additional Per-KG Rate</h3>
              <p className="text-xs text-slate-500 mt-0.5">Charge per extra kilogram beyond the final weight slab</p>
            </div>
            <div className="p-5 flex flex-wrap gap-4">
              {zones.map((z) => (
                <div key={z.id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">{z.code || z.name}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input type="number" step="0.01" min="0"
                      value={extraRates[z.id] ?? ''}
                      onChange={(e) => setExtraRates((r) => ({ ...r, [z.id]: e.target.value }))}
                      className="w-28 border rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0.00" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}>
              <Save size={15} />
              {saved ? 'Saved!' : 'Save Pricing'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function ServicePricing() {
  const services    = useAdminStore((s) => s.services)
  const pricing     = useAdminStore((s) => s.pricing)
  const domZones    = useAdminStore((s) => s.domZones)
  const intZones    = useAdminStore((s) => s.intZones)
  const setPricing  = useAdminStore((s) => s.setPricing)

  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId]     = useState(searchParams.get('service') || services[0]?.id || '')

  const selectedService = services.find((s) => s.id === selectedId)
  const zones = selectedService?.mode === 'Domestic' ? domZones : intZones

  return (
    <div className="space-y-5">
      {/* Service selector */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">Select Shipping Service to Configure Pricing</label>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <button key={s.id} onClick={() => { setSelectedId(s.id); setSearchParams({ service: s.id }) }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                selectedId === s.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600'
              }`}>
              {s.name}
              <span className={`ml-1.5 text-xs ${selectedId === s.id ? 'opacity-75' : 'text-slate-400'}`}>({s.mode})</span>
            </button>
          ))}
        </div>
      </div>

      {selectedService ? (
        <PricingMatrix key={selectedId} service={selectedService} pricing={pricing} zones={zones} onSave={setPricing} />
      ) : (
        <div className="bg-white rounded-xl border p-10 text-center text-slate-400">
          No service selected.
        </div>
      )}
    </div>
  )
}
