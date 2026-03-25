import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { ExceptionModal } from '../components/ExceptionModal'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate } from '../utils'
import { MapPin, CheckCircle, XCircle, Clock, Archive, AlertTriangle, ShieldCheck, Package, HelpCircle, AlertOctagon, Truck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DISC_RESOLUTIONS = [
  'Found & processed',
  'Will arrive on next vehicle',
  'Short-shipped by origin hub',
  'Damaged in transit',
  'Returned to sender',
  'Other',
]

const DISC_TYPE_LABELS = {
  missing_bag        : { label: 'Missing Bag',          color: 'text-red-600',    bg: 'bg-red-50',    icon: <Archive size={14} className="text-red-500" /> },
  unexpected_bag     : { label: 'Unexpected Bag',        color: 'text-amber-700',  bg: 'bg-amber-50',  icon: <AlertTriangle size={14} className="text-amber-500" /> },
  unexpected_shipment: { label: 'Unexpected Shipment',   color: 'text-amber-700',  bg: 'bg-amber-50',  icon: <Package size={14} className="text-amber-500" /> },
  missing_shipment   : { label: 'Missing Shipment',      color: 'text-red-600',    bg: 'bg-red-50',    icon: <Package size={14} className="text-red-500" /> },
}

function ResolveModal({ disc, onClose }) {
  const resolveDiscrepancy = useStore((s) => s.resolveDiscrepancy)
  const currentUser        = useStore((s) => s.currentUser)
  const [resolution, setResolution] = useState(DISC_RESOLUTIONS[0])
  const [notes, setNotes]           = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    resolveDiscrepancy(disc.id, resolution, notes, currentUser?.name || 'Ops')
    onClose()
  }

  const meta = DISC_TYPE_LABELS[disc.type] || {}

  return (
    <Modal open onClose={onClose} title="Resolve Discrepancy">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Discrepancy summary */}
        <div className={`rounded-lg p-3 text-sm ${meta.bg || 'bg-slate-50'}`}>
          <div className={`flex items-center gap-2 font-medium mb-1 ${meta.color || 'text-slate-700'}`}>
            {meta.icon}
            {meta.label}
          </div>
          {disc.bagId && <p className="text-slate-600 text-xs">Bag: <span className="font-mono">{disc.bagId}</span></p>}
          {disc.awb    && <p className="text-slate-600 text-xs">AWB: <span className="font-mono">{disc.awb}</span></p>}
          {disc.manifestId && <p className="text-slate-600 text-xs">Manifest: <span className="font-mono">{disc.manifestId}</span></p>}
          <p className="text-slate-500 text-xs mt-1">{disc.notes}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Resolution *</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            {DISC_RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details about this discrepancy…"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit"
            className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium">
            Mark Resolved
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function HubInbound() {
  const shipments            = useStore((s) => s.shipments)
  const bags                 = useStore((s) => s.bags)
  const manifests            = useStore((s) => s.manifests)
  const discrepancies        = useStore((s) => s.discrepancies)
  const hubInboundScan       = useStore((s) => s.hubInboundScan)
  const arriveManifest       = useStore((s) => s.arriveManifest)

  const [input, setInput]       = useState('')
  const [results, setResults]   = useState([])
  const [resolving, setResolving] = useState(null)   // discrepancy object being resolved
  const [showResolved, setShowResolved] = useState(false)
  const [excAwb, setExcAwb]     = useState(null)     // AWB for report-exception modal (null = closed)
  const [activeAWB, setActiveAWB] = useState(null)   // AWB for shipment detail drawer

  const eligibleBags        = bags.filter((b) => b.status === 'Manifested')
  const eligibleShipments   = shipments.filter((s) => s.status === 'Manifested')
  const hubScanned          = shipments.filter((s) => s.status === 'Hub Inbound')
  const unassignedHubScanned = hubScanned.filter((s) => !s.drsId)
  const dispatchedManifests = manifests.filter((m) => m.status === 'Dispatched')
  const navigate = useNavigate()

  const openDiscs     = discrepancies.filter((d) => d.status === 'open')
  const resolvedDiscs = discrepancies.filter((d) => d.status === 'resolved')

  const handleScan = (e) => {
    e.preventDefault()
    const val = input.trim().toUpperCase()
    if (!val) return
    const res = hubInboundScan(val)
    setResults((prev) => [{ input: val, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
    setInput('')
  }

  const scanBag = (bagId) => {
    const res = hubInboundScan(bagId)
    setResults((prev) => [{ input: bagId, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
  }

  const scanShipment = (awb) => {
    const res = hubInboundScan(awb)
    setResults((prev) => [{ input: awb, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
  }

  return (
    <div className="space-y-6">

      {/* Handoff banner — dispatched manifests in transit */}
      {dispatchedManifests.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Truck size={18} className="text-orange-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-orange-800">{dispatchedManifests.length} manifest{dispatchedManifests.length !== 1 ? 's' : ''} in transit — expected at this hub</span>
            <span className="text-orange-600 ml-2">— scan each bag below to confirm arrival</span>
          </div>
        </div>
      )}

      {/* Handoff banner — hub-scanned shipments ready for DRS */}
      {unassignedHubScanned.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-emerald-800">{unassignedHubScanned.length} shipment{unassignedHubScanned.length !== 1 ? 's' : ''} checked in at hub — ready for last-mile delivery</span>
            <span className="text-emerald-600 ml-2">— create a DRS run to assign to a driver</span>
          </div>
          <button onClick={() => navigate('/ops/drs')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
            Go to DRS <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Scanner */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-100 rounded-xl">
            <MapPin size={24} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Hub Inbound Scanner</h2>
            <p className="text-sm text-slate-500">Scan bags or individual shipments arriving at the destination hub</p>
          </div>
          {openDiscs.length > 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
              <AlertTriangle size={13} />
              {openDiscs.length} open {openDiscs.length === 1 ? 'discrepancy' : 'discrepancies'}
            </span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap max-w-2xl">
          <form onSubmit={handleScan} className="flex gap-3 flex-1 min-w-64">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Bag ID or AWB number…"
              className="flex-1 border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase placeholder:normal-case placeholder:text-slate-400"
            />
            <button type="submit"
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <MapPin size={16} /> Scan
            </button>
          </form>
          <button
            type="button"
            onClick={() => setExcAwb('')}
            className="px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <AlertOctagon size={15} /> Report Exception
          </button>
        </div>
      </div>

      {/* ── Open Discrepancies ─── */}
      {openDiscs.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-5 py-3 border-b border-red-200 bg-red-50 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-semibold text-red-800 text-sm">Open Discrepancies</h3>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">{openDiscs.length}</span>
            </div>
            <span className="text-xs text-red-500">Resolve all discrepancies before finalising this inbound</span>
          </div>
          <div className="divide-y divide-red-100">
            {openDiscs.map((d) => {
              const meta = DISC_TYPE_LABELS[d.type] || {}
              return (
                <div key={d.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${meta.bg || 'bg-slate-100'}`}>
                    {meta.icon || <HelpCircle size={14} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${meta.color || 'text-slate-700'}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400">{d.id}</span>
                    </div>
                    {d.bagId      && <p className="text-xs text-slate-600">Bag: <span className="font-mono font-medium">{d.bagId}</span></p>}
                    {d.awb        && <p className="text-xs text-slate-600">AWB: <span className="font-mono font-medium">{d.awb}</span></p>}
                    {d.manifestId && <p className="text-xs text-slate-600">Manifest: <span className="font-mono">{d.manifestId}</span></p>}
                    <p className="text-xs text-slate-400 mt-0.5">{d.notes}</p>
                    <p className="text-xs text-slate-400">{formatDate(d.detectedAt)}</p>
                  </div>
                  <button onClick={() => setResolving(d)}
                    className="shrink-0 text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                    Resolve
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dispatched manifests — quick arrive */}
      {dispatchedManifests.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-slate-900 text-sm">In-Transit Manifests</h3>
            <span className="ml-1 text-xs text-slate-400">— Marking arrived will flag any unscanned bags as discrepancies</span>
          </div>
          <div className="divide-y">
            {dispatchedManifests.map((m) => {
              const bagCount    = m.bags.length
              const directCount = (m.shipments || []).length
              const scannedBags = m.bags.filter((bId) => bags.find((b) => b.id === bId)?.status === 'Hub Scanned').length
              const allScanned  = scannedBags === bagCount
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1">
                    <span className="font-mono text-cyan-700 font-medium text-sm">{m.id}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.origin} → {m.destination} · {m.transporter}
                      {bagCount > 0 && ` · ${bagCount} bags`}
                      {directCount > 0 && ` · ${directCount} direct`}
                    </p>
                    {bagCount > 0 && (
                      <p className={`text-xs mt-0.5 font-medium ${allScanned ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {scannedBags}/{bagCount} bags scanned{!allScanned && ' — unscanned will be flagged'}
                      </p>
                    )}
                  </div>
                  <button onClick={() => arriveManifest(m.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      allScanned
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}>
                    {allScanned ? 'Mark Arrived' : '⚠ Mark Arrived'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan log */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900">Scan Log</h3>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">No scans in this session.</p>
            ) : (
              results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${r.ok ? '' : 'bg-red-50'}`}>
                  {r.ok
                    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                    : <XCircle    size={18} className="text-red-500 shrink-0" />
                  }
                  <div className="flex-1">
                    <span className="font-mono text-xs font-medium text-slate-700">{r.input}</span>
                    <p className={`text-xs mt-0.5 ${r.ok ? 'text-slate-500' : 'text-red-600'}`}>{r.msg}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(r.at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">Bags Awaiting</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{eligibleBags.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">Hub Inbound</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{hubScanned.length}</p>
            </div>
          </div>

          {/* Bags to scan */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Archive size={15} className="text-indigo-500" />
              <h3 className="font-medium text-slate-700 text-sm">Bags Awaiting Hub Scan</h3>
            </div>
            <div className="divide-y max-h-48 overflow-y-auto">
              {eligibleBags.length === 0 ? (
                <p className="px-5 py-6 text-center text-slate-400 text-sm">No bags awaiting hub scan.</p>
              ) : (
                eligibleBags.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-indigo-600 font-medium">{b.id}</span>
                      <p className="text-xs text-slate-500">{b.destination} · {b.shipments.length} pkgs</p>
                    </div>
                    <button onClick={() => scanBag(b.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium">
                      Scan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Individual shipments */}
          {eligibleShipments.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-5 py-3 border-b">
                <h3 className="font-medium text-slate-700 text-sm">Individual Shipments (Manifested, no bag)</h3>
              </div>
              <div className="divide-y max-h-36 overflow-y-auto">
                {eligibleShipments.map((s) => (
                  <div key={s.awb} className="flex items-center gap-3 px-5 py-2.5">
                    <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-xs text-cyan-700 hover:text-cyan-900 hover:underline flex-1 text-left">{s.awb}</button>
                    <span className="text-xs text-slate-400">{s.receiver.city}</span>
                    <button onClick={() => scanShipment(s.awb)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium ml-2">
                      Scan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hub Inbound list */}
      {hubScanned.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Hub Inbound Shipments</h3>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{hubScanned.length} shipments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">AWB</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 font-medium">Delivery City</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {hubScanned.map((s) => (
                  <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs">
                      <button onClick={() => setActiveAWB(s.awb)} className="font-mono text-teal-700 hover:text-teal-900 hover:underline">{s.awb}</button>
                    </td>
                    <td className="px-4 py-3">{s.receiver.name}</td>
                    <td className="px-4 py-3">{s.receiver.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.serviceType === 'Express'       ? 'bg-orange-100 text-orange-700' :
                        s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{s.serviceType}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExcAwb(s.awb)}
                        className="text-xs px-2 py-1 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1"
                        title="Report exception for this shipment"
                      >
                        <AlertOctagon size={12} /> Exception
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Resolved Discrepancies (collapsed) ─── */}
      {resolvedDiscs.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <button
            onClick={() => setShowResolved((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="font-medium text-slate-700">Resolved Discrepancies</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{resolvedDiscs.length}</span>
            </div>
            <span className="text-slate-400 text-xs">{showResolved ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showResolved && (
            <div className="border-t divide-y">
              {resolvedDiscs.map((d) => {
                const meta = DISC_TYPE_LABELS[d.type] || {}
                return (
                  <div key={d.id} className="flex items-start gap-4 px-5 py-3 bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-slate-500">{meta.label}</span>
                        {d.bagId && <span className="font-mono text-xs text-slate-600">{d.bagId}</span>}
                        {d.awb   && <span className="font-mono text-xs text-slate-600">{d.awb}</span>}
                      </div>
                      <p className="text-xs text-emerald-700 font-medium">{d.resolution}</p>
                      {d.notes && <p className="text-xs text-slate-400">{d.notes}</p>}
                      <p className="text-xs text-slate-400">Resolved by {d.resolvedBy} · {formatDate(d.resolvedAt)}</p>
                    </div>
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Resolve discrepancy modal */}
      {resolving && <ResolveModal disc={resolving} onClose={() => setResolving(null)} />}

      {/* Report exception modal */}
      {excAwb !== null && (
        <ExceptionModal
          awb={excAwb}
          location="Hub"
          holdShipment={false}
          onClose={() => setExcAwb(null)}
        />
      )}
      {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </div>
  )
}
