import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, CITIES } from '../utils'
import { Plus, Package, ChevronDown, ChevronUp, Archive, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const BAG_STATUS_COLORS = {
  Open:      'bg-blue-100 text-blue-700',
  Closed:    'bg-slate-100 text-slate-700',
  Manifested:'bg-cyan-100 text-cyan-700',
  'Hub Scanned': 'bg-teal-100 text-teal-700',
}

function BagRow({ bag, onBagClick }) {
  const [expanded, setExpanded] = useState(false)
  const shipments        = useStore((s) => s.shipments)
  const addShipmentsToBag = useStore((s) => s.addShipmentsToBag)
  const closeBag         = useStore((s) => s.closeBag)
  const [activeAWB, setActiveAWB] = useState(null)

  const bagShipments = shipments.filter((s) => bag.shipments.includes(s.awb))
  const eligibleToAdd = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId)

  const [addOpen, setAddOpen] = useState(false)
  const [sel, setSel] = useState([])

  const toggleSel = (awb) => setSel((p) => p.includes(awb) ? p.filter((a) => a !== awb) : [...p, awb])

  const handleAdd = () => {
    addShipmentsToBag(bag.id, sel)
    setSel([])
    setAddOpen(false)
  }

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
              onClick={(e) => { e.stopPropagation(); onBagClick(bag.id) }}
              className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 hover:underline text-sm text-left"
            >
              {bag.id}
            </button>
            <div className="text-xs text-slate-400">{formatDate(bag.createdAt)}</div>
          </div>
          <div className="text-sm text-slate-600">{bag.destination}</div>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              bag.mode === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>{bag.mode}</span>
          </div>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BAG_STATUS_COLORS[bag.status] || 'bg-slate-100 text-slate-600'}`}>
              {bag.status}
            </span>
          </div>
          <div className="text-sm text-slate-500">{bag.shipments.length} shipments</div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {bag.status === 'Open' && (
            <>
              <button onClick={() => setAddOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium">
                Add Shipments
              </button>
              <button onClick={() => closeBag(bag.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium">
                Close Bag
              </button>
            </>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-slate-50 px-5 py-4">
          <p className="text-xs font-medium text-slate-500 mb-3">SHIPMENTS IN BAG</p>
          {bagShipments.length === 0 ? (
            <p className="text-sm text-slate-400">No shipments in this bag.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">AWB</th>
                  <th className="pb-2 font-medium">Sender</th>
                  <th className="pb-2 font-medium">Receiver City</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bagShipments.map((s) => (
                  <tr key={s.awb} className="border-t">
                    <td className="py-2 text-xs">
                      <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-indigo-600 hover:text-indigo-800 hover:underline">{s.awb}</button>
                      {s.hawb && <div className="text-slate-400 font-mono">H: {s.hawb}</div>}
                    </td>
                    <td className="py-2 text-xs">{s.sender.name}</td>
                    <td className="py-2 text-xs">{s.receiver.city}</td>
                    <td className="py-2 text-xs">{s.weight} kg</td>
                    <td className="py-2"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add shipments modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add Shipments to ${bag.id}`}>
        <div className="space-y-4">
          {eligibleToAdd.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No eligible shipments (Origin Scanned, unbagged).</p>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {eligibleToAdd.map((s) => (
                <label key={s.awb}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                  <input type="checkbox" checked={sel.includes(s.awb)} onChange={() => toggleSel(s.awb)} className="rounded" />
                  <span className="font-mono text-blue-600 text-xs">{s.awb}</span>
                  <span className="text-sm text-slate-700">{s.sender.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">→ {s.receiver.city}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setAddOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleAdd} disabled={sel.length === 0}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50">
              Add {sel.length > 0 ? `(${sel.length})` : ''} Shipments
            </button>
          </div>
        </div>
      </Modal>
    </div>
    {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </>
  )
}

export default function BagManagement() {
  const bags      = useStore((s) => s.bags)
  const shipments = useStore((s) => s.shipments)
  const createBag = useStore((s) => s.createBag)
  const addShipmentsToBag = useStore((s) => s.addShipmentsToBag)

  const [open, setOpen]   = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm]   = useState({ destination: 'Lusaka', mode: 'Domestic' })
  const [sel, setSel]     = useState([])
  const [detailId, setDetailId] = useState(null)

  const eligibleShipments = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId)
  const closedBags        = bags.filter((b) => b.status === 'Closed')

  const navigate = useNavigate()
  const filtered = filter === 'all' ? bags : bags.filter((b) => b.status === filter)
  const sorted   = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const toggleSel = (awb) => setSel((p) => p.includes(awb) ? p.filter((a) => a !== awb) : [...p, awb])

  const handleCreate = (e) => {
    e.preventDefault()
    const id = createBag(form)
    if (sel.length > 0) addShipmentsToBag(id, sel)
    setOpen(false)
    setForm({ destination: 'Los Angeles', mode: 'Domestic' })
    setSel([])
  }

  return (
    <div className="space-y-4">

      {/* Handoff banner — unbagged origin-scanned shipments */}
      {eligibleShipments.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Package size={18} className="text-indigo-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-indigo-800">{eligibleShipments.length} shipment{eligibleShipments.length !== 1 ? 's' : ''} scanned at origin — not yet bagged</span>
            <span className="text-indigo-600 ml-2">— create or open a bag and add them</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
            <Plus size={12} /> Create Bag
          </button>
        </div>
      )}

      {/* Handoff banner — closed bags ready to manifest */}
      {closedBags.length > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Archive size={18} className="text-cyan-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-cyan-800">{closedBags.length} closed bag{closedBags.length !== 1 ? 's' : ''} ready to manifest</span>
            <span className="text-cyan-600 ml-2">— create a manifest and add these bags</span>
          </div>
          <button onClick={() => navigate('/ops/manifests')}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
            Go to Manifests <ArrowRight size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {['all', 'Open', 'Closed', 'Manifested'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Create Bag
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((b) => <BagRow key={b.id} bag={b} onBagClick={setDetailId} />)}
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
            <Archive size={40} className="mx-auto mb-3 opacity-30" />
            <p>No bags found</p>
          </div>
        )}
      </div>

      {detailId && <EntityDetailDrawer type="bag" id={detailId} onClose={() => setDetailId(null)} />}

      <Modal open={open} onClose={() => setOpen(false)} title="Create New Bag" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination City</label>
              <select value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option>Domestic</option>
                <option>International</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Add Shipments <span className="text-slate-400">(optional)</span>
            </label>
            {eligibleShipments.length === 0 ? (
              <p className="text-sm text-slate-400 border rounded-lg p-3 bg-slate-50">No Origin Scanned shipments available.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {eligibleShipments.map((s) => (
                  <label key={s.awb}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                    <input type="checkbox" checked={sel.includes(s.awb)} onChange={() => toggleSel(s.awb)} className="rounded" />
                    <span className="font-mono text-indigo-600 text-xs">{s.awb}</span>
                    <span className="text-sm">{s.sender.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">→ {s.receiver.city}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
              Create Bag
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
