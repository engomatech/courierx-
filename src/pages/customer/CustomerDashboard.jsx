import { Link, useNavigate } from 'react-router-dom'
import {
  Package, Truck, CheckCircle, Wallet, PackagePlus, Calculator,
  ArrowRight, Clock, MapPin, AlertTriangle, TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { STATUS_COLORS } from '../../utils'

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

export default function CustomerDashboard() {
  const user                   = useAuthStore((s) => s.user)
  const getCustomerShipments   = useCustomerStore((s) => s.getCustomerShipments)
  const getWallet               = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion    = useCustomerStore((s) => s.getProfileCompletion)
  const navigate                = useNavigate()

  const shipments  = getCustomerShipments(user?.id)
  const wallet     = getWallet(user?.id)
  const completion = getProfileCompletion(user?.id)

  const firstName     = user?.name?.split(' ')[0] || 'there'
  const totalCount    = shipments.length
  const inTransit     = shipments.filter((s) => !['Delivered', 'Non-Delivery'].includes(s.status)).length
  const delivered     = shipments.filter((s) => s.status === 'Delivered').length
  const recent        = shipments.slice(0, 5)

  const fmtBalance = (n) =>
    `ZK ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const stats = [
    {
      label: 'Total Shipments',
      value: totalCount,
      icon: Package,
      color: 'bg-violet-100 text-violet-600',
      sub: 'all time',
    },
    {
      label: 'In Transit',
      value: inTransit,
      icon: Truck,
      color: 'bg-amber-100 text-amber-600',
      sub: 'active',
    },
    {
      label: 'Delivered',
      value: delivered,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-600',
      sub: totalCount ? `${Math.round((delivered / totalCount) * 100)}% success` : '—',
    },
    {
      label: 'Wallet Balance',
      value: fmtBalance(wallet.balance),
      icon: Wallet,
      color: 'bg-blue-100 text-blue-600',
      sub: 'available funds',
      large: true,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Hello, {firstName} 👋
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Welcome to your Online Express dashboard. Manage shipments and track deliveries all in one place.
        </p>
      </div>

      {/* Profile incomplete alert */}
      {completion.overall < 100 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">Profile incomplete — {completion.overall}% done</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Complete your profile to book shipments and top up your wallet.
            </div>
          </div>
          <Link
            to="/portal/profile"
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors flex-shrink-0"
          >
            Complete <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub, large }) => (
          <div key={label} className="bg-white rounded-2xl border p-5 shadow-sm flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-medium mb-0.5">{label}</div>
              <div className={`font-extrabold text-slate-900 leading-tight ${large ? 'text-base' : 'text-2xl'}`}>
                {value}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/portal/shipments')}
            className="flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-4 transition-colors shadow-sm"
          >
            <PackagePlus size={20} className="flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Book a Shipment</div>
              <div className="text-xs text-violet-200 mt-0.5">Send a parcel or document</div>
            </div>
            <ArrowRight size={16} className="ml-auto" />
          </button>

          <button
            onClick={() => navigate('/portal/rate-calculator')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border text-slate-700 rounded-xl px-5 py-4 transition-colors shadow-sm"
          >
            <Calculator size={20} className="text-violet-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Check Rates</div>
              <div className="text-xs text-slate-400 mt-0.5">Get a shipping quote</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/portal/wallet')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border text-slate-700 rounded-xl px-5 py-4 transition-colors shadow-sm"
          >
            <TrendingUp size={20} className="text-emerald-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Top Up Wallet</div>
              <div className="text-xs text-slate-400 mt-0.5">Add funds to your account</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-400" />
          </button>
        </div>
      </div>

      {/* Recent shipments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Recent Shipments</h3>
          {totalCount > 0 && (
            <Link to="/portal/shipments" className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package size={26} className="text-slate-400" />
            </div>
            <div className="text-slate-700 font-semibold text-sm">No shipments yet</div>
            <div className="text-slate-400 text-xs mt-1 mb-4">Book your first shipment to get started.</div>
            <button
              onClick={() => navigate('/portal/shipments')}
              className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              <PackagePlus size={14} /> Book Shipment
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-3">AWB</div>
              <div className="col-span-3">Receiver</div>
              <div className="col-span-2 hidden sm:block">Origin</div>
              <div className="col-span-2 hidden sm:block">Date</div>
              <div className="col-span-4 sm:col-span-2 text-right">Status</div>
            </div>
            {recent.map((s, i) => (
              <div
                key={s.awb}
                className={`grid grid-cols-12 gap-3 items-center px-5 py-3.5 text-sm hover:bg-slate-50 transition-colors ${i < recent.length - 1 ? 'border-b' : ''}`}
              >
                <div className="col-span-3 font-mono text-xs font-bold text-violet-700 truncate">{s.awb}</div>
                <div className="col-span-3 text-xs text-slate-700 truncate">{s.receiver?.name}</div>
                <div className="col-span-2 hidden sm:flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} className="text-slate-400" />{s.sender?.city}
                </div>
                <div className="col-span-2 hidden sm:flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={10} />{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                </div>
                <div className="col-span-4 sm:col-span-2 flex justify-end">
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
