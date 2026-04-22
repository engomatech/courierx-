import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Truck, CheckCircle2, AlertTriangle, Clock, ArrowRight,
  ArrowUpRight, ArrowDownRight, CalendarDays, PackageCheck, PackageX,
  ScanLine, Inbox, Archive, MapPin, ClipboardList, Globe, ChevronRight,
} from 'lucide-react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate } from '../utils'
import { Card, CardHeader, CardBody, CardTitle, EmptyState } from '../components/ui'

// ── Date helpers ──────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Africa/Lusaka',
  })
}

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10)
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, delta, sub, icon: Icon, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'bg-slate-50 text-slate-600',
    brand:   'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
  }[tone]
  const deltaPositive = typeof delta === 'number' && delta >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1.5 leading-none tracking-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneClasses}`}>
          <Icon size={18} />
        </div>
      </div>
      {typeof delta === 'number' && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium">
          {deltaPositive ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-600">
              <ArrowUpRight size={13} />{Math.abs(delta)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-red-500">
              <ArrowDownRight size={13} />{Math.abs(delta)}%
            </span>
          )}
          <span className="text-slate-400">vs. previous 14 days</span>
        </div>
      )}
    </Card>
  )
}

// ── Trend chart — inline SVG, no extra dependency ─────────────────────────────
function TrendChart({ data }) {
  // data = [{ label, booked, delivered }]
  const W = 640
  const H = 220
  const PAD_L = 36
  const PAD_R = 16
  const PAD_T = 16
  const PAD_B = 32
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const yMax = Math.max(4, ...data.map((d) => Math.max(d.booked, d.delivered)))
  const niceMax = Math.ceil(yMax / 4) * 4
  const yTicks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax]

  const x = (i) => PAD_L + (data.length <= 1 ? 0 : (innerW * i) / (data.length - 1))
  const y = (v) => PAD_T + innerH - (v / niceMax) * innerH

  const buildPath = (key) => data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(d[key]).toFixed(2)}`)
    .join(' ')

  const areaPath = data.length
    ? `${buildPath('booked')} L ${x(data.length - 1).toFixed(2)} ${y(0).toFixed(2)} L ${x(0).toFixed(2)} ${y(0).toFixed(2)} Z`
    : ''

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]" aria-label="14-day booking and delivery trend">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" className="text-brand-500" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-brand-500" />
        </linearGradient>
      </defs>

      {/* Gridlines + y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray="2 4" />
          <text x={PAD_L - 8} y={y(t) + 3} textAnchor="end" className="fill-slate-400" fontSize="10">{t}</text>
        </g>
      ))}

      {/* Booked — filled area + line */}
      {data.length > 1 && (
        <>
          <path d={areaPath} fill="url(#trend-fill)" />
          <path d={buildPath('booked')} fill="none" className="stroke-brand-600" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={buildPath('delivered')} fill="none" className="stroke-emerald-500" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 4" />
        </>
      )}

      {/* X axis labels — sample every ~5 days for clarity */}
      {data.map((d, i) => (
        (i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0) && (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-slate-400" fontSize="10">{d.label}</text>
        )
      ))}
    </svg>
  )
}

// ── Pipeline phase pill — condensed horizontal strip ──────────────────────────
function PhasePill({ label, count, icon: Icon, route, active }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(route)}
      className={`flex-1 min-w-0 rounded-xl border px-3 py-3 text-left transition-all hover:shadow-soft-sm
        ${active
          ? 'bg-brand-50/70 border-brand-200 hover:border-brand-300'
          : 'bg-white border-slate-200 hover:border-slate-300'}`}
    >
      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
        <Icon size={13} className={active ? 'text-brand-600' : 'text-slate-400'} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-2xl font-semibold leading-none tracking-tight ${active ? 'text-brand-700' : 'text-slate-800'}`}>{count}</span>
        <span className="text-[11px] text-slate-400">parcels</span>
      </div>
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const shipments = useStore((s) => s.shipments)
  const bags      = useStore((s) => s.bags)
  const manifests = useStore((s) => s.manifests)
  const navigate  = useNavigate()
  const [detailAWB, setDetailAWB] = useState(null)

  // ── Aggregates ───────────────────────────────────────────────────────────
  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const inTransit = shipments.filter((s) =>
    !['Delivered', 'Non-Delivery', 'Booked', 'Confirmed'].includes(s.status)
  ).length
  const ndr = shipments.filter((s) => s.status === 'Non-Delivery').length

  const byStatus = useMemo(() => {
    const m = {}
    shipments.forEach((s) => { m[s.status] = (m[s.status] || 0) + 1 })
    return m
  }, [shipments])

  // ── 14-day trend ─────────────────────────────────────────────────────────
  const trend = useMemo(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push({
        key: dayKey(d),
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        booked: 0,
        delivered: 0,
      })
    }
    const idxByKey = Object.fromEntries(days.map((d, i) => [d.key, i]))
    shipments.forEach((s) => {
      const bookedKey = s.createdAt ? dayKey(s.createdAt) : null
      if (bookedKey && idxByKey[bookedKey] !== undefined) days[idxByKey[bookedKey]].booked += 1
      if (s.status === 'Delivered') {
        const delKey = dayKey(s.updatedAt || s.createdAt)
        if (idxByKey[delKey] !== undefined) days[idxByKey[delKey]].delivered += 1
      }
    })
    return days
  }, [shipments])

  const prevPeriodTotal = useMemo(() => {
    // rough compare: shipments older than 14d and within prior 14d
    const now = Date.now()
    const d14  = 14 * 24 * 60 * 60 * 1000
    const last = shipments.filter((s) => now - new Date(s.createdAt).getTime() < d14).length
    const prev = shipments.filter((s) => {
      const dt = now - new Date(s.createdAt).getTime()
      return dt >= d14 && dt < 2 * d14
    }).length
    if (prev === 0) return null
    return Math.round(((last - prev) / prev) * 100)
  }, [shipments])

  // ── Today ────────────────────────────────────────────────────────────────
  const todayStr = new Date().toDateString()
  const isToday  = (d) => d && new Date(d).toDateString() === todayStr
  const todayBooked    = shipments.filter((s) => isToday(s.createdAt)).length
  const todayCollected = shipments.filter((s) => isToday(s.pickedUpAt)).length
  const todayDelivered = shipments.filter((s) => s.status === 'Delivered' && isToday(s.updatedAt || s.createdAt)).length
  const todayNDR       = shipments.filter((s) => s.status === 'Non-Delivery' && isToday(s.ndr?.attemptDate)).length

  // ── Attention items ──────────────────────────────────────────────────────
  const needsConfirmation   = byStatus['Booked']      || 0
  const awaitingDRS         = byStatus['Hub Inbound'] || 0
  const ndrCount            = byStatus['Non-Delivery']|| 0
  const closedBags          = bags.filter((b) => b.status === 'Closed').length
  const originScannedUnbagged = shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId).length
  const dispatchedManifests = manifests.filter((m) => m.status === 'Dispatched').length

  const ATTENTION = [
    ndrCount               > 0 && { tone: 'red',    label: `${ndrCount} NDR parcel${ndrCount !== 1 ? 's' : ''} need rescheduling`,              route: '/ops/delivery' },
    needsConfirmation      > 0 && { tone: 'amber',  label: `${needsConfirmation} booking${needsConfirmation !== 1 ? 's' : ''} awaiting confirmation`, route: '/ops/booking' },
    awaitingDRS            > 0 && { tone: 'amber',  label: `${awaitingDRS} hub-inbound parcel${awaitingDRS !== 1 ? 's' : ''} awaiting DRS`,         route: '/ops/drs' },
    originScannedUnbagged  > 0 && { tone: 'brand',  label: `${originScannedUnbagged} scanned parcel${originScannedUnbagged !== 1 ? 's' : ''} not yet bagged`, route: '/ops/bags' },
    closedBags             > 0 && { tone: 'brand',  label: `${closedBags} closed bag${closedBags !== 1 ? 's' : ''} ready to manifest`,              route: '/ops/manifests' },
    dispatchedManifests    > 0 && { tone: 'slate',  label: `${dispatchedManifests} manifest${dispatchedManifests !== 1 ? 's' : ''} in transit`,      route: '/ops/hub-inbound' },
  ].filter(Boolean)

  const ATTENTION_STYLES = {
    red:    'bg-red-50 border-red-200 text-red-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    brand:  'bg-brand-50 border-brand-200 text-brand-700',
    slate:  'bg-slate-50 border-slate-200 text-slate-700',
  }

  // ── Pipeline strip ───────────────────────────────────────────────────────
  const pipeline = [
    { label: 'Booking',    icon: ClipboardList, route: '/ops/booking',      count: (byStatus['Booked'] || 0) + (byStatus['Confirmed'] || 0) },
    { label: 'Collection', icon: Truck,         route: '/ops/prs',          count: (byStatus['PRS Assigned'] || 0) + (byStatus['Out for Pickup'] || 0) + (byStatus['Picked Up'] || 0) + (byStatus['Origin Scanned'] || 0) },
    { label: 'Bagging',    icon: Archive,       route: '/ops/bags',         count: (byStatus['Bagged'] || 0) + (byStatus['Manifested'] || 0) },
    { label: 'In transit', icon: Globe,         route: '/ops/hub-inbound',  count: (byStatus['Hub Inbound'] || 0) },
    { label: 'Last mile',  icon: MapPin,        route: '/ops/drs',          count: (byStatus['DRS Assigned'] || 0) + (byStatus['Out for Delivery'] || 0) },
  ]
  const busiest = pipeline.reduce((max, p) => (p.count > (max?.count || 0) ? p : max), null)

  // ── Recent activity ──────────────────────────────────────────────────────
  const recent = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* ── Greeting row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{greeting()}, Operations</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400" /> {todayLabel()}
          </p>
        </div>
        <button
          onClick={() => navigate('/ops/booking')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-soft-sm transition-colors"
        >
          <Package size={15} /> New booking
        </button>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Total parcels"
          value={total.toLocaleString('en-GB')}
          sub="All time"
          delta={prevPeriodTotal}
          icon={Package}
          tone="brand"
        />
        <SummaryCard
          label="In pipeline"
          value={inTransit.toLocaleString('en-GB')}
          sub="Active through collection and delivery"
          icon={Truck}
          tone="amber"
        />
        <SummaryCard
          label="Delivered"
          value={delivered.toLocaleString('en-GB')}
          sub={`${total > 0 ? Math.round((delivered / total) * 100) : 0}% success rate`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <SummaryCard
          label="Needs attention"
          value={(ndrCount + needsConfirmation + awaitingDRS).toLocaleString('en-GB')}
          sub="NDRs, unconfirmed bookings, hub queue"
          icon={AlertTriangle}
          tone={ndrCount + needsConfirmation + awaitingDRS > 0 ? 'red' : 'neutral'}
        />
      </div>

      {/* ── Chart + attention column ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Bookings and deliveries</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Last 14 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Booked</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-0.5 bg-emerald-500 rounded-full" /> Delivered</span>
            </div>
          </CardHeader>
          <CardBody className="pt-2 pb-4">
            {total > 0 ? (
              <TrendChart data={trend} />
            ) : (
              <EmptyState
                title="No activity yet"
                hint="Book your first parcel to start seeing trends here."
                icon={Inbox}
                actionLabel="Create a booking"
                onAction={() => navigate('/ops/booking')}
              />
            )}
          </CardBody>
        </Card>

        <Card className="p-0 flex flex-col">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            {ATTENTION.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-400">{ATTENTION.length} item{ATTENTION.length !== 1 ? 's' : ''}</span>
            )}
          </CardHeader>
          <CardBody className="flex-1">
            {ATTENTION.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All clear</p>
                <p className="text-xs text-slate-400 mt-1">Nothing needs your attention right now.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {ATTENTION.map((a, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(a.route)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-[13px] font-medium transition-colors hover:shadow-soft-sm ${ATTENTION_STYLES[a.tone]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.tone === 'red' ? 'bg-red-500' : a.tone === 'amber' ? 'bg-amber-500' : a.tone === 'brand' ? 'bg-brand-500' : 'bg-slate-400'}`} />
                      <span className="flex-1 truncate">{a.label}</span>
                      <ChevronRight size={14} className="opacity-50 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Today strip ───────────────────────────────────────────────────── */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <span className="text-[11px] text-slate-400">Lusaka time</span>
        </CardHeader>
        <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
          {[
            { icon: PackageCheck, label: 'Booked',    value: todayBooked,    tone: 'text-brand-600'   },
            { icon: ScanLine,     label: 'Collected', value: todayCollected, tone: 'text-amber-600'   },
            { icon: CheckCircle2, label: 'Delivered', value: todayDelivered, tone: 'text-emerald-600' },
            { icon: PackageX,     label: 'NDR',       value: todayNDR,       tone: 'text-red-500'     },
          ].map(({ icon: Icon, label, value, tone }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${tone}`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900 leading-none">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ── Pipeline overview ─────────────────────────────────────────────── */}
      <Card className="p-0">
        <CardHeader>
          <div>
            <CardTitle>Pipeline overview</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Parcels currently sitting at each stage</p>
          </div>
          <button
            onClick={() => navigate('/ops/booking')}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {pipeline.map((p) => (
              <PhasePill key={p.label} {...p} active={busiest?.label === p.label && p.count > 0} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        <CardHeader>
          <CardTitle icon={Clock}>Recent parcels</CardTitle>
          <button
            onClick={() => navigate('/ops/booking')}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </CardHeader>
        {recent.length === 0 ? (
          <EmptyState
            title="No parcels yet"
            hint="Create your first booking and it will appear here."
            icon={Inbox}
            actionLabel="Create a booking"
            onAction={() => navigate('/ops/booking')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">AWB / HAWB</th>
                  <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">Sender</th>
                  <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">Receiver</th>
                  <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.hawb || s.awb} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDetailAWB(s.awb || s.hawb)}
                        className="font-mono font-medium text-brand-600 hover:text-brand-700 hover:underline text-left text-[13px]"
                      >
                        {s.hawb || s.awb}
                      </button>
                      {s.awb && s.hawb && (
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">AWB: {s.awb}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-[13px]">{s.sender.name}</div>
                      <div className="text-slate-400 text-[11px]">{s.sender.city}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-[13px]">{s.receiver.name}</div>
                      <div className="text-slate-400 text-[11px]">{s.receiver.city}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        s.serviceType === 'Express'       ? 'bg-amber-100 text-amber-700' :
                        s.serviceType === 'International' ? 'bg-brand-100 text-brand-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {s.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-[12px]">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ShipmentDetailDrawer awb={detailAWB} onClose={() => setDetailAWB(null)} />
    </div>
  )
}
