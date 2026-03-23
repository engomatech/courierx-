import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, HUBS, ROUTE_CODES, DRIVERS } from '../utils'
import { Plus, ClipboardList, ChevronDown, ChevronUp, Play, User } from 'lucide-react'

const DRS_STATUS_COLORS = {
  Pending:     'bg-slate-100 text-slate-700',
  'In Progress': 'bg-green-100 text-green-700',
  Completed:   'bg-emerald-100 text-emerald-700',
}

function DRSRow({ drs, onDrsClick }) {
  const [expanded, setExpanded] = useState(false)
  const shipments  = useStore((s) => s.shipments)
  const startDRS   = useStore((s) => s.startDRS)
  const [activeAWB, setActiveAWB] = useState(null)

  const drsShipments = shipments.filter((s) => drs.shipments.includes(s.awb))
  const delivered = drsShipments.filter((s) => s.status === 'Delivered').length
  const ndr       = drsShipments.filter((s) => s.status === 'Non-Delivery').length
  const pending   = drsShipments.filter((s) => !['Delivered', 'Non-Delivery'].includes(s.status)).length

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
              onClick={(e) => { e.stopPropagation(); onDrsClick(drs.id) }}
              className="font-mono font-semibold text-green-700 hover:text-green-900 hover:underline text-sm text-left"
            >
              {drs.id}
            </button>
            <div className="text-xs text-slate-400">{formatDate(drs.createdAt)}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <User size={14} className="text-slate-400" />
            {drs.driver}
          </div>
          <div className="text-sm text-slate-500">{drs.hub} · {drs.routeCode}</div>
          <div className="flex gap-2 text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{delivered} del</span>
            {ndr > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{ndr} ndr</span>}
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pending} pend</span>
          </div>
          <div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${DRS_STATUS_COLORS[drs.status] || 'bg-slate-100'}`}>
              {drs.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {drs.status === 'Pending' && (
            <button onClick={() => startDRS(drs.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1">
              <Play size={12} /> Start Delivery
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-slate-50 px-5 py-4">
          <p className="text-xs font-medium text-slate-500 mb-3">DELIVERY SHIPMENTS</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">AWB / HAWB</th>
                <th className="pb-2 font-medium">Receiver</th>
                <th className="pb-2 font-medium">Address</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drsShipments.map((s) => (
                <tr key={s.awb} className="border-t">
                  <td className="py-2 text-xs">
                    <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-green-700 hover:text-green-900 hover:underline block">{s.awb}</button>
                    {s.hawb && <span className="font-mono text-slate-400">H: {s.hawb}</span>}
                  </td>
                  <td className="py-2 text-xs font-medium">{s.receiver.name}</td>
                  <td className="py-2 text-xs text-slate-500">{s.receiver.address}, {s.receiver.city}</td>
                  <td className="py-2 text-xs text-slate-500">{s.receiver.phone}</td>
                  <td className="py-2"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </>
  )
}

export default function DRS() {
  const drs        = useStore((s) => s.drs)
  const shipments  = useStore((s) => s.shipments)
  const createDRS  = useStore((s) => s.createDRS)

  const [open, setOpen]     = useState(false)
  const [filter, setFilter] = useState('all')
  const [detailId, setDetailId] = useState(null)
  const [form, setForm]     = useState({ hub: HUBS[0], routeCode: ROUTE_CODES[0], driver: DRIVERS[0] })
  const [selAWBs, setSelAWBs] = useState([])

  const eligibleShipments = shipments.filter((s) => s.status === 'Hub Inbound')

  const filtered = filter === 'all' ? drs : drs.filter((d) => d.status === filter)
  const sorted   = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const toggleAWB = (awb) => setSelAWBs((p) => p.includes(awb) ? p.filter((a) => a !== awb) : [...p, awb])

  const handleCreate = (e) => {
    e.preventDefault()
    createDRS({ ...form, shipments: selAWBs })
    setOpen(false)
    setSelAWBs([])
    setForm({ hub: HUBS[0], routeCode: ROUTE_CODES[0], driver: DRIVERS[0] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {['all', 'Pending', 'In Progress', 'Completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors ${filter === f ? 'bg-green-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Create DRS
        </button>
      </div>

      {detailId && <EntityDetailDrawer type="drs" id={detailId} onClose={() => setDetailId(null)} />}

      <div className="space-y-3">
        {sorted.map((d) => <DRSRow key={d.id} drs={d} onDrsClick={setDetailId} />)}
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>No DRS records found</p>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Delivery Run Sheet" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hub</label>
              <select value={form.hub} onChange={(e) => setForm((f) => ({ ...f, hub: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                {HUBS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Route Code</label>
              <select value={form.routeCode} onChange={(e) => setForm((f) => ({ ...f, routeCode: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                {ROUTE_CODES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Driver</label>
              <select value={form.driver} onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                {DRIVERS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Select Shipments <span className="text-slate-400">(Hub Inbound shipments)</span>
            </label>
            {eligibleShipments.length === 0 ? (
              <p className="text-sm text-slate-400 border rounded-lg p-3 bg-slate-50">No Hub Inbound shipments available.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                {eligibleShipments.map((s) => (
                  <label key={s.awb}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                    <input type="checkbox" checked={selAWBs.includes(s.awb)} onChange={() => toggleAWB(s.awb)} className="rounded" />
                    <span className="font-mono text-green-700 text-xs">{s.awb}</span>
                    <div className="flex-1">
                      <span className="text-sm text-slate-700">{s.receiver.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{s.receiver.address}, {s.receiver.city}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
              Create DRS
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
