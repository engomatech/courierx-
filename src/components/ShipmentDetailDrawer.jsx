/**
 * ShipmentDetailDrawer
 * Slides in from the right when the user clicks any AWB anywhere in the system.
 * Shows complete shipment info: identifiers, sender/receiver, package details,
 * goods info, payment, and full tracking timeline.
 */

import { useState } from 'react'
import { X, Package, MapPin, Truck, User, Phone, Mail, Weight,
         Box, DollarSign, Calendar, Hash, Shield, CreditCard,
         CheckCircle2, Clock, AlertTriangle, RotateCcw, Printer, ExternalLink } from 'lucide-react'
import { useStore } from '../store'
import { StatusBadge } from './StatusBadge'
import { formatDate, formatDateShort } from '../utils'
import { EntityDetailDrawer } from './EntityDetailDrawer'

// Timeline step icons mapped from status names
const TIMELINE_ICONS = {
  'Booked':            { icon: Package,      color: 'bg-blue-500' },
  'PRS Assigned':      { icon: Truck,        color: 'bg-yellow-500' },
  'Out for Pickup':    { icon: Truck,        color: 'bg-orange-500' },
  'Picked Up':         { icon: Truck,        color: 'bg-amber-500' },
  'Origin Scanned':    { icon: Hash,         color: 'bg-purple-500' },
  'Bagged':            { icon: Box,          color: 'bg-indigo-500' },
  'Manifested':        { icon: Package,      color: 'bg-cyan-500' },
  'Hub Inbound':       { icon: MapPin,       color: 'bg-teal-500' },
  'DRS Assigned':      { icon: Truck,        color: 'bg-lime-500' },
  'Out for Delivery':  { icon: Truck,        color: 'bg-green-500' },
  'Delivered':         { icon: CheckCircle2, color: 'bg-emerald-500' },
  'Non-Delivery':      { icon: AlertTriangle,color: 'bg-red-500' },
  'On Hold':           { icon: Clock,        color: 'bg-slate-500' },
  'Return':            { icon: RotateCcw,    color: 'bg-purple-500' },
}

const STATUS_ORDER = [
  'Booked', 'PRS Assigned', 'Out for Pickup', 'Picked Up',
  'Origin Scanned', 'Bagged', 'Manifested', 'Hub Inbound',
  'DRS Assigned', 'Out for Delivery', 'Delivered',
]

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, mono = false, highlight = false }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-blue-600' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  )
}

export function ShipmentDetailDrawer({ awb, onClose }) {
  const shipments = useStore(s => s.shipments)
  const prs       = useStore(s => s.prs)
  const bags      = useStore(s => s.bags)
  const manifests = useStore(s => s.manifests)
  const drs       = useStore(s => s.drs)

  const [entityDetail, setEntityDetail] = useState(null) // { type, id }

  if (!awb) return null

  const s = shipments.find(x => x.awb === awb)
  if (!s) return null

  // Build linked records
  const prsRec      = s.prsId      ? prs.find(p => p.id === s.prsId)           : null
  const bagRec      = s.bagId      ? bags.find(b => b.id === s.bagId)           : null
  const manifestRec = s.manifestId ? manifests.find(m => m.id === s.manifestId) : null
  const drsRec      = s.drsId      ? drs.find(d => d.id === s.drsId)           : null

  // Build timeline from current status position
  const currentIdx = STATUS_ORDER.indexOf(s.status)
  const timeline = STATUS_ORDER
    .slice(0, currentIdx + 1)
    .reverse() // most recent first
    .map((st, i) => ({ status: st, isCurrent: i === 0 }))

  // If ended in non-delivery, push that at the front
  const timelineEvents = s.status === 'Non-Delivery'
    ? [{ status: 'Non-Delivery', isCurrent: true }, ...STATUS_ORDER.slice(0, currentIdx).reverse().map(st => ({ status: st, isCurrent: false }))]
    : timeline

  const volWeight = s.dimensions
    ? ((s.dimensions.l * s.dimensions.w * s.dimensions.h) / 5000).toFixed(2)
    : null
  const chargeableWeight = volWeight
    ? Math.max(s.weight, parseFloat(volWeight)).toFixed(2)
    : s.weight

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none mb-1">Shipment Detail</p>
              <p className="font-mono font-bold text-white text-base leading-none">{s.awb}</p>
              {s.hawb && (
                <p className="font-mono text-slate-400 text-xs mt-0.5">HAWB: {s.hawb}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={s.status} />
            <button
              onClick={onClose}
              className="ml-2 p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Identifiers ─────────────────────────────────── */}
          <div className="px-5 py-4 bg-slate-50 border-b">
            <div className="grid grid-cols-3 gap-4">
              <Field label="AWB No." value={s.awb} mono highlight />
              {s.hawb && <Field label="HAWB" value={s.hawb} mono highlight />}
              {s.mawb && <Field label="MAWB" value={s.mawb} mono />}
              <Field label="Service" value={s.serviceType} />
              <Field label="Booked" value={formatDateShort(s.createdAt)} />
              {s.expectedDelivery && <Field label="Expected Delivery" value={s.expectedDelivery} />}
            </div>
          </div>

          <div className="px-5 py-4 space-y-5 divide-y divide-slate-100">

            {/* ── Sender ─────────────────────────────────────── */}
            <Section title="Sender / Shipper">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{s.sender.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-5">
                  <Field label="Address" value={s.sender.address} />
                  <Field label="City" value={s.sender.city} />
                  <Field label="Country" value={s.sender.country} />
                  <Field label="Phone" value={s.sender.phone} />
                  {s.sender.email && <Field label="Email" value={s.sender.email} />}
                </div>
              </div>
            </Section>

            {/* ── Receiver ───────────────────────────────────── */}
            <Section title="Receiver / Consignee">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3 mt-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{s.receiver.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-5">
                  <Field label="Address" value={s.receiver.address} />
                  <Field label="City" value={s.receiver.city} />
                  <Field label="Country" value={s.receiver.country} />
                  <Field label="Phone" value={s.receiver.phone} />
                  {s.receiver.email && <Field label="Email" value={s.receiver.email} />}
                </div>
              </div>
            </Section>

            {/* ── Package Details ─────────────────────────────── */}
            <Section title="Package Details">
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Dead Weight</p>
                  <p className="text-lg font-bold text-slate-800">{s.weight} <span className="text-xs font-normal">kg</span></p>
                </div>
                {volWeight && (
                  <div className="bg-slate-50 border rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">Vol. Weight</p>
                    <p className="text-lg font-bold text-slate-800">{volWeight} <span className="text-xs font-normal">kg</span></p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-500 mb-1">Chargeable</p>
                  <p className="text-lg font-bold text-blue-700">{chargeableWeight} <span className="text-xs font-normal">kg</span></p>
                </div>
              </div>
              {s.dimensions && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Dimensions: {s.dimensions.l} × {s.dimensions.w} × {s.dimensions.h} cm
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {s.pieces && <Field label="No. of Pieces" value={s.pieces} />}
                {s.goodsDescription && <Field label="Description of Goods" value={s.goodsDescription} />}
                {s.goodsValue && <Field label="Package Value" value={`ZMW ${s.goodsValue}`} />}
                {s.insured && <Field label="Insured" value={s.insured ? 'Yes' : 'No'} />}
              </div>
            </Section>

            {/* ── Payment & Billing ───────────────────────────── */}
            {(s.paymentType || s.billTo || s.supplierName) && (
              <Section title="Payment & Billing">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Field label="Payment Type" value={s.paymentType} />
                  <Field label="Bill To" value={s.billTo} />
                  <Field label="Supplier Name" value={s.supplierName} />
                  <Field label="Supplier Tracking No." value={s.supplierTrackingNo} mono />
                </div>
              </Section>
            )}

            {/* ── Operations Chain ────────────────────────────── */}
            <Section title="Operations Chain">
              <div className="grid grid-cols-2 gap-3 mt-3">
                {prsRec && (
                  <button onClick={() => setEntityDetail({ type: 'prs', id: prsRec.id })}
                    className="bg-yellow-50 border border-yellow-100 hover:border-yellow-300 rounded-xl p-3 text-left group transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-yellow-600 font-medium">PRS</p>
                      <ExternalLink size={11} className="text-yellow-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-slate-700 text-sm">{prsRec.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{prsRec.driver} · {prsRec.hub}</p>
                    <StatusBadge status={prsRec.status} type="prs" className="mt-2" />
                  </button>
                )}
                {bagRec && (
                  <button onClick={() => setEntityDetail({ type: 'bag', id: bagRec.id })}
                    className="bg-indigo-50 border border-indigo-100 hover:border-indigo-300 rounded-xl p-3 text-left group transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-indigo-600 font-medium">Bag</p>
                      <ExternalLink size={11} className="text-indigo-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-slate-700 text-sm">{bagRec.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{bagRec.destination} · {bagRec.mode}</p>
                  </button>
                )}
                {manifestRec && (
                  <button onClick={() => setEntityDetail({ type: manifestRec.id?.startsWith('SMF-') ? 'smf' : 'manifest', id: manifestRec.id })}
                    className="bg-cyan-50 border border-cyan-100 hover:border-cyan-300 rounded-xl p-3 text-left group transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-cyan-600 font-medium">Manifest</p>
                      <ExternalLink size={11} className="text-cyan-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-slate-700 text-sm">{manifestRec.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{manifestRec.origin} → {manifestRec.destination}</p>
                  </button>
                )}
                {drsRec && (
                  <button onClick={() => setEntityDetail({ type: 'drs', id: drsRec.id })}
                    className="bg-green-50 border border-green-100 hover:border-green-300 rounded-xl p-3 text-left group transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-green-600 font-medium">DRS</p>
                      <ExternalLink size={11} className="text-green-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-slate-700 text-sm">{drsRec.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{drsRec.driver} · {drsRec.hub}</p>
                  </button>
                )}
                {!prsRec && !bagRec && !manifestRec && !drsRec && (
                  <p className="text-sm text-slate-400 italic col-span-2">Not yet assigned to any operations run.</p>
                )}
              </div>
            </Section>

            {/* ── POD ─────────────────────────────────────────── */}
            {s.pod && (
              <Section title="Proof of Delivery">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800 text-sm">Delivered Successfully</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Received By" value={s.pod.recipientName} />
                    <Field label="Mobile" value={s.pod.mobile} />
                    <Field label="Delivered At" value={formatDate(s.pod.timestamp)} />
                    {s.pod.notes && <Field label="Notes" value={s.pod.notes} />}
                  </div>
                </div>
              </Section>
            )}

            {/* ── NDR ─────────────────────────────────────────── */}
            {s.ndr && (
              <Section title="Non-Delivery Report">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="font-semibold text-red-800 text-sm">Delivery Failed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Reason" value={s.ndr.reason} />
                    <Field label="Attempt Date" value={formatDate(s.ndr.attemptDate)} />
                    {s.ndr.rescheduleDate && <Field label="Rescheduled" value={formatDate(s.ndr.rescheduleDate)} />}
                    {s.ndr.notes && <Field label="Notes" value={s.ndr.notes} />}
                  </div>
                </div>
              </Section>
            )}

            {/* ── Tracking Timeline ───────────────────────────── */}
            <Section title="Tracking Timeline">
              <div className="mt-3 space-y-0">
                {timelineEvents.map((evt, idx) => {
                  const cfg = TIMELINE_ICONS[evt.status] || { icon: Package, color: 'bg-slate-400' }
                  const Icon = cfg.icon
                  const isLast = idx === timelineEvents.length - 1
                  return (
                    <div key={evt.status} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${evt.isCurrent ? cfg.color : 'bg-slate-100'}`}>
                          <Icon size={13} className={evt.isCurrent ? 'text-white' : 'text-slate-400'} />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 my-1 min-h-[1rem] bg-slate-100" />}
                      </div>
                      <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-medium leading-none mb-1 ${evt.isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                          {evt.status}
                        </p>
                        {evt.isCurrent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>

          </div>{/* end scrollable sections */}
        </div>{/* end flex-1 */}

        {/* Footer actions */}
        <div className="border-t px-5 py-3 flex items-center gap-3 bg-slate-50">
          <button
            onClick={() => window.open(`/track/${s.hawb || s.awb}`, '_blank')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
          >
            <MapPin size={14} />
            Public Tracking
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Nested entity detail (e.g. PRS/Bag/Manifest/DRS clicked from ops chain) */}
      {entityDetail && (
        <EntityDetailDrawer
          type={entityDetail.type}
          id={entityDetail.id}
          onClose={() => setEntityDetail(null)}
        />
      )}
    </>
  )
}
