/**
 * Partner Orders — Ops view of incoming shipments created via the Partner API
 *
 * Fetches GET /api/v1/admin/shipments and displays all partner-created
 * bookings so the ops team can process them through the pipeline.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Globe, Search, RefreshCw, ChevronDown, ChevronUp,
  Package, MapPin, User, Phone, Calendar, Hash,
  ExternalLink, AlertCircle, Loader2, Filter, X,
  CheckCircle2, PenLine, Camera, CreditCard, Wallet,
  Truck, Link2, ShieldCheck, ShieldAlert, Clock, UserCheck, Send, Mail,
  Download, Archive, FileStack, ArrowRight, Bell, ChevronRight,
  ArrowRightCircle, PackageCheck, PlaneTakeoff, Warehouse, Bike, XCircle,
} from 'lucide-react'

const API_BASE = '/api/v1'

// ── Partner Order Workflow Guide ──────────────────────────────────────────────
const PARTNER_WORKFLOW = [
  {
    step: 1, icon: Download, label: 'Receive',
    color: 'bg-sky-600', border: 'border-sky-200', bg: 'bg-sky-50', text: 'text-sky-700',
    desc: 'Partner submits order via API or marketplace webhook. AWB auto-generated.',
    action: 'Review new orders',
    trigger: 'Auto-notification sent to partner confirming receipt',
  },
  {
    step: 2, icon: CheckCircle2, label: 'Process',
    color: 'bg-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-700',
    desc: 'Verify parcel details, confirm payment status, check KYC hold.',
    action: 'Confirm payment · Clear KYC',
    trigger: 'Payment confirmation notification sent to sender',
  },
  {
    step: 3, icon: Archive, label: 'Bag',
    color: 'bg-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700',
    desc: 'Consolidate parcels by destination. Scan into open bags. Close bag when full.',
    action: 'Go to Bags →',
    route: '/bags',
    trigger: 'No customer notification at this stage',
    internal: true,
  },
  {
    step: 4, icon: FileStack, label: 'Manifest',
    color: 'bg-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50', text: 'text-cyan-700',
    desc: 'Create a manifest covering closed bags or direct AWBs. Review and close manifest.',
    action: 'Go to Manifests →',
    route: '/manifests',
    trigger: 'No customer notification — notified on dispatch',
    internal: true,
  },
  {
    step: 5, icon: Truck, label: 'Dispatch',
    color: 'bg-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700',
    desc: 'Dispatch the manifest to the hub or destination facility. Triggers automated customer notifications.',
    action: 'Dispatch Manifest',
    trigger: '✉ Automated: "Your parcel is in transit" sent to all customers',
    highlight: true,
  },
]

function PartnerWorkflowGuide() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">Partner Order Processing Workflow</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Section 4.13 — From vendor receipt to dispatch</p>
          </div>
        </div>
        <ChevronRight size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t px-4 pb-5 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PARTNER_WORKFLOW.map((w, idx) => {
              const Icon = w.icon
              return (
                <div key={w.step} className="flex lg:flex-col items-start lg:items-stretch gap-2">
                  <div className={`rounded-xl border ${w.border} ${w.bg} p-3.5 flex-1`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 ${w.color} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Step {w.step}</span>
                    </div>
                    <p className={`text-sm font-bold ${w.text} mb-1`}>{w.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{w.desc}</p>
                    <div className={`text-xs rounded-lg px-2.5 py-1.5 font-medium leading-snug
                      ${w.highlight
                        ? 'bg-emerald-600 text-white'
                        : w.internal
                        ? 'bg-slate-100 text-slate-500'
                        : `${w.bg} ${w.text}`
                      }`}>
                      <Bell size={9} className="inline mr-1 -mt-0.5" />
                      {w.trigger}
                    </div>
                  </div>
                  {idx < PARTNER_WORKFLOW.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center text-slate-200 self-start mt-8">
                      <ArrowRight size={16} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Bags and Manifests are managed via their dedicated pages. Use the Bags &amp; Manifests menu items to complete steps 3 &amp; 4.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Status chip colours ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  Booked              : 'bg-sky-100 text-sky-700',
  'Picked Up'         : 'bg-amber-100 text-amber-700',
  'In Transit'        : 'bg-blue-100 text-blue-700',
  'In Hub'            : 'bg-indigo-100 text-indigo-700',
  'Out for Delivery'  : 'bg-orange-100 text-orange-700',
  Delivered           : 'bg-emerald-100 text-emerald-700',
  'Delivery Failed'   : 'bg-red-100 text-red-700',
  NDR                 : 'bg-rose-100 text-rose-700',
  Return              : 'bg-purple-100 text-purple-700',
  Cancelled           : 'bg-slate-100 text-slate-500',
  'Awaiting Payment'  : 'bg-yellow-100 text-yellow-700',
  'Payment Confirmed' : 'bg-teal-100 text-teal-700',
}

const PAYMENT_STATUS_COLORS = {
  pending          : 'bg-yellow-50 text-yellow-700 border-yellow-200',
  quoted           : 'bg-blue-50 text-blue-700 border-blue-200',
  paid             : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  credit_approved  : 'bg-teal-50 text-teal-700 border-teal-200',
  waived           : 'bg-slate-50 text-slate-500 border-slate-200',
}

const ACCOUNT_STATUS_COLORS = {
  active  : 'bg-emerald-100 text-emerald-700',
  pending : 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
}

// ── Partner order pipeline ────────────────────────────────────────────────────
const PARTNER_PIPELINE = [
  { status: 'Booked',           label: 'Booked',            icon: Package,        dot: 'bg-sky-500',     next: 'Picked Up',         nextLabel: 'Accept & Collect',    nextColor: 'bg-sky-600 hover:bg-sky-700'       },
  { status: 'Picked Up',        label: 'Collected',         icon: PackageCheck,   dot: 'bg-amber-500',   next: 'In Transit',        nextLabel: 'Mark In Transit',     nextColor: 'bg-amber-600 hover:bg-amber-700'   },
  { status: 'In Transit',       label: 'In Transit',        icon: PlaneTakeoff,   dot: 'bg-blue-500',    next: 'In Hub',            nextLabel: 'Arrived at Hub',      nextColor: 'bg-blue-600 hover:bg-blue-700'     },
  { status: 'In Hub',           label: 'At Hub',            icon: Warehouse,      dot: 'bg-indigo-500',  next: 'Out for Delivery',  nextLabel: 'Out for Delivery',    nextColor: 'bg-indigo-600 hover:bg-indigo-700' },
  { status: 'Out for Delivery', label: 'Out for Delivery',  icon: Bike,           dot: 'bg-orange-500',  next: 'Delivered',         nextLabel: 'Mark Delivered',      nextColor: 'bg-emerald-600 hover:bg-emerald-700', altNext: 'Delivery Failed', altLabel: 'Failed Delivery', altColor: 'bg-red-500 hover:bg-red-600' },
  { status: 'Delivered',        label: 'Delivered',         icon: CheckCircle2,   dot: 'bg-emerald-500', next: null },
  { status: 'Delivery Failed',  label: 'Failed',            icon: XCircle,        dot: 'bg-red-500',     next: null },
]

function PipelineStepper({ currentStatus, onAdvance, advancing }) {
  const currentIdx = PARTNER_PIPELINE.findIndex(s => s.status === currentStatus)
  const currentStep = PARTNER_PIPELINE[currentIdx]
  const isException = ['Cancelled', 'NDR', 'Return', 'Awaiting Payment'].includes(currentStatus)

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipment Progress</p>

      {/* Step dots */}
      <div className="flex items-center gap-1">
        {PARTNER_PIPELINE.map((step, idx) => {
          const done    = idx < currentIdx
          const current = idx === currentIdx
          const Icon    = step.icon
          return (
            <div key={step.status} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`relative flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all
                ${done    ? step.dot + ' ring-2 ring-offset-1 ring-transparent'           : ''}
                ${current ? step.dot + ' ring-2 ring-offset-2 ring-current shadow-sm'     : ''}
                ${!done && !current ? 'bg-slate-200'                                      : ''}
              `}>
                <Icon size={12} className={done || current ? 'text-white' : 'text-slate-400'} />
              </div>
              {idx < PARTNER_PIPELINE.length - 1 && (
                <div className={`h-0.5 flex-1 rounded ${done ? step.dot.replace('bg-','bg-') : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Current label */}
      {!isException && currentStep && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          {PARTNER_PIPELINE.map((s, i) => (
            <span key={s.status} className={`text-center flex-1 leading-tight
              ${i === currentIdx ? 'font-bold text-slate-800' : ''}
              ${i < currentIdx   ? 'text-slate-400'           : ''}
              ${i > currentIdx   ? 'text-slate-300'           : ''}
            `} style={{ fontSize: '10px' }}>
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isException ? (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
          <AlertCircle size={13} /> Status: <strong>{currentStatus}</strong> — requires manual resolution
        </div>
      ) : currentStep?.next ? (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAdvance(currentStep.next)}
            disabled={advancing}
            className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${currentStep.nextColor}`}
          >
            {advancing === currentStep.next
              ? <Loader2 size={14} className="animate-spin" />
              : <ArrowRightCircle size={14} />
            }
            {currentStep.nextLabel}
          </button>
          {currentStep.altNext && (
            <button
              onClick={() => onAdvance(currentStep.altNext)}
              disabled={advancing}
              className={`flex items-center justify-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${currentStep.altColor}`}
            >
              {advancing === currentStep.altNext
                ? <Loader2 size={14} className="animate-spin" />
                : <XCircle size={14} />
              }
              {currentStep.altLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 size={13} /> Shipment journey complete
        </div>
      )}
    </div>
  )
}

function StatusChip({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function ShipmentDrawer({ awb, onClose }) {
  const [data, setData]           = useState(null)
  const [pod, setPod]             = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [payLoading, setPayLoading]     = useState(false)
  const [payError, setPayError]         = useState(null)
  const [payMethod, setPayMethod]       = useState('wallet')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyMsg, setNotifyMsg]       = useState(null)
  const [overrideInput, setOverrideInput] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideMsg, setOverrideMsg]   = useState(null)
  const [advancing, setAdvancing]       = useState(null)   // status string being applied
  const [advanceMsg, setAdvanceMsg]     = useState(null)

  const loadData = useCallback(() => {
    if (!awb) return
    setLoading(true)
    setError(null)
    setPod(null)
    setPayError(null)

    fetch(`${API_BASE}/admin/shipments/${awb}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => {
        setData(d)
        setLoading(false)
        if (d.status === 'Delivered') {
          fetch(`${API_BASE}/admin/pod/${awb}`)
            .then(r => r.ok ? r.json() : null)
            .then(p => { if (p?.pod) setPod(p.pod) })
            .catch(() => {})
        }
      })
      .catch(e => { setError(e.message || 'Failed to load'); setLoading(false) })
  }, [awb])

  useEffect(() => { loadData() }, [loadData])

  async function sendPaymentNotification() {
    setNotifyLoading(true)
    setNotifyMsg(null)
    try {
      const res = await fetch(`${API_BASE}/admin/payments/${awb}/notify`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) setNotifyMsg({ ok: false, text: json.message || 'Failed to send.' })
      else         setNotifyMsg({ ok: true,  text: json.message || 'Notification sent.' })
    } catch {
      setNotifyMsg({ ok: false, text: 'Network error — check SMTP settings.' })
    } finally {
      setNotifyLoading(false)
    }
  }

  async function overrideKycHold() {
    if (overrideInput !== 'CONFIRM') return
    setOverrideLoading(true)
    setOverrideMsg(null)
    try {
      const r = await fetch(`${API_BASE}/admin/shipments/${awb}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ kyc_hold: 0 }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Override failed')
      setOverrideMsg({ ok: true, text: 'KYC hold removed. Shipment can now be dispatched.' })
      setOverrideInput('')
      // refresh drawer
      loadData()
    } catch (e) {
      setOverrideMsg({ ok: false, text: e.message })
    } finally {
      setOverrideLoading(false)
    }
  }

  async function advanceStatus(newStatus) {
    setAdvancing(newStatus)
    setAdvanceMsg(null)
    try {
      const res = await fetch(`${API_BASE}/admin/shipments/${awb}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Update failed')
      setAdvanceMsg({ ok: true, text: `Status updated to "${newStatus}"` })
      loadData()
    } catch (e) {
      setAdvanceMsg({ ok: false, text: e.message })
    } finally {
      setAdvancing(null)
    }
  }

  async function confirmPayment() {
    setPayLoading(true)
    setPayError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/payments/${awb}/confirm`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ method: payMethod, recorded_by: 'ops' }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPayError(json.message || 'Payment confirmation failed.')
      } else {
        // Reload drawer data to reflect new status
        loadData()
      }
    } catch {
      setPayError('Network error — try again.')
    } finally {
      setPayLoading(false)
    }
  }

  const APP_URL = 'http://163.245.221.133'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Partner Order</p>
            <h2 className="text-base font-bold text-slate-800 font-mono">{awb}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {data && (
            <>
              {/* ── Pipeline stepper + advance buttons ── */}
              <PipelineStepper
                currentStatus={data.status}
                onAdvance={advanceStatus}
                advancing={advancing}
              />
              {advanceMsg && (
                <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 -mt-2 ${advanceMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {advanceMsg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {advanceMsg.text}
                </div>
              )}

              {/* Partner + status row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Partner</p>
                  <p className="font-semibold text-slate-800">{data.partner_name}</p>
                  {data.partner_reference && (
                    <p className="text-xs text-slate-500 mt-0.5">Ref: {data.partner_reference}</p>
                  )}
                </div>
                <StatusChip status={data.status} />
              </div>

              {/* Service + created */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoCard label="Service" value={data.service_type} />
                <InfoCard
                  label="Created"
                  value={new Date(data.created_at).toLocaleDateString('en-ZM', {
                    day:'2-digit', month:'short', year:'numeric',
                  })}
                />
              </div>

              {/* ── Tracking IDs ── */}
              <Section title="Tracking IDs">
                <div className="space-y-2 text-sm">
                  {/* HAWB */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">HAWB</span>
                    <a
                      href={`${APP_URL}/track/${data.hawb}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 min-w-0 truncate"
                    >
                      {data.hawb}
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>
                  {/* OEX AWB */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">OEX AWB</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">{data.awb}</span>
                  </div>
                  {/* MAWB — only if set */}
                  {data.mawb && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">MAWB</span>
                      <a
                        href={`${APP_URL}/track/${data.mawb}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 min-w-0 truncate"
                      >
                        {data.mawb}
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {/* Origin carrier */}
                  {data.origin_carrier && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Origin Carrier</span>
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Truck size={11} />
                        {data.origin_carrier}
                      </span>
                    </div>
                  )}
                  {/* Delivery method */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Delivery</span>
                    <span className="text-xs font-medium text-slate-700 capitalize">
                      {data.delivery_method?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </Section>

              {/* ── KYC Hold Banner ── */}
              {data.kyc_hold && (
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800">KYC Hold — Shipment Cannot Be Dispatched</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        This shipment is on hold until the customer completes KYC verification.
                      </p>
                      {data.customer && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          Customer KYC status:
                          <span className="font-semibold capitalize ml-1">
                            {(data.customer.kyc_status || 'not_started').replace('_', ' ')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Override Hold — admin action */}
                  <div className="border-t border-amber-200 pt-3 space-y-2">
                    <p className="text-xs text-amber-700 font-semibold">Override Hold (Admin Authority)</p>
                    <p className="text-xs text-amber-600">
                      Type <span className="font-mono font-bold">CONFIRM</span> to remove the KYC hold and allow dispatch.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        value={overrideInput}
                        onChange={e => setOverrideInput(e.target.value)}
                        placeholder="Type CONFIRM to override"
                        className="flex-1 text-xs border border-amber-300 rounded-lg px-3 py-1.5 bg-white
                                   outline-none focus:ring-1 focus:ring-amber-400 text-slate-700 font-mono"
                      />
                      <button
                        onClick={overrideKycHold}
                        disabled={overrideLoading || overrideInput !== 'CONFIRM'}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5
                                   rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {overrideLoading
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ShieldCheck size={12} />
                        }
                        Override Hold
                      </button>
                    </div>
                    {overrideMsg && (
                      <div className={`text-xs rounded px-2 py-1.5 flex items-center gap-1 ${
                        overrideMsg.ok
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {overrideMsg.ok
                          ? <CheckCircle2 size={11} />
                          : <AlertCircle size={11} />
                        }
                        {overrideMsg.text}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Payment Gate ── */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Payment Gate
                </h3>
                {data.payment_status === 'paid' || data.payment_status === 'credit_approved' ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle2 size={16} />
                      Gate Cleared — {data.payment_status === 'credit_approved' ? 'Credit Approved' : 'Payment Received'}
                    </div>
                    {data.payment_amount && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {data.payment_currency} {Number(data.payment_amount).toFixed(2)}
                        {data.payment_method && ` · ${data.payment_method.replace(/_/g, ' ')}`}
                        {data.payment_paid_at && ` · ${new Date(data.payment_paid_at).toLocaleDateString('en-ZM', { day:'2-digit', month:'short' })}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-lg border p-4 space-y-3 ${PAYMENT_STATUS_COLORS[data.payment_status] || 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                    {/* Amount due */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <CreditCard size={14} />
                        {data.payment_status === 'quoted' ? 'Amount Due' : 'Payment Pending'}
                      </span>
                      <span className="font-bold text-base">
                        {data.payment_amount
                          ? `${data.payment_currency} ${Number(data.payment_amount).toFixed(2)}`
                          : <span className="text-xs font-normal opacity-70">Not yet quoted</span>
                        }
                      </span>
                    </div>

                    {/* Customer wallet balance */}
                    {data.customer && (
                      <div className="flex items-center justify-between text-xs opacity-80">
                        <span className="flex items-center gap-1"><Wallet size={11} /> Customer Wallet</span>
                        <span className="font-semibold">
                          ZMW {Number(data.customer.wallet_balance ?? 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Notify customer button */}
                    {data.receiver?.email || data.customer?.email ? (
                      <div className="border-t border-current/10 pt-3">
                        {notifyMsg && (
                          <div className={`text-xs rounded px-2 py-1.5 mb-2 flex items-center gap-1 ${notifyMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {notifyMsg.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                            {notifyMsg.text}
                          </div>
                        )}
                        <button
                          onClick={sendPaymentNotification}
                          disabled={notifyLoading}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                        >
                          {notifyLoading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                          Send Payment Request to Customer
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-current/10 pt-3 text-xs opacity-60 flex items-center gap-1">
                        <Mail size={11} /> No receiver email on record — notify manually.
                      </div>
                    )}

                    {/* Confirm payment controls */}
                    {data.payment_amount && (
                      <div className="border-t border-current/10 pt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs opacity-70 shrink-0">Method:</label>
                          <select
                            value={payMethod}
                            onChange={e => setPayMethod(e.target.value)}
                            className="flex-1 text-xs border border-current/20 rounded px-2 py-1 bg-white/70 focus:outline-none"
                          >
                            <option value="wallet">Wallet (auto-debit)</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>
                        </div>
                        {payError && (
                          <div className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1.5 flex items-center gap-1">
                            <AlertCircle size={11} />
                            {payError}
                          </div>
                        )}
                        <button
                          onClick={confirmPayment}
                          disabled={payLoading}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                        >
                          {payLoading
                            ? <Loader2 size={13} className="animate-spin" />
                            : <ShieldCheck size={13} />
                          }
                          Confirm Payment & Clear Gate
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Customer Account ── */}
              {data.customer ? (
                <Section title="Customer Account">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Name</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <UserCheck size={12} className="text-slate-400" />
                        {data.customer.name}
                      </span>
                    </div>
                    {data.customer.phone && (
                      <InfoRow label="Phone" value={data.customer.phone} />
                    )}
                    {data.customer.email && (
                      <InfoRow label="Email" value={data.customer.email} />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Status</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACCOUNT_STATUS_COLORS[data.customer.account_status] || 'bg-slate-100 text-slate-600'}`}>
                        {data.customer.account_status === 'pending' ? '● Pending Setup' : data.customer.account_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Wallet</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Wallet size={12} className="text-slate-400" />
                        ZMW {Number(data.customer.wallet_balance ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Section>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2">
                  <User size={13} className="shrink-0" />
                  No customer account linked. Account will be created automatically when partner sends consignee details.
                </div>
              )}

              {/* Package */}
              <Section title="Package">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <InfoRow label="Weight"    value={`${data.package.weight} kg`} />
                  <InfoRow label="Quantity"  value={data.package.quantity} />
                  <InfoRow label="Dims (cm)" value={`${data.package.length} × ${data.package.width} × ${data.package.height}`} />
                  <InfoRow label="Value"     value={`${data.package.currency} ${data.package.value?.toLocaleString() ?? '—'}`} />
                  {data.package.description && (
                    <div className="col-span-2">
                      <InfoRow label="Description" value={data.package.description} />
                    </div>
                  )}
                </div>
              </Section>

              {/* Sender */}
              <Section title="Sender">
                <div className="space-y-2 text-sm">
                  <InfoRow label="Name"    value={data.sender.name} />
                  <InfoRow label="Phone"   value={data.sender.phone} />
                  <InfoRow label="Address" value={data.sender.address} />
                  <InfoRow label="City"    value={`${data.sender.city}, ${data.sender.country}`} />
                </div>
              </Section>

              {/* Receiver */}
              <Section title="Receiver">
                <div className="space-y-2 text-sm">
                  <InfoRow label="Name"    value={data.receiver.name} />
                  <InfoRow label="Phone"   value={data.receiver.phone} />
                  <InfoRow label="Address" value={data.receiver.address} />
                  <InfoRow label="City"    value={`${data.receiver.city}, ${data.receiver.country}`} />
                </div>
              </Section>

              {/* Proof of Delivery */}
              {data.status === 'Delivered' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Proof of Delivery
                  </h3>
                  {pod ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                        <CheckCircle2 size={16} className="shrink-0" />
                        Delivery Confirmed
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-emerald-500 mb-0.5">Signed by</p>
                          <p className="font-semibold text-slate-800">{pod.recipient_name}</p>
                        </div>
                        {pod.recipient_mobile && (
                          <div>
                            <p className="text-xs text-emerald-500 mb-0.5">Mobile</p>
                            <p className="font-medium text-slate-700">{pod.recipient_mobile}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-xs text-emerald-500 mb-0.5">Recorded at</p>
                          <p className="text-slate-600 text-xs">
                            {new Date(pod.recorded_at).toLocaleString('en-ZM', {
                              day:'2-digit', month:'short', year:'numeric',
                              hour:'2-digit', minute:'2-digit',
                            })}
                            {pod.recorded_by && ` · ${pod.recorded_by}`}
                          </p>
                        </div>
                        {pod.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-emerald-500 mb-0.5">Notes</p>
                            <p className="text-slate-600 text-xs italic">{pod.notes}</p>
                          </div>
                        )}
                      </div>
                      {pod.signature_data && (
                        <div className="border-t border-emerald-200 pt-3">
                          <p className="text-xs text-emerald-500 mb-1.5 flex items-center gap-1">
                            <PenLine size={11} /> Signature
                          </p>
                          <div className="bg-white rounded-lg border border-emerald-200 p-1.5">
                            <img src={pod.signature_data} alt="Recipient signature" className="w-full h-16 object-contain" />
                          </div>
                        </div>
                      )}
                      {pod.photo_data && (
                        <div className="border-t border-emerald-200 pt-3">
                          <p className="text-xs text-emerald-500 mb-1.5 flex items-center gap-1">
                            <Camera size={11} /> Delivery Photo
                          </p>
                          <img src={pod.photo_data} alt="POD photo" className="w-full h-36 object-cover rounded-lg border border-emerald-200" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-slate-300 shrink-0" />
                      No proof of delivery on record for this shipment.
                    </div>
                  )}
                </div>
              )}

              {/* Tracking events */}
              {data.tracking_events?.length > 0 && (
                <Section title="Tracking History">
                  <div className="space-y-3">
                    {data.tracking_events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${i === data.tracking_events.length - 1 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          {i < data.tracking_events.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-slate-700">{ev.activity}</p>
                          {ev.details && <p className="text-xs text-slate-500">{ev.details}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ev.date} {ev.time} {ev.city && `• ${ev.city}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-slate-50 rounded-lg p-3">{children}</div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

// ── Payment status badge for table ────────────────────────────────────────────
function PayBadge({ status }) {
  const map = {
    paid            : 'text-emerald-700 bg-emerald-50',
    quoted          : 'text-blue-700 bg-blue-50',
    pending         : 'text-yellow-700 bg-yellow-50',
    credit_approved : 'text-teal-700 bg-teal-50',
  }
  const cls = map[status] || 'text-slate-500 bg-slate-50'
  return (
    <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {status === 'paid' ? '✓ paid' : status === 'credit_approved' ? 'credit' : status || '—'}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PartnerOrders() {
  const [shipments, setShipments] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAwb, setSelectedAwb]   = useState(null)
  const [sortCol, setSortCol]           = useState('created_at')
  const [sortDir, setSortDir]           = useState('desc')
  const [page, setPage]                 = useState(0)
  const PAGE_SIZE = 50

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit : PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      if (filterStatus) params.set('status', filterStatus)

      const res  = await fetch(`${API_BASE}/admin/shipments?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load shipments')
      setShipments(data.shipments || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, page])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  // Client-side search filter
  const filtered = shipments.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.awb?.toLowerCase().includes(q) ||
      s.hawb?.toLowerCase().includes(q) ||
      s.mawb?.toLowerCase().includes(q) ||
      s.partner_name?.toLowerCase().includes(q) ||
      s.partner_reference?.toLowerCase().includes(q) ||
      s.sender?.name?.toLowerCase().includes(q) ||
      s.receiver?.name?.toLowerCase().includes(q) ||
      s.receiver?.city?.toLowerCase().includes(q)
    )
  })

  // Client-side sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol] ?? ''
    let bv = b[sortCol] ?? ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronDown size={12} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  const statuses = ['Booked','Picked Up','In Transit','In Hub','Out for Delivery','Delivered','Delivery Failed','NDR','Return','Cancelled','Awaiting Payment']

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Partner Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Shipments submitted by marketplace vendors via the API —{' '}
            <span className="font-medium text-slate-700">{total} total</span>
          </p>
        </div>
        <button
          onClick={fetchShipments}
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Workflow guide */}
      <PartnerWorkflowGuide />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AWB, HAWB, MAWB, partner, receiver…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
            className="pl-7 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Globe size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No partner orders found</p>
            <p className="text-sm mt-1">Partner-booked shipments will appear here once received via the API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <Th onClick={() => toggleSort('awb')}>AWB / HAWB <SortIcon col="awb" /></Th>
                  <Th onClick={() => toggleSort('partner_name')}>Partner <SortIcon col="partner_name" /></Th>
                  <Th onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></Th>
                  <Th>Payment</Th>
                  <Th>Receiver</Th>
                  <Th onClick={() => toggleSort('created_at')}>Created <SortIcon col="created_at" /></Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map(s => (
                  <tr
                    key={s.awb}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAwb(s.awb)}
                  >
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div>
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {s.awb}
                          </span>
                        </div>
                        {s.hawb && s.hawb !== s.awb && (
                          <div className="text-xs text-slate-400 font-mono">
                            HAWB: {s.hawb}
                          </div>
                        )}
                        {s.mawb && (
                          <div className="text-xs text-slate-400 font-mono">
                            MAWB: {s.mawb}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-700">{s.partner_name}</span>
                          {s.partner_reference && (
                            <div className="text-xs text-slate-400">{s.partner_reference}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusChip status={s.status} />
                        {s.kyc_hold && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-semibold w-fit">
                            <ShieldAlert size={9} /> KYC Hold
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PayBadge status={s.payment_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium leading-tight">{s.receiver?.name}</div>
                      <div className="text-slate-400 text-xs">{s.receiver?.city}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString('en-ZM', {
                        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const step = PARTNER_PIPELINE.find(p => p.status === s.status)
                          if (step?.next) {
                            return (
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedAwb(s.awb) }}
                                className={`flex items-center gap-1 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${step.nextColor}`}
                                title={step.nextLabel}
                              >
                                <ArrowRightCircle size={12} />
                                {step.nextLabel}
                              </button>
                            )
                          }
                          return (
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedAwb(s.awb) }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                              title="View details"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedAwb && (
        <ShipmentDrawer awb={selectedAwb} onClose={() => setSelectedAwb(null)} />
      )}
    </div>
  )
}

// ── Helper table header cell ──────────────────────────────────────────────────
function Th({ children, onClick }) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${onClick ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  )
}
