import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, SHIPMENT_STATUS } from '../utils'
import { Package, Truck, CheckCircle, AlertCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

const PIPELINE_STAGES = [
  { status: 'Booked',           label: 'Booked',        route: '/booking' },
  { status: 'PRS Assigned',     label: 'PRS',           route: '/prs' },
  { status: 'Out for Pickup',   label: 'Pickup',        route: '/prs' },
  { status: 'Picked Up',        label: 'Picked Up',     route: '/inbound-scan' },
  { status: 'Origin Scanned',   label: 'Origin Scanned',route: '/bags' },
  { status: 'Bagged',           label: 'Bagged',        route: '/bags' },
  { status: 'Manifested',       label: 'Manifested',    route: '/manifests' },
  { status: 'Hub Inbound',      label: 'Hub Inbound',   route: '/hub-inbound' },
  { status: 'DRS Assigned',     label: 'DRS',           route: '/drs' },
  { status: 'Out for Delivery', label: 'Out for Del.',  route: '/drs' },
  { status: 'Delivered',        label: 'Delivered',     route: '/delivery' },
  { status: 'Non-Delivery',     label: 'NDR',           route: '/delivery' },
]

export default function Dashboard() {
  const shipments = useStore((s) => s.shipments)
  const prs       = useStore((s) => s.prs)
  const bags       = useStore((s) => s.bags)
  const manifests  = useStore((s) => s.manifests)
  const drs        = useStore((s) => s.drs)
  const navigate   = useNavigate()

  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const inTransit = shipments.filter((s) =>
    !['Delivered', 'Non-Delivery', 'Booked'].includes(s.status)
  ).length
  const ndr       = shipments.filter((s) => s.status === 'Non-Delivery').length
  const booked    = shipments.filter((s) => s.status === 'Booked').length

  const byStatus = {}
  shipments.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1 })

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  const activePRS     = prs.filter((p)     => p.status !== 'Completed').length
  const openBags      = bags.filter((b)    => b.status === 'Open').length
  const inFlightMans  = manifests.filter((m) => m.status === 'Dispatched').length
  const activeDRS     = drs.filter((d)     => d.status === 'In Progress').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={total}     icon={Package}     color="bg-blue-500"    sub="All time" />
        <StatCard label="In Transit"      value={inTransit} icon={Truck}       color="bg-orange-500"  sub="Active pipeline" />
        <StatCard label="Delivered"       value={delivered} icon={CheckCircle} color="bg-emerald-500" sub={`${total > 0 ? Math.round((delivered/total)*100) : 0}% success rate`} />
        <StatCard label="NDR"             value={ndr}       icon={AlertCircle} color="bg-red-500"     sub="Needs rescheduling" />
      </div>

      {/* Operations summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active PRS',       value: activePRS,    color: 'text-orange-600', route: '/prs' },
          { label: 'Open Bags',        value: openBags,     color: 'text-indigo-600', route: '/bags' },
          { label: 'In-Flight Manif.', value: inFlightMans, color: 'text-cyan-600',   route: '/manifests' },
          { label: 'Active DRS',       value: activeDRS,    color: 'text-green-600',  route: '/drs' },
        ].map(({ label, value, color, route }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* Pipeline flow */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-500" />
          Pipeline Flow
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          {PIPELINE_STAGES.map(({ status, label, route }, i) => (
            <div key={status} className="flex items-center gap-1">
              <button
                onClick={() => navigate(route)}
                className="flex flex-col items-center bg-slate-50 hover:bg-blue-50 border rounded-lg px-3 py-2 transition-colors min-w-[72px]"
              >
                <span className="text-lg font-bold text-slate-800">{byStatus[status] || 0}</span>
                <span className="text-xs text-slate-500 text-center leading-tight mt-0.5">{label}</span>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
              )}
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
          <button
            onClick={() => navigate('/booking')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">AWB</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Receiver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Service</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.map((s) => (
                <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono font-medium text-blue-600">{s.awb}</td>
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
                      s.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
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
    </div>
  )
}
