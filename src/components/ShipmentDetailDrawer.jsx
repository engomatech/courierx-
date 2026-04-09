/**
 * ShipmentDetailDrawer
 * Slides in from the right when the user clicks any AWB anywhere in the system.
 * Shows complete shipment info: identifiers, sender/receiver, package details,
 * goods info, payment, and full tracking timeline.
 */

import { useState } from 'react'
import { X, Package, MapPin, Truck, User, Phone, Mail, Weight,
         Box, DollarSign, Calendar, Hash, Shield, CreditCard,
         CheckCircle2, Clock, AlertTriangle, RotateCcw, Printer, ExternalLink,
         ScanLine, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useStore } from '../store'
import { StatusBadge } from './StatusBadge'
import { formatDate, formatDateShort } from '../utils'
import { EntityDetailDrawer } from './EntityDetailDrawer'

// ── Complete pipeline definition ──────────────────────────────────────────────
// Each step has: the status value, display label, the page where it happens, and the action that advances it
const PIPELINE = [
  { status: 'Booked',           label: 'Booked',          short: 'Book',    page: '/ops/booking',   action: 'Confirm booking',          color: 'bg-blue-500',    ring: 'ring-blue-400'    },
  { status: 'Confirmed',        label: 'Confirmed',        short: 'Confirm', page: '/ops/booking',   action: 'Confirmed by ops',         color: 'bg-sky-500',     ring: 'ring-sky-400'     },
  { status: 'PRS Assigned',     label: 'PRS Assigned',     short: 'PRS',     page: '/ops/prs',       action: 'Create PRS & add shipment', color: 'bg-yellow-500', ring: 'ring-yellow-400'  },
  { status: 'Out for Pickup',   label: 'Out for Pickup',   short: 'Pickup',  page: '/ops/prs',       action: 'Proceed PRS for pickup',   color: 'bg-orange-500',  ring: 'ring-orange-400'  },
  { status: 'Picked Up',        label: 'Picked Up',        short: "Picked",  page: '/ops/prs',       action: 'Mark PRS as completed',    color: 'bg-amber-500',   ring: 'ring-amber-400'   },
  { status: 'Origin Scanned',   label: 'Origin Scanned',   short: 'Origin',  page: '/ops/inbound-scan', action: 'Scan AWB at origin',    color: 'bg-purple-500',  ring: 'ring-purple-400'  },
  { status: 'Bagged',           label: 'Bagged',           short: 'Bag',     page: '/ops/bags',      action: 'Add to bag',               color: 'bg-indigo-500',  ring: 'ring-indigo-400'  },
  { status: 'Manifested',       label: 'Manifested',       short: 'Manif.',  page: '/ops/manifests', action: 'Add bag to manifest',      color: 'bg-cyan-500',    ring: 'ring-cyan-400'    },
  { status: 'Hub Inbound',      label: 'Hub Inbound',      short: 'Hub',     page: '/ops/hub-inbound', action: 'Scan at destination hub', color: 'bg-teal-500',  ring: 'ring-teal-400'    },
  { status: 'DRS Assigned',     label: 'DRS Assigned',     short: 'DRS',     page: '/ops/drs',       action: 'Create DRS & add shipment', color: 'bg-lime-500',  ring: 'ring-lime-400'    },
  { status: 'Out for Delivery', label: 'Out for Delivery', short: 'OFD',     page: '/ops/drs',       action: 'Start DRS delivery run',   color: 'bg-green-500',   ring: 'ring-green-400'   },
  { status: 'Delivered',        label: 'Delivered',        short: 'Done',    page: '/ops/delivery',  action: 'Record proof of delivery', color: 'bg-emerald-500', ring: 'ring-emerald-400' },
]

// ── Advance one step at a time from the drawer ────────────────────────────────
function AdvancePanel({ awb, currentStatus, onAdvanced }) {
  const updateShipmentStatus = useStore(s => s.updateShipmentStatus)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const currentIdx = PIPELINE.findIndex(p => p.status === currentStatus)
  const next = currentIdx >= 0 && currentIdx < PIPELINE.length - 1 ? PIPELINE[currentIdx + 1] : null

  const advance = async () => {
    if (!next) return
    setLoading(true); setErr('')
    try {
      const res = await fetch(`/api/v1/admin/shipments/${awb}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ status: next.status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
      updateShipmentStatus(awb, next.status)
      onAdvanced(next.status)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!next) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
        <span className="text-sm font-medium text-emerald-700">Shipment journey complete</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-blue-500 font-medium mb-0.5">Next Stage</p>
          <p className="text-sm font-semibold text-blue-900">{next.label}</p>
          <p className="text-xs text-blue-600 mt-0.5">Page: <span className="font-mono">{next.page}</span></p>
        </div>
        <button
          onClick={advance}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 shrink-0 ${next.color.replace('bg-', 'bg-').replace('-500', '-600')} hover:opacity-90`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
          {loading ? 'Recording…' : `→ ${next.short}`}
        </button>
      </div>
      {err && (
        <div className="flex items-center gap-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle size={12} className="shrink-0" />{err}
        </div>
      )}
    </div>
  )
}

// ── Manual override panel (jump to any stage) ─────────────────────────────────
function ManualScanPanel({ awb }) {
  const updateShipmentStatus = useStore(s => s.updateShipmentStatus)
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(null)
  const [last,    setLast]    = useState(null)

  const handleScan = async (status) => {
    setLoading(status)
    try {
      const res = await fetch(`/api/v1/admin/shipments/${awb}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
      updateShipmentStatus(awb, status)
      setLast({ status, ok: true, ts: new Date().toLocaleTimeString() })
    } catch (err) {
      setLast({ status, ok: false, msg: err.message, ts: new Date().toLocaleTimeString() })
    } finally {
      setLoading(null)
    }
  }

  const overrideEvents = [
    ...PIPELINE.map(p => ({ status: p.status, label: p.label, color: p.color })),
    { status: 'NDR',  label: 'Failed Delivery', color: 'bg-red-500'    },
    { status: 'RTS',  label: 'Return to Sender', color: 'bg-orange-500' },
    { status: 'Held', label: 'On Hold',          color: 'bg-slate-500'  },
  ]

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span className="flex items-center gap-2">
          <ScanLine size={15} className="text-slate-500" />
          Override / Jump to Stage
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 bg-white space-y-3">
          <p className="text-xs text-slate-400">Force-set this shipment to any stage — useful for testing or correcting errors.</p>
          <div className="grid grid-cols-3 gap-1.5">
            {overrideEvents.map(({ status, label, color }) => (
              <button
                key={status}
                onClick={() => handleScan(status)}
                disabled={!!loading}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-white border-0 transition-opacity disabled:opacity-40 ${color} hover:opacity-80`}
              >
                {loading === status ? <Loader2 size={10} className="animate-spin" /> : null}
                {label}
              </button>
            ))}
          </div>
          {last && (
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${last.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {last.ok
                ? <CheckCircle2 size={13} className="shrink-0" />
                : <AlertTriangle size={13} className="shrink-0" />}
              {last.ok
                ? `✓ Set to "${last.status}" at ${last.ts}`
                : `✗ ${last.msg || `Failed`}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// icon lookup for the pipeline steps
const PIPELINE_ICONS = {
  'Booked':            Package,
  'Confirmed':         CheckCircle2,
  'PRS Assigned':      Truck,
  'Out for Pickup':    Truck,
  'Picked Up':         Truck,
  'Origin Scanned':    Hash,
  'Bagged':            Box,
  'Manifested':        Package,
  'Hub Inbound':       MapPin,
  'DRS Assigned':      Truck,
  'Out for Delivery':  Truck,
  'Delivered':         CheckCircle2,
  'Non-Delivery':      AlertTriangle,
  'On Hold':           Clock,
  'RTS':               RotateCcw,
}

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

  const [entityDetail,   setEntityDetail]   = useState(null)  // { type, id }
  const [liveStatus,     setLiveStatus]     = useState(null)  // override after advance

  if (!awb) return null

  // Accept either AWB (confirmed) or HAWB (booking reference)
  const s = shipments.find(x => x.awb === awb || x.hawb === awb)
  if (!s) return null

  const currentStatus = liveStatus || s.status

  // Build linked records
  const prsRec      = s.prsId      ? prs.find(p => p.id === s.prsId)           : null
  const bagRec      = s.bagId      ? bags.find(b => b.id === s.bagId)           : null
  const manifestRec = s.manifestId ? manifests.find(m => m.id === s.manifestId) : null
  const drsRec      = s.drsId      ? drs.find(d => d.id === s.drsId)           : null

  const currentIdx = PIPELINE.findIndex(p => p.status === currentStatus)
  // exception statuses not in main pipeline
  const isException = ['NDR', 'RTS', 'Held', 'Non-Delivery', 'On Hold'].includes(currentStatus)

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
              {s.awb
                ? <p className="font-mono font-bold text-white text-base leading-none">{s.awb}</p>
                : <p className="font-mono font-bold text-sky-300 text-base leading-none">{s.hawb} <span className="text-xs text-sky-400 font-normal">(HAWB)</span></p>
              }
              {s.hawb && s.awb && (
                <p className="font-mono text-slate-400 text-xs mt-0.5">HAWB: {s.hawb}</p>
              )}
              {!s.awb && (
                <p className="text-xs text-amber-400 mt-0.5">Awaiting AWB — not yet confirmed</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={currentStatus} />
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
              <Field label="HAWB (Booking Ref)" value={s.hawb} mono highlight />
              {s.awb
                ? <Field label="AWB No." value={s.awb} mono highlight />
                : <div><p className="text-xs text-slate-400 mb-0.5">AWB No.</p><p className="text-sm text-amber-500 font-medium">Pending confirmation</p></div>
              }
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

            {/* ── Full Pipeline Flow ──────────────────────────── */}
            <Section title="Shipment Journey">
              <div className="mt-3 space-y-3">

                {/* Exception banner */}
                {isException && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-700">Status: <strong>{currentStatus}</strong> — exception / hold</span>
                  </div>
                )}

                {/* Demo badge */}
                {s._demo && (
                  <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-violet-700">DEMO PARCEL</span>
                    <span className="text-xs text-violet-500">{s._demoLabel}{s._partner ? ` — Partner: ${s._partner}` : ''}</span>
                  </div>
                )}

                {/* Pipeline stepper */}
                <div className="space-y-0">
                  {PIPELINE.map((step, idx) => {
                    const isDone    = idx < currentIdx
                    const isCurrent = idx === currentIdx
                    const isNext    = idx === currentIdx + 1
                    const Icon      = PIPELINE_ICONS[step.status] || Package
                    const isLast    = idx === PIPELINE.length - 1

                    return (
                      <div key={step.status} className="flex gap-3">
                        {/* Icon + line */}
                        <div className="flex flex-col items-center shrink-0 w-7">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-offset-1 transition-all
                            ${isDone    ? `${step.color} ring-transparent`               : ''}
                            ${isCurrent ? `${step.color} ${step.ring}`                   : ''}
                            ${isNext    ? 'bg-white border-2 border-dashed border-slate-300 ring-transparent' : ''}
                            ${!isDone && !isCurrent && !isNext ? 'bg-slate-100 ring-transparent' : ''}
                          `}>
                            <Icon size={12} className={
                              isDone || isCurrent ? 'text-white' :
                              isNext ? 'text-slate-400' : 'text-slate-300'
                            } />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 my-0.5 min-h-[14px] ${isDone ? step.color.replace('bg-', 'bg-') : 'bg-slate-100'}`} />
                          )}
                        </div>

                        {/* Label */}
                        <div className={`flex-1 pb-2 flex items-start justify-between gap-2 ${isLast ? 'pb-0' : ''}`}>
                          <div>
                            <p className={`text-sm font-medium leading-tight
                              ${isDone    ? 'text-slate-400 line-through' : ''}
                              ${isCurrent ? 'text-slate-900'             : ''}
                              ${isNext    ? 'text-slate-600'             : ''}
                              ${!isDone && !isCurrent && !isNext ? 'text-slate-300' : ''}
                            `}>
                              {step.label}
                            </p>
                            {isNext && (
                              <p className="text-xs text-slate-400 mt-0.5">Go to: <span className="font-mono text-blue-500">{step.page}</span></p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isDone    && <CheckCircle2 size={14} className="text-slate-300 mt-1" />}
                            {isCurrent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block">HERE</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Advance button */}
                {!isException && (
                  <AdvancePanel
                    awb={s.awb || s.hawb}
                    currentStatus={currentStatus}
                    onAdvanced={(st) => setLiveStatus(st)}
                  />
                )}
              </div>
            </Section>

            {/* ── Override / Jump ─────────────────────────────── */}
            <Section title="Manual Override">
              <div className="mt-3">
                <ManualScanPanel awb={s.awb || s.hawb} />
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
