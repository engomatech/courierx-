import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate } from '../utils'
import {
  Package, Truck, CheckCircle, AlertCircle, Clock, ArrowRight,
  Trash2, ClipboardList, Archive, Globe, MapPin, Zap, ChevronRight,
  AlertTriangle, Bell, TrendingUp, CalendarDays, PackageCheck,
  PackageX, Boxes, FileStack, ScanLine,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Greeting helper ────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Alert banner row ──────────────────────────────────────────────────────────
function AlertRow({ level, icon: Icon, label, count, hint, route }) {
  const navigate = useNavigate()
  const styles = {
    critical: { bar: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    text: 'text-red-800',    sub: 'text-red-500',    btn: 'bg-red-600 hover:bg-red-700'    },
    urgent:   { bar: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500',  text: 'text-amber-800',  sub: 'text-amber-500',  btn: 'bg-amber-500 hover:bg-amber-600' },
    warning:  { bar: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-500',   text: 'text-blue-800',   sub: 'text-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700'   },
    info:     { bar: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400',  text: 'text-slate-700',  sub: 'text-slate-400',  btn: 'bg-slate-600 hover:bg-slate-700' },
  }
  const s = styles[level] || styles.info
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${s.bar}`}>
      {level === 'critical' || level === 'urgent' ? (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.dot}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${s.dot}`} />
        </span>
      ) : (
        <span className={`inline-flex rounded-full h-2.5 w-2.5 shrink-0 ${s.dot}`} />
      )}
      <Icon size={15} className={s.text + ' shrink-0'} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-semibold ${s.text}`}>{count} {label}</span>
        <span className={`text-xs ml-2 ${s.sub}`}>{hint}</span>
      </div>
      <button
        onClick={() => navigate(route)}
        className={`flex items-center gap-1 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ${s.btn}`}
      >
        Action <ArrowRight size={11} />
      </button>
    </div>
  )
}

// ── Today stat mini card ───────────────────────────────────────────────────────
function TodayCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

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

// ── Stage pill ────────────────────────────────────────────────────────────────
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
      <span className="text-xs text-slate-500 text-center leading-tight mt-1 font-medium whitespace-pre-line">{label}</span>
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
      <div className={`px-4 py-3 ${hasAction ? bgColor : 'bg-slate-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasAction ? accentColor : 'bg-slate-200'}`}>
            <Icon size={16} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none">{phase}</p>
        </div>
        {hasAction && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentColor} text-white`}>{totalInPhase}</span>
        )}
      </div>

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

      <div className="px-4 pb-3 pt-0">
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

// ── Pipeline phases ────────────────────────────────────────────────────────────
const PHASES = [
  {
    phase: '1 · Booking & Confirmation', icon: ClipboardList,
    accentColor: 'bg-violet-600', borderColor: 'border-violet-200', bgColor: 'bg-violet-50',
    actionLabel: 'Go to Booking', actionRoute: '/ops/booking', actionUrgent: false,
    stages: [
      { status: 'Booked',    label: 'Awaiting\nConfirm', route: '/ops/booking', urgent: true  },
      { status: 'Confirmed', label: 'Confirmed',          route: '/ops/booking', urgent: false },
    ],
  },
  {
    phase: '2 · Collection', icon: Truck,
    accentColor: 'bg-orange-500', borderColor: 'border-orange-200', bgColor: 'bg-orange-50',
    actionLabel: 'Go to PRS / Inbound Scan', actionRoute: '/ops/prs', actionUrgent: false,
    stages: [
      { status: 'PRS Assigned',   label: 'PRS\nAssigned',   route: '/ops/prs',          urgent: false },
      { status: 'Out for Pickup', label: 'Out for\nPickup', route: '/ops/prs',          urgent: false },
      { status: 'Picked Up',      label: 'Picked\nUp',      route: '/ops/inbound-scan', urgent: false },
      { status: 'Origin Scanned', label: 'Origin\nScanned', route: '/ops/inbound-scan', urgent: false },
    ],
  },
  {
    phase: '3 · Bagging & Manifesting', icon: Archive,
    accentColor: 'bg-indigo-600', borderColor: 'border-indigo-200', bgColor: 'bg-indigo-50',
    actionLabel: 'Go to Bags & Manifests', actionRoute: '/ops/bags', actionUrgent: false,
    stages: [
      { status: 'Bagged',     label: 'Bagged',     route: '/ops/bags',      urgent: false },
      { status: 'Manifested', label: 'Manifested', route: '/ops/manifests', urgent: false },
    ],
  },
  {
    phase: '4 · Hub & Transit', icon: Globe,
    accentColor: 'bg-cyan-600', borderColor: 'border-cyan-200', bgColor: 'bg-cyan-50',
    actionLabel: 'Go to Hub Inbound', actionRoute: '/ops/hub-inbound', actionUrgent: false,
    stages: [
      { status: 'Hub Inbound', label: 'Hub\nInbound', route: '/ops/hub-inbound', urgent: false },
    ],
  },
  {
    phase: '5 · Last Mile Delivery', icon: MapPin,
    accentColor: 'bg-emerald-600', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50',
    actionLabel: 'Go to DRS / Delivery', actionRoute: '/ops/drs', actionUrgent: false,
    stages: [
      { status: 'DRS Assigned',    label: 'DRS\nAssigned',  route: '/ops/drs',      urgent: false },
      { status: 'Out for Delivery',label: 'Out for\nDel.',  route: '/ops/drs',      urgent: false },
      { status: 'Delivered',       label: 'Delivered',      route: '/ops/delivery', urgent: false },
      { status: 'Non-Delivery',    label: 'NDR',            route: '/ops/delivery', urgent: true  },
    ],
  },
]

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const shipments    = useStore((s) => s.shipments)
  const bags         = useStore((s) => s.bags)
  const manifests    = useStore((s) => s.manifests)
  const clearAllData = useStore((s) => s.clearAllData)
  const navigate     = useNavigate()
  const [detailAWB,    setDetailAWB]    = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // ── Aggregate counts ──────────────────────────────────────────────────────
  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const inTransit = shipments.filter((s) =>
    !['Delivered', 'Non-Delivery', 'Booked', 'Confirmed'].includes(s.status)
  ).length
  const ndr = shipments.filter((s) => s.status === 'Non-Delivery').length

  const byStatus = {}
  shipments.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1 })

  // ── Today's activity ──────────────────────────────────────────────────────
  const todayStr = new Date().toDateString()
  const isToday  = (d) => d && new Date(d).toDateString() === todayStr
  const todayBooked     = shipments.filter((s) => isToday(s.createdAt)).length
  const todayCollected  = shipments.filter((s) => isToday(s.pickedUpAt)).length
  const todayDelivered  = shipments.filter((s) => s.status === 'Delivered' && isToday(s.updatedAt || s.createdAt)).length
  const todayNDR        = shipments.filter((s) => s.status === 'Non-Delivery' && isToday(s.ndr?.attemptDate)).length

  // ── Urgency counts ────────────────────────────────────────────────────────
  const needsConfirmation   = byStatus['Booked']        || 0
  const awaitingDRS         = byStatus['Hub Inbound']   || 0
  const ndrCount            = byStatus['Non-Delivery']  || 0
  const openBags            = bags.filter((b) => b.status === 'Open').length
  const closedBags          = bags.filter((b) => b.status === 'Closed').length
  const dispatchedManifests = manifests.filter((m) => m.status === 'Dispatched').length
  const originScannedUnbagged = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId).length

  // ── Alert list — only items with count > 0 shown ──────────────────────────
  const ALERTS = [
    {
      level: 'critical', icon: AlertCircle, count: ndrCount,
      label: 'NDR shipment' + (ndrCount !== 1 ? 's' : '') + ' need rescheduling',
      hint: 'Failed deliveries — reschedule or return to sender',
      route: '/ops/delivery',
    },
    {
      level: 'urgent', icon: ClipboardList, count: needsConfirmation,
      label: 'booking' + (needsConfirmation !== 1 ? 's' : '') + ' awaiting confirmation',
      hint: 'Confirm to assign AWB and release to collection',
      route: '/ops/booking',
    },
    {
      level: 'urgent', icon: MapPin, count: awaitingDRS,
      label: 'hub inbound shipment' + (awaitingDRS !== 1 ? 's' : '') + ' awaiting DRS',
      hint: 'At hub — assign driver run to begin last mile delivery',
      route: '/ops/drs',
    },
    {
      level: 'warning', icon: Package, count: originScannedUnbagged,
      label: 'origin-scanned shipment' + (originScannedUnbagged !== 1 ? 's' : '') + ' not yet bagged',
      hint: 'Create or open a bag and add these shipments',
      route: '/ops/bags',
    },
    {
      level: 'warning', icon: Archive, count: closedBags,
      label: 'closed bag' + (closedBags !== 1 ? 's' : '') + ' ready to manifest',
      hint: 'Create a manifest and add these bags to dispatch',
      route: '/ops/manifests',
    },
    {
      level: 'info', icon: Truck, count: dispatchedManifests,
      label: 'manifest' + (dispatchedManifests !== 1 ? 's' : '') + ' in transit — awaiting hub arrival',
      hint: 'Scan bags at Hub Inbound to confirm receipt',
      route: '/ops/hub-inbound',
    },
    {
      level: 'info', icon: Boxes, count: openBags,
      label: 'open bag' + (openBags !== 1 ? 's' : '') + ' not yet closed',
      hint: 'Close bags when fully loaded before manifesting',
      route: '/ops/bags',
    },
  ].filter((a) => a.count > 0)

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  return (
    <div className="space-y-5">

      {/* Clear data confirmation */}
      {confirmClear && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-red-800">Clear all shipment data?</p>
            <p className="text-sm text-red-600 mt-0.5">This will permanently remove all shipments, PRS, bags, manifests, DRS, and exceptions.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-100">Cancel</button>
            <button onClick={() => { clearAllData(); setConfirmClear(false) }} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">Yes, Clear Everything</button>
          </div>
        </div>
      )}

      {/* ── Header greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting()}, Operations</h1>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={13} /> {todayLabel()}
          </p>
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} /> Purge Data
        </button>
      </div>

      {/* ── Today's activity ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <TrendingUp size={13} /> Today's Activity
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TodayCard icon={PackageCheck} label="Booked today"    value={todayBooked}    color="bg-violet-500" />
          <TodayCard icon={ScanLine}     label="Collected today" value={todayCollected} color="bg-orange-500" />
          <TodayCard icon={CheckCircle}  label="Delivered today" value={todayDelivered} color="bg-emerald-500" />
          <TodayCard icon={PackageX}     label="NDR today"       value={todayNDR}       color="bg-red-500" />
        </div>
      </div>

      {/* ── Attention alerts ─────────────────────────────────────────────────── */}
      {ALERTS.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Bell size={13} /> Needs Attention ({ALERTS.length} item{ALERTS.length !== 1 ? 's' : ''})
          </p>
          <div className="space-y-2">
            {ALERTS.map((a) => (
              <AlertRow key={a.label} {...a} />
            ))}
          </div>
        </div>
      )}

      {ALERTS.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">All clear — no items need your attention right now</p>
            <p className="text-sm text-emerald-600">The pipeline is flowing. Check back after the next collection run.</p>
          </div>
        </div>
      )}

      {/* ── Overall stats ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Package size={13} /> Overall Pipeline
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Shipments" value={total}     icon={Package}     color="bg-blue-500"    sub="All time" />
          <StatCard label="In Pipeline"     value={inTransit} icon={Truck}       color="bg-orange-500"  sub="Active stages" />
          <StatCard label="Delivered"       value={delivered} icon={CheckCircle} color="bg-emerald-500" sub={`${total > 0 ? Math.round((delivered/total)*100) : 0}% success rate`} />
          <StatCard label="NDR Backlog"     value={ndr}       icon={AlertCircle} color="bg-red-500"     sub="Awaiting reschedule" />
        </div>
      </div>

      {/* ── Parcel Journey Pipeline ──────────────────────────────────────────── */}
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

        <div className="px-5 py-3 border-t bg-slate-50 flex flex-wrap gap-x-6 gap-y-1">
          {[
            { color: 'bg-violet-600',  label: 'Booking & Confirmation' },
            { color: 'bg-orange-500',  label: 'Collection' },
            { color: 'bg-indigo-600',  label: 'Bagging & Manifesting' },
            { color: 'bg-cyan-600',    label: 'Hub & Transit' },
            { color: 'bg-emerald-600', label: 'Last Mile Delivery' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent shipments ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Recent Shipments
          </h2>
          <button onClick={() => navigate('/ops/booking')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
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
                      className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline text-left text-sm"
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
              {recentShipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No shipments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShipmentDetailDrawer awb={detailAWB} onClose={() => setDetailAWB(null)} />
    </div>
  )
}
