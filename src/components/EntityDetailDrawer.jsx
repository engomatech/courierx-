/**
 * EntityDetailDrawer — slide-in right drawer for Bag / Manifest / SMF / PRS / DRS
 * Clicking any AWB inside opens the ShipmentDetailDrawer on top.
 *
 * Props:
 *   type  : 'bag' | 'manifest' | 'smf' | 'prs' | 'drs'
 *   id    : entity ID string
 *   onClose : () => void
 */

import { useState } from 'react'
import { useStore } from '../store'
import { X, Package, MapPin, Truck, User, Clock, Archive, FileStack, CheckCircle2, XCircle, AlertTriangle, Send, Navigation, Route, Hash, CalendarDays, ChevronRight } from 'lucide-react'
import { formatDate } from '../utils'
import { StatusBadge } from './StatusBadge'
import { ShipmentDetailDrawer } from './ShipmentDetailDrawer'

/* ── tiny helpers ── */
function Section({ title, children, icon: Icon }) {
  return (
    <div className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
      {title && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {Icon && <Icon size={12} />} {title}
        </p>
      )}
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-baseline py-1 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 shrink-0 mr-4">{label}</span>
      <span className={`text-sm text-right text-slate-800 font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function AwbChip({ awb, onClick, status }) {
  return (
    <button
      onClick={() => onClick(awb)}
      className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 transition-colors"
    >
      {awb}
      <ChevronRight size={10} className="opacity-60" />
    </button>
  )
}

/* ──────────────── BAG detail ──────────────── */
function BagDetail({ bag, shipments, onAWBClick }) {
  const bagShipments = shipments.filter(s => bag.shipments.includes(s.awb))
  const totalWeight = bagShipments.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)
  const totalPieces = bagShipments.reduce((a, s) => a + (parseInt(s.pieces) || 1), 0)

  const statusColor = {
    Open:        'bg-blue-100 text-blue-700',
    Closed:      'bg-slate-100 text-slate-700',
    Manifested:  'bg-cyan-100 text-cyan-700',
    'Hub Scanned':'bg-teal-100 text-teal-700',
  }

  return (
    <div className="space-y-0">
      {/* Header badge */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Archive size={18} className="text-indigo-600" />
        </div>
        <div>
          <div className="font-mono font-bold text-slate-800 text-lg">{bag.id}</div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[bag.status] || 'bg-slate-100 text-slate-600'}`}>
            {bag.status}
          </span>
        </div>
      </div>

      <Section title="Bag Details" icon={Package}>
        <InfoRow label="Created"     value={formatDate(bag.createdAt)} />
        <InfoRow label="Destination" value={bag.destination} />
        <InfoRow label="Mode"        value={bag.mode} />
        <InfoRow label="Shipments"   value={bag.shipments.length} />
        <InfoRow label="Total Weight" value={`${totalWeight.toFixed(2)} kg`} />
        <InfoRow label="Total Pieces" value={totalPieces} />
      </Section>

      <Section title={`Shipments (${bagShipments.length})`} icon={Package}>
        {bagShipments.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No shipments in this bag.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 rounded">
                  <th className="py-2 px-2 font-medium">AWB</th>
                  <th className="py-2 px-2 font-medium">Sender</th>
                  <th className="py-2 px-2 font-medium">Receiver</th>
                  <th className="py-2 px-2 font-medium">Wt</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bagShipments.map(s => (
                  <tr key={s.awb} className="border-t hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <AwbChip awb={s.awb} onClick={onAWBClick} />
                      {s.hawb && <div className="text-xs text-slate-400 mt-0.5 font-mono">H: {s.hawb}</div>}
                    </td>
                    <td className="py-2 px-2 text-xs text-slate-700">{s.sender?.name}</td>
                    <td className="py-2 px-2 text-xs text-slate-700">{s.receiver?.name}<div className="text-slate-400">{s.receiver?.city}</div></td>
                    <td className="py-2 px-2 text-xs text-slate-600">{s.weight}kg</td>
                    <td className="py-2 px-2"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

/* ──────────────── MANIFEST detail ──────────────── */
function ManifestDetail({ manifest, bags, shipments, onAWBClick }) {
  const isSMF = manifest.id?.startsWith('SMF-')
  const manifestBags = bags.filter(b => (manifest.bags || []).includes(b.id))
  const directShips = shipments.filter(s => (manifest.shipments || []).includes(s.awb))
  const totalPkgs = manifestBags.reduce((a, b) => a + b.shipments.length, 0) + directShips.length

  const statusColor = {
    Open:       'bg-blue-100 text-blue-700',
    Dispatched: 'bg-orange-100 text-orange-700',
    Arrived:    'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSMF ? 'bg-orange-100' : 'bg-cyan-100'}`}>
          <FileStack size={18} className={isSMF ? 'text-orange-600' : 'text-cyan-600'} />
        </div>
        <div>
          <div className="font-mono font-bold text-slate-800 text-lg">{manifest.id}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[manifest.status] || 'bg-slate-100'}`}>
              {manifest.status}
            </span>
            {!isSMF && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${manifest.type === 'Bag' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                {manifest.type}
              </span>
            )}
          </div>
        </div>
      </div>

      <Section title="Manifest Details" icon={FileStack}>
        <InfoRow label="Created"     value={formatDate(manifest.createdAt)} />
        <InfoRow label="Dispatched"  value={manifest.dispatchedAt ? formatDate(manifest.dispatchedAt) : null} />
        <InfoRow label="Arrived"     value={manifest.arrivedAt ? formatDate(manifest.arrivedAt) : null} />
        <InfoRow label="Transporter" value={manifest.transporter} />
        <InfoRow label="Total Packages" value={totalPkgs} />
        {manifest.notes && <InfoRow label="Notes" value={manifest.notes} />}
      </Section>

      <Section title="Route" icon={Route}>
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-400 mb-0.5">Origin</p>
            <p className="text-sm font-semibold text-slate-800">{manifest.origin}</p>
          </div>
          <div className="text-slate-300 text-xl">→</div>
          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-400 mb-0.5">Destination</p>
            <p className="text-sm font-semibold text-slate-800">{manifest.destination}</p>
          </div>
        </div>
      </Section>

      {/* Bags section (bag-based manifests) */}
      {manifestBags.length > 0 && (
        <Section title={`Bags (${manifestBags.length})`} icon={Archive}>
          <div className="space-y-3">
            {manifestBags.map(bag => {
              const bagShips = shipments.filter(s => bag.shipments.includes(s.awb))
              return (
                <div key={bag.id} className="bg-slate-50 rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-indigo-600 text-sm font-medium">{bag.id}</span>
                    <span className="text-xs text-slate-500">{bag.destination} · {bag.mode} · {bag.shipments.length} pkgs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bag.shipments.map(awb => (
                      <AwbChip key={awb} awb={awb} onClick={onAWBClick} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Direct shipments */}
      {directShips.length > 0 && (
        <Section title={`Direct Shipments (${directShips.length})`} icon={Package}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="py-2 px-2 font-medium">AWB</th>
                <th className="py-2 px-2 font-medium">Receiver</th>
                <th className="py-2 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {directShips.map(s => (
                <tr key={s.awb} className="border-t hover:bg-slate-50">
                  <td className="py-2 px-2">
                    <AwbChip awb={s.awb} onClick={onAWBClick} />
                    {s.hawb && <div className="text-xs text-slate-400 mt-0.5 font-mono">H: {s.hawb}</div>}
                  </td>
                  <td className="py-2 px-2 text-xs text-slate-700">{s.receiver?.name}<div className="text-slate-400">{s.receiver?.city}</div></td>
                  <td className="py-2 px-2"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  )
}

/* ──────────────── PRS detail ──────────────── */
function PrsDetail({ prs, shipments, onAWBClick }) {
  const prsShipments = shipments.filter(s => prs.shipments.includes(s.awb))
  const totalWeight = prsShipments.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)

  const statusColor = {
    Pending:   'bg-amber-100 text-amber-700',
    Proceed:   'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Navigation size={18} className="text-amber-600" />
        </div>
        <div>
          <div className="font-mono font-bold text-slate-800 text-lg">{prs.id}</div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[prs.status] || 'bg-slate-100'}`}>
            {prs.status}
          </span>
        </div>
      </div>

      <Section title="PRS Details" icon={Navigation}>
        <InfoRow label="Created"    value={formatDate(prs.createdAt)} />
        <InfoRow label="Driver"     value={prs.driver} />
        <InfoRow label="Hub"        value={prs.hub} />
        <InfoRow label="Route Code" value={prs.routeCode} mono />
        <InfoRow label="City"       value={prs.city} />
        <InfoRow label="Country"    value={prs.country} />
        <InfoRow label="Shipments"  value={prs.shipments.length} />
        <InfoRow label="Total Weight" value={`${totalWeight.toFixed(2)} kg`} />
      </Section>

      <Section title={`Pickup Shipments (${prsShipments.length})`} icon={Package}>
        {prsShipments.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No shipments assigned.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="py-2 px-2 font-medium">AWB</th>
                <th className="py-2 px-2 font-medium">Sender</th>
                <th className="py-2 px-2 font-medium">Receiver</th>
                <th className="py-2 px-2 font-medium">Wt</th>
                <th className="py-2 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {prsShipments.map(s => (
                <tr key={s.awb} className="border-t hover:bg-slate-50">
                  <td className="py-2 px-2">
                    <AwbChip awb={s.awb} onClick={onAWBClick} />
                    {s.hawb && <div className="text-xs text-slate-400 mt-0.5 font-mono">H: {s.hawb}</div>}
                  </td>
                  <td className="py-2 px-2 text-xs text-slate-700">{s.sender?.name}<div className="text-slate-400">{s.sender?.city}</div></td>
                  <td className="py-2 px-2 text-xs text-slate-700">{s.receiver?.name}<div className="text-slate-400">{s.receiver?.city}</div></td>
                  <td className="py-2 px-2 text-xs text-slate-600">{s.weight}kg</td>
                  <td className="py-2 px-2"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

/* ──────────────── DRS detail ──────────────── */
function DrsDetail({ drs, shipments, onAWBClick }) {
  const drsShipments = shipments.filter(s => drs.shipments.includes(s.awb))
  const delivered = drsShipments.filter(s => s.status === 'Delivered').length
  const ndr       = drsShipments.filter(s => s.status === 'Non-Delivery').length
  const pending   = drsShipments.filter(s => !['Delivered', 'Non-Delivery'].includes(s.status)).length

  const statusColor = {
    Pending:     'bg-amber-100 text-amber-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Completed:   'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Truck size={18} className="text-green-600" />
        </div>
        <div>
          <div className="font-mono font-bold text-slate-800 text-lg">{drs.id}</div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[drs.status] || 'bg-slate-100'}`}>
            {drs.status}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">{delivered}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Delivered</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <p className="text-2xl font-bold text-red-600">{ndr}</p>
          <p className="text-xs text-red-500 mt-0.5">NDR</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-600 mt-0.5">Pending</p>
        </div>
      </div>

      <Section title="DRS Details" icon={Truck}>
        <InfoRow label="Created"    value={formatDate(drs.createdAt)} />
        <InfoRow label="Driver"     value={drs.driver} />
        <InfoRow label="Hub"        value={drs.hub} />
        <InfoRow label="Route Code" value={drs.routeCode} mono />
        <InfoRow label="Total Shipments" value={drs.shipments.length} />
      </Section>

      <Section title={`Delivery Shipments (${drsShipments.length})`} icon={Package}>
        {drsShipments.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No shipments assigned.</p>
        ) : (
          <div className="space-y-2">
            {drsShipments.map(s => {
              const isDelivered = s.status === 'Delivered'
              const isNDR       = s.status === 'Non-Delivery'
              return (
                <div key={s.awb} className={`rounded-lg border p-3 ${isDelivered ? 'bg-emerald-50 border-emerald-100' : isNDR ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <AwbChip awb={s.awb} onClick={onAWBClick} />
                      {s.hawb && <span className="ml-2 text-xs text-slate-400 font-mono">H: {s.hawb}</span>}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">{s.receiver?.name}</span>
                    {s.receiver?.address && <span className="text-slate-400"> · {s.receiver.address}</span>}
                    {s.receiver?.phone && <span className="text-slate-400 ml-2">📞 {s.receiver.phone}</span>}
                  </div>
                  {/* POD info */}
                  {s.pod && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 rounded px-2 py-1">
                      <CheckCircle2 size={11} /> POD: {s.pod.recipientName} · {s.pod.deliveredAt ? new Date(s.pod.deliveredAt).toLocaleDateString() : ''}
                    </div>
                  )}
                  {/* NDR info */}
                  {s.ndr && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                      <XCircle size={11} /> NDR: {s.ndr.reason}
                      {s.ndr.rescheduledDate && <span className="ml-1">· Reschedule: {s.ndr.rescheduledDate}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ──────────────── Main drawer ──────────────── */
export function EntityDetailDrawer({ type, id, onClose }) {
  const [activeAWB, setActiveAWB] = useState(null)

  const bags        = useStore(s => s.bags)
  const manifests   = useStore(s => s.manifests)
  const smManifests = useStore(s => s.smManifests || [])
  const prs         = useStore(s => s.prs)
  const drs         = useStore(s => s.drs)
  const shipments   = useStore(s => s.shipments)

  // Resolve entity
  let entity = null
  if (type === 'bag')       entity = bags.find(b => b.id === id)
  else if (type === 'manifest') entity = manifests.find(m => m.id === id)
  else if (type === 'smf')  entity = smManifests.find(m => m.id === id)
  else if (type === 'prs')  entity = prs.find(p => p.id === id)
  else if (type === 'drs')  entity = drs.find(d => d.id === id)

  if (!entity) return null

  const titleMap = {
    bag:      'Bag Details',
    manifest: 'Manifest Details',
    smf:      'Shipment Manifest Details',
    prs:      'Pickup Run Sheet',
    drs:      'Delivery Run Sheet',
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-white shadow-2xl border-l">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{titleMap[type] || 'Details'}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {type === 'bag' && (
            <BagDetail bag={entity} shipments={shipments} onAWBClick={setActiveAWB} />
          )}
          {(type === 'manifest' || type === 'smf') && (
            <ManifestDetail manifest={entity} bags={bags} shipments={shipments} onAWBClick={setActiveAWB} />
          )}
          {type === 'prs' && (
            <PrsDetail prs={entity} shipments={shipments} onAWBClick={setActiveAWB} />
          )}
          {type === 'drs' && (
            <DrsDetail drs={entity} shipments={shipments} onAWBClick={setActiveAWB} />
          )}
        </div>
      </div>

      {/* Nested AWB detail */}
      {activeAWB && (
        <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />
      )}
    </>
  )
}
