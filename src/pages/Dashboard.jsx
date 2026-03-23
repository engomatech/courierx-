import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate } from '../utils'
import {
  Package, Truck, CheckCircle, AlertCircle, Clock, ArrowRight,
  Trash2, ClipboardList, Archive, Globe, MapPin, Zap, ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

// ── Individual stage pill inside a phase ──────────────────────────────────────
function StagePill({ label, count, urgent, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center px-3 py-2 rounded-xl border transition-all min-w-[76px]
        ${count > 0
          ? urgent
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50'
          : 'bg-slate-50 border-slate-100 opacity-60'
        }`}
    >
      {urgent && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
      <span className={`text-xl font-bold leading-none ${
        count > 0 ? (urgent ? 'text-red-700' : 'text-slate-800') : 'text-slate-300'
      }`}>
        {count}
      </span>
      <span className="text-xs text-slate-500 text-center leading-tight mt-1 font-medium">{label}</span>
    </button>
  )
}

// ── Phase card ────────────────────────────────────────────────────────────────
function PhaseCard({ phase, stages, byStatus, actionLabel, actionRoute, accentColor, borderColor, bgColor, icon: Icon, actionUrgent }) {
  const navigate   = useNavigate()
  const totalInPhase = stages.reduce((sum, s) => sum + (byStatus[s.status] || 0), 0)
  const hasAction  = totalInPhase > 0

  return (
    <div className={`relative rounded-2xl border-2 ${hasAction ? borderColor : 'border-slate-100'} bg-white shadow-sm overflow-hidden`}>
      {/* Phase header */}
      <div className={`px-4 py-3 ${hasAction ? bgColor : 'bg-slate-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasAction ? accentColor : 'bg-slate-200'}`}>
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none">{phase}</p>
          </div>
        </div>
        {hasAction && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentColor} text-white`}>{totalInPhase}</span>
        )}
      </div>

      {/* Stage pills */}
      <div className="px-3 py-3 flex flex-wrap gap-1.5 items-center">
        {stages.map((s, i) => (
          <div key={s.status} className="flex items-center gap-1">
            <StagePill
              label={s.label}
              count={byStatus[s.status] || 0}
              urgent={s.urgent}
              onClick={() => navigate(s.route)}
            />
            {i < stages.length - 1 && <ArrowRight size={11} className="text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Action footer */}
      <div className={`px-4 pb-3 pt-0`}>
        <button
          onClick={() => navigate(actionRoute)}
          className={`w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl transition-colors
            ${hasAction && actionUrgent
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : hasAction
              ? 'bg-slate-900 hover:bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-default'
            }`}
        >
          <span>{actionLabel}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Pipeline phases definition ─────────────────────────────────────────────────
const PHASES = [
  {
    phase:       '1 · Booking & Confirmation',
    icon:        ClipboardList,
    accentColor: 'bg-violet-600',
    borderColor: 'border-violet-200',
    bgColor:     'bg-violet-50',
    actionLabel: 'Go to Booking',
    actionRoute: '/ops/booking',
    actionUrgent: false,
    stages: [
      { status: 'Booked',     label: 'Awaiting\nConfirm', route: '/ops/booking', urgent: true  },
      { status: 'Confirmed',  label: 'Confirmed',          route: '/ops/booking', urgent: false },
    ],
  },
  {
    phase:       '2 · Collection',
    icon:        Truck,
    accentColor: 'bg-orange-500',
    borderColor: 'border-orange-200',
    bgColor:     'bg-orange-50',
    actionLabel: 'Go to PRS / Inbound Scan',
    actionRoute: '/ops/prs',
    actionUrgent: false,
    stages: [
      { status: 'PRS Assigned',   label: 'PRS\nAssigned',   route: '/ops/prs',          urgent: false },
      { status: 'Out for Pickup', label: 'Out for\nPickup', route: '/ops/prs',          urgent: false },
      { status: 'Picked Up',      label: 'Picked\nUp',      route: '/ops/inbound-scan', urgent: false },
      { status: 'Origin Scanned', label: 'Origin\nScanned', route: '/ops/inbound-scan', urgent: false },
    ],
  },
  {
    phase:       '3 · Bagging & Manifesting',
    icon:        Archive,
    accentColor: 'bg-indigo-600',
    borderColor: 'border-indigo-200',
    bgColor:     'bg-indigo-50',
    actionLabel: 'Go to Bags & Manifests',
    actionRoute: '/ops/bags',
    actionUrgent: false,
    stages: [
      { status: 'Bagged',     label: 'Bagged',    route: '/ops/bags',      urgent: false },
      { status: 'Manifested', label: 'Manifested', route: '/ops/manifests', urgent: false },
    ],
  },
  {
    phase:       '4 · Hub & Transit',
    icon:        Globe,
    accentColor: 'bg-cyan-600',
    borderColor: 'border-cyan-200',
    bgColor:     'bg-cyan-50',
    actionLabel: 'Go to Hub Inbound',
    actionRoute: '/ops/hub-inbound',
    actionUrgent: false,
    stages: [
      { status: 'Hub Inbound', label: 'Hub\nInbound', route: '/ops/hub-inbound', urgent: false },
    ],
  },
  {
    phase:       '5 · Last Mile Delivery',
    icon:        MapPin,
    accentColor: 'bg-emerald-600',
    borderColor: 'border-emerald-200',
    bgColor:     'bg-emerald-50',
    actionLabel: 'Go to DRS / Delivery',
    actionRoute: '/ops/drs',
    actionUrgent: false,
    stages: [
      { status: 'DRS Assigned',   label: 'DRS\nAssigned',   route: '/ops/drs',      urgent: false },
      { status: 'Out for Delivery', label: 'Out for\nDel.',  route: '/ops/drs',      urgent: false },
      { status: 'Delivered',      label: 'Delivered',        route: '/ops/delivery', urgent: false },
      { status: 'Non-Delivery',   label: 'NDR',              route: '/ops/delivery', urgent: true  },
    ],
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const shipments    = useStore((s) => s.shipments)
  const prs          = useStore((s) => s.prs)
  const bags         = useStore((s) => s.bags)
  const manifests    = useStore((s) => s.manifests)
  const drs          = useStore((s) => s.drs)
  const clearAllData = useStore((s) => s.clearAllData)
  const navigate     = useNavigate()
  const [detailAWB,    setDetailAWB]    = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const inTransit = shipments.filter((s) =>
    !['Delivered', 'Non-Delivery', 'Booked', 'Confirmed'].includes(s.status)
  ).length
  const ndr = shipments.filter((s) => s.status === 'Non-Delivery').length

  const byStatus = {}
  shipments.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1 })

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  // Derive urgency counts for quick-action cards
  const needsConfirmation = byStatus['Booked'] || 0
  const awaitingDRS       = byStatus['Hub Inbound'] || 0
  const ndrCount          = byStatus['Non-Delivery'] || 0
  const openBags          = bags.filter((b) => b.status === 'Open').length

  const QUICK_ACTIONS = [
    {
      label: 'Confirm Bookings',
      value: needsConfirmation,
      desc: 'Booked – awaiting AWB',
      color: needsConfirmation > 0 ? 'text-violet-700' : 'text-slate-400',
      bg: needsConfirmation > 0 ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-100',
      route: '/ops/booking',
      urgent: needsConfirmation > 0,
    },
    {
      label: 'Open Bags',
      value: openBags,
      desc: 'Not yet closed',
      color: openBags > 0 ? 'text-indigo-700' : 'text-slate-400',
      bg: openBags > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100',
      route: '/ops/bags',
      urgent: false,
    },
    {
      label: 'Assign DRS',
      value: awaitingDRS,
      desc: 'Hub inbound – needs routing',
      color: awaitingDRS > 0 ? 'text-cyan-700' : 'text-slate-400',
      bg: awaitingDRS > 0 ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-100',
      route: '/ops/drs',
      urgent: awaitingDRS > 0,
    },
    {
      label: 'Reschedule NDR',
      value: ndrCount,
      desc: 'Delivery failed',
      color: ndrCount > 0 ? 'text-red-700' : 'text-slate-400',
      bg: ndrCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100',
      route: '/ops/delivery',
      urgent: ndrCount > 0,
    },
  ]

  return (
    <div className="space-y-6">

      {/* Clear data confirmation banner */}
      {confirmClear && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-red-800">Clear all shipment data?</p>
            <p className="text-sm text-red-600 mt-0.5">This will permanently remove all shipments, PRS, bags, manifests, DRS, and exceptions. This cannot be undone.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-100">Cancel</button>
            <button onClick={() => { clearAllData(); setConfirmClear(false) }} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">Yes, Clear Everything</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={total}     icon={Package}     color="bg-blue-500"    sub="All time" />
        <StatCard label="In Pipeline"     value={inTransit} icon={Truck}       color="bg-orange-500"  sub="Active pipeline" />
        <StatCard label="Delivered"       value={delivered} icon={CheckCircle} color="bg-emerald-500" sub={`${total > 0 ? Math.round((delivered/total)*100) : 0}% success rate`} />
        <StatCard label="NDR"             value={ndr}       icon={AlertCircle} color="bg-red-500"     sub="Needs rescheduling" />
      </div>

      {/* Quick Actions row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, value, desc, color, bg, route, urgent }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className={`relative flex flex-col items-start p-4 rounded-xl border shadow-sm hover:shadow-md transition-all text-left ${bg}`}
          >
            {urgent && value > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <p className={`text-2xl font-extrabold leading-none ${color}`}>{value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      {/* ── Parcel Journey Pipeline ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Parcel Journey Pipeline</h2>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Click any stage to navigate · Pulsing dot = action required</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} /> Purge Data
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {PHASES.map((phase, idx) => (
            <div key={phase.phase} className="flex xl:flex-col items-stretch gap-2">
              <PhaseCard {...phase} byStatus={byStatus} />
              {idx < PHASES.length - 1 && (
                <div className="hidden xl:flex items-center justify-center text-slate-200">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Journey legend */}
        <div className="px-5 py-3 border-t bg-slate-50 flex flex-wrap gap-x-6 gap-y-1">
          {[
            { color: 'bg-violet-600', label: 'Booking & Confirmation' },
            { color: 'bg-orange-500', label: 'Collection' },
            { color: 'bg-indigo-600', label: 'Bagging & Manifesting' },
            { color: 'bg-cyan-600',   label: 'Hub & Transit' },
            { color: 'bg-emerald-600',label: 'Last Mile Delivery' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent shipments */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Recent Shipments
          </h2>
          <button onClick={() => navigate('/ops/booking')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">HAWB / AWB</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Receiver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Service</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.map((s) => (
                <tr key={s.hawb || s.awb} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setDetailAWB(s.awb || s.hawb)}
                      className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 text-left text-sm"
                    >
                      {s.hawb || s.awb}
                    </button>
                    {s.awb && s.hawb && (
                      <div className="text-slate-400 font-mono text-xs mt-0.5">AWB: {s.awb}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.sender.name}</div>
                    <div className="text-slate-400 text-xs">{s.sender.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.receiver.name}</div>
                    <div className="text-slate-400 text-xs">{s.receiver.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      s.serviceType === 'Express'       ? 'bg-orange-100 text-orange-700' :
                      s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {s.serviceType}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ShipmentDetailDrawer awb={detailAWB} onClose={() => setDetailAWB(null)} />
    </div>
  )
}
