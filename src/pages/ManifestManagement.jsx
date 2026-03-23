import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, HUBS, TRANSPORTERS } from '../utils'
import { Plus, FileStack, ChevronDown, ChevronUp, Truck, Send } from 'lucide-react'

const MANIFEST_STATUS_COLORS = {
  Open:       'bg-blue-100 text-blue-700',
  Dispatched: 'bg-orange-100 text-orange-700',
  Arrived:    'bg-green-100 text-green-700',
}

function ManifestRow({ manifest, onManifestClick }) {
  const [expanded, setExpanded] = useState(false)
  const bags              = useStore((s) => s.bags)
  const shipments         = useStore((s) => s.shipments)
  const dispatchManifest  = useStore((s) => s.dispatchManifest)
  const arriveManifest    = useStore((s) => s.arriveManifest)
  const [activeAWB, setActiveAWB] = useState(null)

  const manifestBags = bags.filter((b) => manifest.bags.includes(b.id))
  const directShipments = shipments.filter((s) => manifest.shipments.includes(s.awb))
  const totalShipments = manifestBags.reduce((acc, b) => acc + b.shipments.length, 0) + directShipments.length

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
              onClick={(e) => { e.stopPropagation(); onManifestClick(manifest.id) }}
              className="font-mono font-semibold text-cyan-700 hover:text-cyan-900 hover:underline text-sm text-left"
            >
              {manifest.id}
            </button>
            <div className="text-xs text-slate-400">{formatDate(manifest.createdAt)}</div>
          </div>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              manifest.type === 'Bag' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
            }`}>{manifest.type}</span>
          </div>
          <div className="text-sm text-slate-600">
            <div>{manifest.origin}</div>
            <div className="text-xs text-slate-400">→ {manifest.destination}</div>
          </div>
          <div className="text-sm text-slate-500">{manifest.transporter}</div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${MANIFEST_STATUS_COLORS[manifest.status] || 'bg-slate-100 text-slate-600'}`}>
              {manifest.status}
            </span>
            <span className="text-xs text-slate-400">{totalShipments} pkgs</span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {manifest.status === 'Open' && (
            <button onClick={() => dispatchManifest(manifest.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-1">
              <Send size={12} /> Dispatch
            </button>
          )}
          {manifest.status === 'Dispatched' && (
            <button onClick={() => arriveManifest(manifest.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1">
              <Truck size={12} /> Mark Arrived
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-slate-50 px-5 py-4 space-y-4">
          {manifest.dispatchedAt && (
            <div className="text-xs text-slate-500">
              Dispatched: <span className="font-medium">{formatDate(manifest.dispatchedAt)}</span>
              {manifest.arrivedAt && <> &nbsp;·&nbsp; Arrived: <span className="font-medium">{formatDate(manifest.arrivedAt)}</span></>}
            </div>
          )}

          {manifestBags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">BAGS</p>
              <div className="space-y-2">
                {manifestBags.map((bag) => (
                  <div key={bag.id} className="bg-white rounded-lg border px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-600 text-sm font-medium">{bag.id}</span>
                      <span className="text-xs text-slate-500">{bag.destination} · {bag.mode} · {bag.shipments.length} pkgs</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bag.shipments.map((awb) => (
                        <button key={awb} onClick={() => setActiveAWB(awb)} className="font-mono text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded transition-colors">{awb}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {directShipments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">DIRECT SHIPMENTS</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">AWB</th>
                    <th className="pb-2 font-medium">Receiver</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {directShipments.map((s) => (
                    <tr key={s.awb} className="border-t">
                      <td className="py-2 text-xs">
                        <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-cyan-700 hover:text-cyan-900 hover:underline">{s.awb}</button>
                        {s.hawb && <div className="text-slate-400 font-mono">H: {s.hawb}</div>}
                      </td>
                      <td className="py-2 text-xs">{s.receiver.name}, {s.receiver.city}</td>
                      <td className="py-2"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
    {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </>
  )
}

export default function ManifestManagement() {
  const manifests       = useStore((s) => s.manifests)
  const bags            = useStore((s) => s.bags)
  const shipments       = useStore((s) => s.shipments)
  const createManifest  = useStore((s) => s.createManifest)

  const [open, setOpen]     = useState(false)
  const [filter, setFilter] = useState('all')
  const [detailId, setDetailId] = useState(null)
  const [form, setForm]     = useState({
    type: 'Bag', origin: HUBS[0], destination: HUBS[1], transporter: TRANSPORTERS[0],
  })
  const [selBags, setSelBags] = useState([])
  const [selAWBs, setSelAWBs] = useState([])

  const eligibleBags = bags.filter((b) => b.status === 'Closed')
  const eligibleShipments = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId)

  const filtered = filter === 'all' ? manifests : manifests.filter((m) => m.status === filter)
  const sorted   = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const toggleBag = (id) => setSelBags((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])
  const toggleAWB = (awb) => setSelAWBs((p) => p.includes(awb) ? p.filter((a) => a !== awb) : [...p, awb])

  const handleCreate = (e) => {
    e.preventDefault()
    createManifest({ ...form, bags: selBags, shipments: selAWBs })
    setOpen(false)
    setSelBags([])
    setSelAWBs([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {['all', 'Open', 'Dispatched', 'Arrived'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors ${filter === f ? 'bg-cyan-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Create Manifest
        </button>
      </div>

      {detailId && <EntityDetailDrawer type="manifest" id={detailId} onClose={() => setDetailId(null)} />}

      <div className="space-y-3">
        {sorted.map((m) => <ManifestRow key={m.id} manifest={m} onManifestClick={setDetailId} />)}
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
            <FileStack size={40} className="mx-auto mb-3 opacity-30" />
            <p>No manifests found</p>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Manifest" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                <option>Bag</option>
                <option>Direct</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Transporter</label>
              <select value={form.transporter} onChange={(e) => setForm((f) => ({ ...f, transporter: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                {TRANSPORTERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Origin Hub</label>
              <select value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                {HUBS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination Hub</label>
              <select value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                {HUBS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {form.type === 'Bag' ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Select Bags (Closed bags only)</label>
              {eligibleBags.length === 0 ? (
                <p className="text-sm text-slate-400 border rounded-lg p-3 bg-slate-50">No closed bags available.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {eligibleBags.map((b) => (
                    <label key={b.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                      <input type="checkbox" checked={selBags.includes(b.id)} onChange={() => toggleBag(b.id)} className="rounded" />
                      <span className="font-mono text-indigo-600 text-xs">{b.id}</span>
                      <span className="text-sm">{b.destination}</span>
                      <span className="text-xs text-slate-400 ml-auto">{b.mode} · {b.shipments.length} pkgs</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Select Shipments (Direct)</label>
              {eligibleShipments.length === 0 ? (
                <p className="text-sm text-slate-400 border rounded-lg p-3 bg-slate-50">No eligible shipments.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {eligibleShipments.map((s) => (
                    <label key={s.awb}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                      <input type="checkbox" checked={selAWBs.includes(s.awb)} onChange={() => toggleAWB(s.awb)} className="rounded" />
                      <span className="font-mono text-cyan-600 text-xs">{s.awb}</span>
                      <span className="text-sm">{s.receiver.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium">
              Create Manifest
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
