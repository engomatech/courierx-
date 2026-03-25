/**
 * Admin Management Dashboard — /admin
 * Unified view: customers, operations pipeline, revenue, performance, activity.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store'
import { useAuthStore } from '../../../authStore'
import { useCustomerStore } from '../../../customerStore'
import {
  Users, Package, TrendingUp, Wallet, CheckCircle2, AlertTriangle,
  Truck, BarChart3, ArrowRight, Clock, Activity, UserPlus,
  PackageCheck, XCircle, Layers, ShieldCheck,
} from 'lucide-react'

// ── helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return `ZK ${Number(n || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function pct(a, b) {
  return b ? `${Math.round((a / b) * 100)}%` : '0%'
}
function fmtDT(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, color, linkTo }) {
  const inner = (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 ${linkTo ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500 font-medium mb-0.5">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      {linkTo && <ArrowRight size={15} className="text-slate-300 shrink-0 mt-1" />}
    </div>
  )
  return linkTo ? <Link to={linkTo}>{inner}</Link> : inner
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-slate-500" />
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
      {action}
    </div>
  )
}

// ── Mini progress bar ─────────────────────────────────────────────────────────
function MiniBar({ label, value, max, color, note }) {
  const p = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-slate-600 shrink-0 truncate">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
      <div className="w-16 text-xs text-right text-slate-700 shrink-0 font-medium">{note ?? value}</div>
    </div>
  )
}

// ── Stage pill ────────────────────────────────────────────────────────────────
const STAGE_COLORS = {
  'Booked':          'bg-blue-100 text-blue-700',
  'Confirmed':       'bg-sky-100 text-sky-700',
  'PRS Assigned':    'bg-yellow-100 text-yellow-700',
  'Out for Pickup':  'bg-orange-100 text-orange-700',
  'Picked Up':       'bg-amber-100 text-amber-700',
  'Origin Scanned':  'bg-purple-100 text-purple-700',
  'Bagged':          'bg-indigo-100 text-indigo-700',
  'Manifested':      'bg-cyan-100 text-cyan-700',
  'Hub Inbound':     'bg-teal-100 text-teal-700',
  'DRS Assigned':    'bg-lime-100 text-lime-700',
  'Out for Delivery':'bg-green-100 text-green-700',
  'Delivered':       'bg-emerald-100 text-emerald-700',
  'Non-Delivery':    'bg-red-100 text-red-700',
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const shipments    = useStore((s) => s.shipments)
  const prs          = useStore((s) => s.prs)
  const bags         = useStore((s) => s.bags)
  const manifests    = useStore((s) => s.manifests)
  const drs          = useStore((s) => s.drs)
  const activityLog  = useAuthStore((s) => s.activityLog || [])
  const users        = useAuthStore((s) => s.users)
  const getWallet    = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)

  // ── Customer metrics ──────────────────────────────────────────────────────
  const customers   = useMemo(() => users.filter((u) => u.role === 'customer'), [users])
  const opsUsers    = useMemo(() => users.filter((u) => u.role === 'operations'), [users])
  const activeCustomers  = customers.filter((u) => u.status === 'active')
  const pendingCustomers = customers.filter((u) => u.status === 'pending_verification')

  // New this month
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const newThisMonth = customers.filter((u) => u.createdAt && new Date(u.createdAt) >= thisMonth)

  // Total wallet balance across all customers
  const totalWalletBalance = useMemo(() =>
    customers.reduce((sum, u) => sum + (getWallet(u.id)?.balance || 0), 0),
    [customers]
  )

  // Profile completion distribution
  const profileStats = useMemo(() => {
    const comps = customers.map((u) => getProfileCompletion(u.id)?.overall || 0)
    const full     = comps.filter((c) => c === 100).length
    const partial  = comps.filter((c) => c > 0 && c < 100).length
    const empty    = comps.filter((c) => c === 0).length
    return { full, partial, empty }
  }, [customers])

  // ── Shipment metrics ──────────────────────────────────────────────────────
  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const ndr       = shipments.filter((s) => s.status === 'Non-Delivery').length
  const inPipeline = shipments.filter((s) => !['Delivered', 'Non-Delivery', 'Booked'].includes(s.status)).length

  // Revenue from actual courier cost (not goods value)
  const totalRevenue = useMemo(() =>
    shipments.reduce((acc, s) => acc + (parseFloat(s.cost) || 0), 0),
    [shipments]
  )

  // Wallet top-ups (from transaction history of all customers)
  const totalTopUps = useMemo(() =>
    customers.reduce((sum, u) => {
      const txs = getWallet(u.id)?.transactions || []
      return sum + txs.filter((t) => t.type === 'credit').reduce((a, t) => a + (t.amount || 0), 0)
    }, 0),
    [customers]
  )

  // ── Pipeline status breakdown ─────────────────────────────────────────────
  const byStatus = useMemo(() => {
    const map = {}
    shipments.forEach((s) => { map[s.status] = (map[s.status] || 0) + 1 })
    return map
  }, [shipments])

  const PIPELINE = [
    'Booked', 'Confirmed', 'PRS Assigned', 'Out for Pickup', 'Picked Up',
    'Bagged', 'Manifested', 'Hub Inbound', 'DRS Assigned', 'Out for Delivery',
  ]
  const activeInPipeline = PIPELINE.filter((s) => byStatus[s] > 0)

  // ── Service breakdown ─────────────────────────────────────────────────────
  const byService = useMemo(() => {
    const map = {}
    shipments.forEach((s) => { map[s.serviceType] = (map[s.serviceType] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [shipments])

  // ── NDR reasons ───────────────────────────────────────────────────────────
  const ndrReasons = useMemo(() => {
    const map = {}
    shipments.filter((s) => s.ndr?.reason).forEach((s) => { map[s.ndr.reason] = (map[s.ndr.reason] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [shipments])

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity = activityLog.slice(0, 8)

  const ACTION_META = {
    login:          { color: 'bg-blue-100 text-blue-700',     label: 'Sign In'       },
    user_created:   { color: 'bg-emerald-100 text-emerald-700', label: 'New User'    },
    user_updated:   { color: 'bg-amber-100 text-amber-700',   label: 'Updated'       },
    password_reset: { color: 'bg-violet-100 text-violet-700', label: 'Pwd Reset'     },
    status_changed: { color: 'bg-orange-100 text-orange-700', label: 'Status Change' },
  }

  return (
    <div className="space-y-8">

      {/* ── Top KPIs ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Management Overview</h2>
        <p className="text-sm text-slate-500 mb-5">Live snapshot across customers, operations and revenue.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Customers"   value={activeCustomers.length}
            sub={`${pendingCustomers.length} pending verification`}
            icon={Users} color="bg-violet-500" linkTo="/admin/users" />
          <KPI label="Total Shipments"   value={total}
            sub={`${inPipeline} active in pipeline`}
            icon={Package} color="bg-blue-500" />
          <KPI label="Courier Revenue"   value={fmt(totalRevenue)}
            sub="From actual courier charges"
            icon={TrendingUp} color="bg-emerald-500" />
          <KPI label="Wallet Balances"   value={fmt(totalWalletBalance)}
            sub={`${fmt(totalTopUps)} total topped up`}
            icon={Wallet} color="bg-amber-500" linkTo="/admin/users" />
        </div>
      </div>

      {/* ── Performance row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
          <div className="text-3xl font-extrabold text-emerald-600">{pct(delivered, total)}</div>
          <div className="text-sm font-medium text-slate-700 mt-1">Delivery Success Rate</div>
          <div className="text-xs text-slate-400 mt-0.5">{delivered} of {total} delivered</div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
          <div className="text-3xl font-extrabold text-red-500">{pct(ndr, total)}</div>
          <div className="text-sm font-medium text-slate-700 mt-1">NDR Rate</div>
          <div className="text-xs text-slate-400 mt-0.5">{ndr} non-deliveries</div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
          <div className="text-3xl font-extrabold text-blue-600">{inPipeline}</div>
          <div className="text-sm font-medium text-slate-700 mt-1">Active in Pipeline</div>
          <div className="text-xs text-slate-400 mt-0.5">Across all stages</div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
          <div className="text-3xl font-extrabold text-violet-600">{newThisMonth.length}</div>
          <div className="text-sm font-medium text-slate-700 mt-1">New Customers</div>
          <div className="text-xs text-slate-400 mt-0.5">This month</div>
        </div>
      </div>

      {/* ── Mid row: Pipeline + Customer Health ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active pipeline */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Section icon={Layers} title="Live Pipeline" sub="— shipments by current stage" />
          {activeInPipeline.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No active shipments in pipeline</div>
          ) : (
            <div className="space-y-2.5">
              {PIPELINE.map((stage) => {
                const count = byStatus[stage] || 0
                if (!count) return null
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STAGE_COLORS[stage] || 'bg-slate-100 text-slate-600'}`}>
                      {stage}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.round((count / inPipeline) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
                  </div>
                )
              })}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-slate-400">
                <span>Delivered: <span className="font-semibold text-emerald-600">{delivered}</span></span>
                <span>NDR: <span className="font-semibold text-red-500">{ndr}</span></span>
                <span>Total: <span className="font-semibold text-slate-700">{total}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Customer health */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Section icon={Users} title="Customer Health"
            action={<Link to="/admin/users" className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">Manage <ArrowRight size={11} /></Link>} />
          <div className="space-y-5">
            {/* Profile completion */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Profile Completion</div>
              <div className="space-y-2">
                <MiniBar label="Complete (100%)" value={profileStats.full}    max={customers.length} color="bg-emerald-500" />
                <MiniBar label="In Progress"     value={profileStats.partial} max={customers.length} color="bg-amber-400"  />
                <MiniBar label="Not Started"     value={profileStats.empty}   max={customers.length} color="bg-red-400"    />
              </div>
            </div>
            {/* Account status */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Status</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Active',   value: activeCustomers.length,  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Pending',  value: pendingCustomers.length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Inactive', value: customers.filter((u) => u.status === 'inactive').length, color: 'bg-red-50 text-red-600 border-red-100' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl border px-3 py-2 text-center ${color}`}>
                    <div className="text-xl font-extrabold">{value}</div>
                    <div className="text-xs font-medium mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Ops team */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations Team</div>
              <div className="flex items-center gap-2 flex-wrap">
                {opsUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">{u.initials}</div>
                    <span className="text-xs font-medium text-blue-700">{u.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                ))}
                {opsUsers.length === 0 && <span className="text-xs text-slate-400">No operations users</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Service breakdown + NDR reasons + Activity ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Service breakdown */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Section icon={BarChart3} title="By Service Type" />
          <div className="space-y-3">
            {byService.map(([svc, cnt]) => (
              <MiniBar key={svc} label={svc} value={cnt} max={total}
                color={svc === 'Express' ? 'bg-orange-500' : svc === 'International' ? 'bg-purple-500' : 'bg-blue-500'}
                note={`${cnt} (${pct(cnt, total)})`} />
            ))}
            {byService.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No shipments yet</p>}
          </div>
          {/* Ops resource counts */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
            {[
              { label: 'PRS Runs',   value: prs.length,       active: prs.filter((p) => p.status !== 'Completed').length },
              { label: 'Open Bags',  value: bags.length,      active: bags.filter((b) => b.status === 'Open').length },
              { label: 'Manifests',  value: manifests.length, active: manifests.filter((m) => m.status === 'Dispatched').length },
              { label: 'DRS Runs',   value: drs.length,       active: drs.filter((d) => d.status === 'In Progress').length },
            ].map(({ label, value, active }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-lg font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
                {active > 0 && <div className="text-xs text-violet-600 font-medium">{active} active</div>}
              </div>
            ))}
          </div>
        </div>

        {/* NDR reasons */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Section icon={XCircle} title="NDR Reasons" sub="— why deliveries failed" />
          {ndrReasons.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No NDRs recorded</p>
              <p className="text-xs text-slate-400 mt-0.5">Great delivery performance!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ndrReasons.map(([reason, cnt]) => (
                <MiniBar key={reason} label={reason} value={cnt} max={ndr} color="bg-red-400"
                  note={`${cnt}×`} />
              ))}
            </div>
          )}
          {/* Quick links */}
          <div className="mt-5 pt-4 border-t space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Links</div>
            {[
              { to: '/ops/finance',  label: 'Finance & Revenue', icon: TrendingUp   },
              { to: '/ops/reports',  label: 'Ops Reports',       icon: BarChart3    },
              { to: '/ops/delivery', label: 'Delivery / POD',    icon: PackageCheck },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-lg transition-colors">
                <Icon size={13} className="text-slate-400" />
                {label}
                <ArrowRight size={11} className="ml-auto text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Section icon={Activity} title="Recent Activity"
            action={<Link to="/admin/users" className="text-xs text-violet-600 hover:text-violet-800 font-medium">View all</Link>} />
          <div className="space-y-0 -mx-1">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No activity recorded yet</div>
            ) : (
              recentActivity.map((entry) => {
                const meta = ACTION_META[entry.action] || { color: 'bg-slate-100 text-slate-600', label: entry.action }
                return (
                  <div key={entry.id} className="flex items-start gap-2.5 px-1 py-2.5 border-b last:border-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${meta.color}`}>
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 truncate">{entry.details}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} /> {fmtDT(entry.at)}
                        {entry.performedBy && <span className="ml-1 text-slate-300">· {entry.performedBy}</span>}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
