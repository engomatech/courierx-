import { useStore } from '../store'
import { formatDateShort } from '../utils'
import { BarChart3, TrendingUp, Package, CheckCircle, XCircle, Truck, Clock } from 'lucide-react'

function MetricCard({ label, value, sub, color = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function Reports() {
  const shipments = useStore((s) => s.shipments)
  const prs       = useStore((s) => s.prs)
  const bags       = useStore((s) => s.bags)
  const manifests  = useStore((s) => s.manifests)
  const drs        = useStore((s) => s.drs)

  const total     = shipments.length
  const delivered = shipments.filter((s) => s.status === 'Delivered').length
  const ndr       = shipments.filter((s) => s.status === 'Non-Delivery').length
  const inTransit = shipments.filter((s) =>
    !['Delivered', 'Non-Delivery', 'Booked'].includes(s.status)
  ).length

  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0
  const ndrRate     = total > 0 ? Math.round((ndr / total) * 100) : 0

  // By service type
  const byService = {}
  shipments.forEach((s) => { byService[s.serviceType] = (byService[s.serviceType] || 0) + 1 })

  // By status
  const byStatus = {}
  shipments.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1 })

  // By city (top receivers)
  const byCity = {}
  shipments.forEach((s) => { byCity[s.receiver.city] = (byCity[s.receiver.city] || 0) + 1 })
  const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // NDR reasons
  const ndrByReason = {}
  shipments
    .filter((s) => s.ndr)
    .forEach((s) => { ndrByReason[s.ndr.reason] = (ndrByReason[s.ndr.reason] || 0) + 1 })
  const ndrReasons = Object.entries(ndrByReason).sort((a, b) => b[1] - a[1])

  // Recent activity timeline
  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const totalWeight = shipments.reduce((acc, s) => acc + (s.weight || 0), 0)
  const avgWeight   = total > 0 ? (totalWeight / total).toFixed(1) : 0

  const PIPELINE_STAGES = [
    'Booked', 'PRS Assigned', 'Out for Pickup', 'Picked Up',
    'Origin Scanned', 'Bagged', 'Manifested', 'Hub Inbound',
    'DRS Assigned', 'Out for Delivery', 'Delivered', 'Non-Delivery',
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Shipments"  value={total}          sub="All time" />
        <MetricCard label="Delivered"        value={delivered}      sub={`${successRate}% success rate`} color="text-emerald-600" />
        <MetricCard label="NDR"              value={ndr}            sub={`${ndrRate}% failure rate`}    color="text-red-600" />
        <MetricCard label="In Transit"       value={inTransit}      sub="Active in pipeline"            color="text-orange-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total PRS"         value={prs.length}       sub={`${prs.filter((p) => p.status !== 'Completed').length} active`} />
        <MetricCard label="Total Bags"        value={bags.length}      sub={`${bags.filter((b) => b.status === 'Open').length} open`} />
        <MetricCard label="Total Manifests"   value={manifests.length} sub={`${manifests.filter((m) => m.status === 'Dispatched').length} in transit`} />
        <MetricCard label="Total DRS"         value={drs.length}       sub={`${drs.filter((d) => d.status === 'In Progress').length} active`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Shipment Distribution by Stage
          </h2>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((s) => {
              const count = byStatus[s] || 0
              const colors = {
                'Delivered':       'bg-emerald-500',
                'Non-Delivery':    'bg-red-500',
                'Out for Delivery':'bg-green-500',
                'Hub Inbound':     'bg-teal-500',
                'Manifested':      'bg-cyan-500',
                'Bagged':          'bg-indigo-500',
                'Origin Scanned':  'bg-purple-500',
                'Picked Up':       'bg-amber-500',
                'Out for Pickup':  'bg-orange-500',
                'PRS Assigned':    'bg-yellow-500',
                'Booked':          'bg-blue-500',
                'DRS Assigned':    'bg-lime-500',
              }
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-36 shrink-0">{s}</span>
                  <div className="flex-1">
                    <ProgressBar value={count} max={total} color={colors[s] || 'bg-slate-400'} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Service type breakdown */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              Service Types
            </h3>
            <div className="space-y-3">
              {Object.entries(byService).map(([svc, cnt]) => (
                <div key={svc} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-24">{svc}</span>
                  <div className="flex-1">
                    <ProgressBar value={cnt} max={total}
                      color={svc === 'Express' ? 'bg-orange-500' : svc === 'International' ? 'bg-purple-500' : 'bg-slate-400'} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Weight Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Weight</p>
                <p className="text-xl font-bold text-slate-900">{totalWeight.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg per Shipment</p>
                <p className="text-xl font-bold text-slate-900">{avgWeight} kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top delivery cities */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Truck size={18} className="text-orange-500" />
            Top Delivery Cities
          </h3>
          <div className="space-y-3">
            {topCities.map(([city, cnt]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 flex-1">{city}</span>
                <ProgressBar value={cnt} max={total} color="bg-orange-400" />
                <span className="text-sm font-medium text-slate-600 w-6 text-right">{cnt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NDR reasons */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <XCircle size={18} className="text-red-500" />
            NDR Reasons
          </h3>
          {ndrReasons.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No NDRs recorded.</p>
          ) : (
            <div className="space-y-3">
              {ndrReasons.map(([reason, cnt]) => (
                <div key={reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{reason}</span>
                    <span className="font-medium">{cnt}</span>
                  </div>
                  <ProgressBar value={cnt} max={ndr || 1} color="bg-red-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent shipments */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Latest Bookings
          </h3>
          <div className="space-y-3">
            {recentShipments.map((s) => (
              <div key={s.awb} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-blue-600 font-medium">{s.awb}</p>
                  <p className="text-xs text-slate-500 truncate">{s.sender.city} → {s.receiver.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400">{formatDateShort(s.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full shipment log */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          <h2 className="font-semibold text-slate-900">Complete Shipment Log</h2>
          <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{total} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">AWB</th>
                <th className="px-4 py-3 font-medium">Origin</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody>
              {[...shipments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((s) => (
                <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-blue-600 text-xs">{s.awb}</td>
                  <td className="px-4 py-3 text-xs">{s.sender.city}, {s.sender.country}</td>
                  <td className="px-4 py-3 text-xs">{s.receiver.city}, {s.receiver.country}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      s.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
                      s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{s.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.weight} kg</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      s.status === 'Non-Delivery' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateShort(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
