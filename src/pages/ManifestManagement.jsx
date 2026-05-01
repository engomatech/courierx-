import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, HUBS, TRANSPORTERS } from '../utils'
import { Plus, FileStack, ChevronDown, ChevronUp, Truck, Send, ArrowRight, Archive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

          {/* ── Flight / MAWB details strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {manifest.mawb && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">MAWB</div>
                <div className="font-mono text-sm font-bold text-slate-800">{manifest.mawb}</div>
              </div>
            )}
            {manifest.flightNo && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">Flight</div>
                <div className="font-mono text-sm font-bold text-slate-800">{manifest.flightNo}</div>
              </div>
            )}
            {(manifest.originAirport || manifest.destAirport) && (
              <div className="bg-white rounded-lg border px-3 py-2 col-span-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">Route</div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  {manifest.originAirport || '—'} → {manifest.destAirport || '—'}
                </div>
              </div>
            )}
            {manifest.etd && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">ETD</div>
                <div className="text-sm font-semibold text-slate-800">{formatDate(manifest.etd)}</div>
              </div>
            )}
            {manifest.eta && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">ETA</div>
                <div className="text-sm font-semibold text-slate-800">{formatDate(manifest.eta)}</div>
              </div>
            )}
            {manifest.dispatchedAt && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">Dispatched</div>
                <div className="text-xs font-semibold text-slate-700">{formatDate(manifest.dispatchedAt)}</div>
              </div>
            )}
            {manifest.arrivedAt && (
              <div className="bg-white rounded-lg border px-3 py-2">
                <div className="text-xs text-slate-400 font-medium mb-0.5">Arrived</div>
                <div className="text-xs font-semibold text-emerald-700">{formatDate(manifest.arrivedAt)}</div>
              </div>
            )}
          </div>

          {/* ── Summary totals ── */}
          {(() => {
            const allShipmentAwbs = [
              ...manifestBags.flatMap((b) => b.shipments),
              ...directShipments.map((s) => s.awb),
            ]
            const allShips = shipments.filter((s) => allShipmentAwbs.includes(s.awb))
            const totalPieces = allShips.reduce((a, s) => a + (s.pieces || 1), 0)
            const totalBoxes  = allShips.reduce((a, s) => {
              if (!s.boxNumber) return a + 1
              const m = s.boxNumber.match(/\d+\s+of\s+(\d+)/i)
              return m ? a + parseInt(m[1]) : a + 1
            }, 0)
            const totalGross  = allShips.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)
            const volWeight   = (s) => {
              const { l = 0, w = 0, h = 0 } = s.dimensions || {}
              return l && w && h ? (l * w * h) / 5000 : 0
            }
            const totalChargeable = allShips.reduce((a, s) => a + Math.max(parseFloat(s.weight) || 0, volWeight(s)), 0)
            return (
              <div className="flex items-center gap-4 text-xs text-slate-600 bg-white border rounded-lg px-4 py-2.5">
                <span><strong>{allShipmentAwbs.length}</strong> HAWBs</span>
                <span>·</span>
                <span><strong>{totalPieces}</strong> pcs</span>
                <span>·</span>
                <span><strong>{totalBoxes}</strong> boxes</span>
                <span>·</span>
                <span>Gross <strong>{totalGross.toFixed(2)} kg</strong></span>
                <span>·</span>
                <span>Chargeable <strong className="text-cyan-700">{totalChargeable.toFixed(2)} kg</strong></span>
              </div>
            )
          })()}

          {/* ── Bags with HAWB table ── */}
          {manifestBags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">BAGS</p>
              <div className="space-y-3">
                {manifestBags.map((bag) => {
                  const bagShips = shipments.filter((s) => bag.shipments.includes(s.awb))
                  return (
                    <div key={bag.id} className="bg-white rounded-lg border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b">
                        <span className="font-mono text-indigo-600 text-sm font-bold">{bag.id}</span>
                        <span className="text-xs text-slate-500">{bag.destination} · {bag.mode} · {bag.shipments.length} pkgs</span>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-slate-50/50">
                            <th className="px-3 py-2 text-left font-medium text-slate-500">HAWB / AWB</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Customer ID</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Receiver</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Description Type</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Goods</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-500">Gross (kg)</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-500">Chargeable (kg)</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Box No.</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-500">Value</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bagShips.map((s, i) => {
                            const { l = 0, w = 0, h = 0 } = s.dimensions || {}
                            const volWt = l && w && h ? (l * w * h) / 5000 : 0
                            const chargeWt = Math.max(parseFloat(s.weight) || 0, volWt)
                            return (
                              <tr key={s.awb} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                <td className="px-3 py-2">
                                  <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-cyan-700 hover:underline">{s.hawb || s.awb}</button>
                                  {s.awb && s.hawb && <div className="text-slate-400 font-mono text-[10px]">{s.awb}</div>}
                                </td>
                                <td className="px-3 py-2 font-mono text-violet-700 text-[11px]">{s.customerId || s.receiver?.customerId || '—'}</td>
                                <td className="px-3 py-2">{s.receiver?.name}<div className="text-slate-400">{s.receiver?.city}</div></td>
                                <td className="px-3 py-2 text-slate-600">{s.descriptionType || '—'}</td>
                                <td className="px-3 py-2 max-w-[120px] truncate text-slate-600">{s.goodsDescription || '—'}</td>
                                <td className="px-3 py-2 text-right">{s.weight ? parseFloat(s.weight).toFixed(3) : '—'}</td>
                                <td className="px-3 py-2 text-right font-semibold text-cyan-700">{chargeWt.toFixed(3)}</td>
                                <td className="px-3 py-2 text-slate-500">{s.boxNumber || '—'}</td>
                                <td className="px-3 py-2 text-right text-slate-500">{s.goodsValue ? `${s.currency || 'ZMW'} ${s.goodsValue}` : '—'}</td>
                                <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Direct shipments HAWB table ── */}
          {directShipments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">DIRECT SHIPMENTS</p>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-3 py-2 text-left font-medium text-slate-500">HAWB / AWB</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Customer ID</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Receiver</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Description Type</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Goods</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Gross (kg)</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Chargeable (kg)</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Box No.</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Value</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directShipments.map((s, i) => {
                      const { l = 0, w = 0, h = 0 } = s.dimensions || {}
                      const volWt = l && w && h ? (l * w * h) / 5000 : 0
                      const chargeWt = Math.max(parseFloat(s.weight) || 0, volWt)
                      return (
                        <tr key={s.awb} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                          <td className="px-3 py-2">
                            <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-cyan-700 hover:underline">{s.hawb || s.awb}</button>
                            {s.awb && s.hawb && <div className="text-slate-400 font-mono text-[10px]">{s.awb}</div>}
                          </td>
                          <td className="px-3 py-2 font-mono text-violet-700 text-[11px]">{s.customerId || s.receiver?.customerId || '—'}</td>
                          <td className="px-3 py-2">{s.receiver?.name}<div className="text-slate-400">{s.receiver?.city}</div></td>
                          <td className="px-3 py-2 text-slate-600">{s.descriptionType || '—'}</td>
                          <td className="px-3 py-2 max-w-[120px] truncate text-slate-600">{s.goodsDescription || '—'}</td>
                          <td className="px-3 py-2 text-right">{s.weight ? parseFloat(s.weight).toFixed(3) : '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold text-cyan-700">{chargeWt.toFixed(3)}</td>
                          <td className="px-3 py-2 text-slate-500">{s.boxNumber || '—'}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{s.goodsValue ? `${s.currency || 'ZMW'} ${s.goodsValue}` : '—'}</td>
                          <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
    mawb: '', flightNo: '', originAirport: '', destAirport: '', etd: '', eta: '',
  })
  const [selBags, setSelBags] = useState([])
  const [selAWBs, setSelAWBs] = useState([])

  const eligibleBags        = bags.filter((b) => b.status === 'Closed')
  const eligibleShipments   = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId)
  const dispatchedManifests = manifests.filter((m) => m.status === 'Dispatched')

  const navigate = useNavigate()
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
    setForm({ type: 'Bag', origin: HUBS[0], destination: HUBS[1], transporter: TRANSPORTERS[0], mawb: '', flightNo: '', originAirport: '', destAirport: '', etd: '', eta: '' })
  }

  return (
    <div className="space-y-4">

      {/* Handoff banner — closed bags needing a manifest */}
      {eligibleBags.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Archive size={18} className="text-indigo-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-indigo-800">{eligibleBags.length} closed bag{eligibleBags.length !== 1 ? 's' : ''} waiting to be manifested</span>
            <span className="text-indigo-600 ml-2">— create a manifest and add these bags to dispatch</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
            <Plus size={12} /> Create Manifest
          </button>
        </div>
      )}

      {/* Handoff banner — dispatched manifests awaiting hub arrival confirmation */}
      {dispatchedManifests.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Truck size={18} className="text-orange-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-orange-800">{dispatchedManifests.length} manifest{dispatchedManifests.length !== 1 ? 's' : ''} in transit — awaiting arrival confirmation</span>
            <span className="text-orange-600 ml-2">— scan bags at Hub Inbound to confirm receipt</span>
          </div>
          <button onClick={() => navigate('/ops/hub-inbound')}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
            Go to Hub Inbound <ArrowRight size={12} />
          </button>
        </div>
      )}

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

          {/* ── Optional flight / airway details ── */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Flight &amp; Airway Details <span className="normal-case font-normal text-slate-400">(optional)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">MAWB No.</label>
                <input
                  type="text"
                  value={form.mawb}
                  onChange={(e) => setForm((f) => ({ ...f, mawb: e.target.value }))}
                  placeholder="e.g. 083-12345678"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Flight No.</label>
                <input
                  type="text"
                  value={form.flightNo}
                  onChange={(e) => setForm((f) => ({ ...f, flightNo: e.target.value }))}
                  placeholder="e.g. KQ101"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Origin Airport (IATA)</label>
                <input
                  type="text"
                  value={form.originAirport}
                  onChange={(e) => setForm((f) => ({ ...f, originAirport: e.target.value.toUpperCase().slice(0, 3) }))}
                  placeholder="e.g. LHR"
                  maxLength={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Destination Airport (IATA)</label>
                <input
                  type="text"
                  value={form.destAirport}
                  onChange={(e) => setForm((f) => ({ ...f, destAirport: e.target.value.toUpperCase().slice(0, 3) }))}
                  placeholder="e.g. LUN"
                  maxLength={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ETD</label>
                <input
                  type="datetime-local"
                  value={form.etd}
                  onChange={(e) => setForm((f) => ({ ...f, etd: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ETA</label>
                <input
                  type="datetime-local"
                  value={form.eta}
                  onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
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
