import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, CITIES, HUBS, ROUTE_CODES, DRIVERS } from '../utils'
import { Plus, ChevronDown, ChevronUp, Truck, User, MapPin } from 'lucide-react'

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select {...props} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function PRSRow({ prs, onPrsClick }) {
  const [expanded, setExpanded] = useState(false)
  const shipments       = useStore((s) => s.shipments)
  const updatePRSStatus = useStore((s) => s.updatePRSStatus)
  const [activeAWB, setActiveAWB] = useState(null)

  const prsShipments = shipments.filter((s) => prs.shipments.includes(s.awb))

  return (
    <>
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); onPrsClick(prs.id) }}
              className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm text-left"
            >
              {prs.id}
            </button>
            <div className="text-xs text-slate-400">{formatDate(prs.createdAt)}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400" />
            {prs.city} — {prs.hub}
          </div>
          <div className="text-sm text-slate-500">{prs.routeCode}</div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <User size={14} className="text-slate-400" />
            {prs.driver}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={prs.status} type="prs" />
            <span className="text-xs text-slate-400">{prs.shipments.length} pkgs</span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {prs.status === 'Pending' && (
            <button
              onClick={() => updatePRSStatus(prs.id, 'Proceed')}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              Proceed for Pickup
            </button>
          )}
          {prs.status === 'Proceed' && (
            <button
              onClick={() => updatePRSStatus(prs.id, 'Completed')}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Mark Completed
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-slate-50 px-5 py-4">
          <p className="text-xs font-medium text-slate-500 mb-3">SHIPMENTS IN THIS PRS</p>
          {prsShipments.length === 0 ? (
            <p className="text-sm text-slate-400">No shipments assigned yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">AWB / HAWB</th>
                  <th className="pb-2 font-medium">Sender</th>
                  <th className="pb-2 font-medium">Receiver</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {prsShipments.map((s) => (
                  <tr key={s.awb} className="border-t">
                    <td className="py-2 text-xs">
                      <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-blue-600 hover:text-blue-800 hover:underline block">{s.awb}</button>
                      {s.hawb && <span className="font-mono text-slate-400">H: {s.hawb}</span>}
                    </td>
                    <td className="py-2">{s.sender.name} <span className="text-slate-400 text-xs">({s.sender.city})</span></td>
                    <td className="py-2">{s.receiver.name} <span className="text-slate-400 text-xs">({s.receiver.city})</span></td>
                    <td className="py-2">{s.weight} kg</td>
                    <td className="py-2"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
    {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </>
  )
}

export default function PRS() {
  const prs               = useStore((s) => s.prs)
  const shipments         = useStore((s) => s.shipments)
  const createPRS         = useStore((s) => s.createPRS)
  const addShipmentsToPRS = useStore((s) => s.addShipmentsToPRS)

  const [open, setOpen]           = useState(false)
  const [selectedAWBs, setSelectedAWBs] = useState([])
  const [filter, setFilter]       = useState('all')
  const [detailId, setDetailId]   = useState(null)
  const [form, setForm]           = useState({
    country: 'Zambia', city: CITIES[0], hub: HUBS[0], routeCode: ROUTE_CODES[0], driver: DRIVERS[0],
  })

  const eligibleShipments = shipments.filter((s) => s.status === 'Confirmed')

  const filtered = filter === 'all' ? prs : prs.filter((p) => p.status === filter)
  const sorted   = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const toggleAWB = (awb) =>
    setSelectedAWBs((prev) => prev.includes(awb) ? prev.filter((a) => a !== awb) : [...prev, awb])

  const handleCreate = (e) => {
    e.preventDefault()
    const id = createPRS(form)
    if (selectedAWBs.length > 0) addShipmentsToPRS(id, selectedAWBs)
    setOpen(false)
    setForm({ country: 'Zambia', city: CITIES[0], hub: HUBS[0], routeCode: ROUTE_CODES[0], driver: DRIVERS[0] })
    setSelectedAWBs([])
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {['all', 'Pending', 'Proceed', 'Completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Create PRS
        </button>
      </div>

      {detailId && <EntityDetailDrawer type="prs" id={detailId} onClose={() => setDetailId(null)} />}

      {/* PRS list */}
      <div className="space-y-3">
        {sorted.map((p) => <PRSRow key={p.id} prs={p} onPrsClick={setDetailId} />)}
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No PRS records found</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Pickup Run Sheet" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Select label="City" options={CITIES} value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <Select label="Hub" options={HUBS} value={form.hub}
              onChange={(e) => setForm((f) => ({ ...f, hub: e.target.value }))} />
            <Select label="Route Code" options={ROUTE_CODES} value={form.routeCode}
              onChange={(e) => setForm((f) => ({ ...f, routeCode: e.target.value }))} />
            <div className="col-span-2">
              <Select label="Driver / Messenger" options={DRIVERS} value={form.driver}
                onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))} />
            </div>
          </div>

          {/* Shipment selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Assign Shipments <span className="text-slate-400">(optional — Confirmed shipments only)</span>
            </label>
            {eligibleShipments.length === 0 ? (
              <p className="text-sm text-slate-400 border rounded-lg p-3 bg-slate-50">No confirmed shipments available.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {eligibleShipments.map((s) => (
                  <label key={s.awb}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                    <input type="checkbox" checked={selectedAWBs.includes(s.awb)}
                      onChange={() => toggleAWB(s.awb)} className="rounded" />
                    <span className="font-mono text-blue-600 text-xs">{s.awb}</span>
                    <span className="text-sm text-slate-700">{s.sender.name}</span>
                    <span className="text-xs text-slate-400">→ {s.receiver.city}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Create PRS
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
