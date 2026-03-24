import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package, Truck, CheckCircle, Wallet, PackagePlus, Calculator,
  ArrowRight, Clock, MapPin, AlertTriangle, TrendingUp,
  Search, X, PackageCheck, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { useStore } from '../../store'
import { STATUS_COLORS } from '../../utils'

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

// ── Quick Tracking Popup ──────────────────────────────────────────────────────
function QuickTrackModal({ onClose }) {
  const shipments = useStore((s) => s.shipments)
  const getCustomerShipments = useCustomerStore((s) => s.getCustomerShipments)
  const user = useAuthStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  const customerShipments = getCustomerShipments(user?.id)

  const handleSearch = () => {
    if (!query.trim()) return
    const q = query.trim().toUpperCase()
    // Search in both customer shipments and ops shipments
    const found =
      customerShipments.find((s) => (s.awb || '').toUpperCase() === q || (s.hawb || '').toUpperCase() === q) ||
      shipments.find((s) => (s.awb || '').toUpperCase() === q || (s.hawb || '').toUpperCase() === q)
    setResult(found || null)
    setSearched(true)
  }

  const STEPS = [
    { status: 'Booked',           label: 'Booked',           done: false },
    { status: 'Confirmed',        label: 'Confirmed',         done: false },
    { status: 'Out for Pickup',   label: 'Out for Pickup',    done: false },
    { status: 'Bagged',           label: 'At Origin Hub',     done: false },
    { status: 'Manifested',       label: 'In Transit',        done: false },
    { status: 'Hub Inbound',      label: 'At Destination Hub',done: false },
    { status: 'Out for Delivery', label: 'Out for Delivery',  done: false },
    { status: 'Delivered',        label: 'Delivered',         done: false },
  ]
  const ORDER = STEPS.map((s) => s.status)
  const currentIdx = result ? ORDER.indexOf(result.status) : -1

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-violet-600" />
            <h3 className="font-bold text-slate-900">Quick Tracking</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearched(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter AWB or tracking number…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Track
            </button>
          </div>
        </div>

        {/* Result */}
        {searched && (
          <div className="px-6 pb-6">
            {!result ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl">
                <Package size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No shipment found</p>
                <p className="text-xs text-slate-400 mt-1">Check the AWB number and try again.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-violet-500 font-medium">AWB / Tracking No.</div>
                    <div className="font-mono font-bold text-violet-900 text-sm">{result.awb || result.hawb}</div>
                  </div>
                  <StatusBadge status={result.status} />
                </div>

                {/* Shipment details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-400 mb-0.5">From</div>
                    <div className="font-semibold text-slate-700">{result.sender?.city || '—'}, {result.sender?.country || '—'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-400 mb-0.5">To</div>
                    <div className="font-semibold text-slate-700">{result.receiver?.city || '—'}, {result.receiver?.country || '—'}</div>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="space-y-1.5">
                  {STEPS.map((step, i) => {
                    const done    = i < currentIdx
                    const current = i === currentIdx
                    const pending = i > currentIdx
                    return (
                      <div key={step.status} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs
                        ${current ? 'bg-violet-50 border border-violet-200' : done ? 'opacity-60' : 'opacity-30'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                          ${current ? 'bg-violet-600' : done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          {done ? <CheckCircle size={11} className="text-white" /> :
                           current ? <div className="w-2 h-2 bg-white rounded-full" /> :
                           <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                        </div>
                        <span className={`font-medium ${current ? 'text-violet-900' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        {current && <span className="ml-auto text-violet-500 font-semibold">Current</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const user                   = useAuthStore((s) => s.user)
  const getCustomerShipments   = useCustomerStore((s) => s.getCustomerShipments)
  const getWallet              = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion   = useCustomerStore((s) => s.getProfileCompletion)
  const navigate               = useNavigate()

  const [activeTab,    setActiveTab]    = useState('recent')
  const [trackOpen,    setTrackOpen]    = useState(false)

  const shipments  = getCustomerShipments(user?.id)
  const wallet     = getWallet(user?.id)
  const completion = getProfileCompletion(user?.id)

  const firstName  = user?.name?.split(' ')[0] || 'there'
  const totalCount = shipments.length
  const inTransit  = shipments.filter((s) => !['Delivered', 'Non-Delivery'].includes(s.status)).length
  const delivered  = shipments.filter((s) => s.status === 'Delivered').length
  const readyForCollection = shipments.filter((s) => s.status === 'Hub Inbound')

  const fmtBalance = (n) =>
    `ZK ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const stats = [
    { label: 'Total Parcels',   value: totalCount,           icon: Package,      color: 'bg-violet-100 text-violet-600', sub: 'all time' },
    { label: 'In Transit',      value: inTransit,            icon: Truck,        color: 'bg-amber-100 text-amber-600',   sub: 'active' },
    { label: 'Delivered',       value: delivered,            icon: CheckCircle,  color: 'bg-emerald-100 text-emerald-600',
      sub: totalCount ? `${Math.round((delivered / totalCount) * 100)}% success` : '—' },
    { label: 'Wallet Balance',  value: fmtBalance(wallet.balance), icon: Wallet, color: 'bg-blue-100 text-blue-600',    sub: 'available funds', large: true },
  ]

  const TABS = [
    { id: 'recent',       label: 'Recent Parcels' },
    { id: 'collection',   label: 'Ready for Collection', count: readyForCollection.length },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hello, {firstName} 👋</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Welcome to your Online Express dashboard. Manage parcels and track deliveries all in one place.
          </p>
        </div>
        {/* Quick Tracking button */}
        <button
          onClick={() => setTrackOpen(true)}
          className="flex items-center gap-2 bg-white border border-violet-200 hover:bg-violet-50 text-violet-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Search size={16} /> Quick Tracking
        </button>
      </div>

      {/* Profile incomplete alert */}
      {completion.overall < 100 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">Profile incomplete — {completion.overall}% done</div>
            <div className="text-xs text-amber-700 mt-0.5">Complete your profile to book shipments and top up your wallet.</div>
          </div>
          <Link to="/portal/profile" className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900 flex-shrink-0">
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
              <div className={`font-extrabold text-slate-900 leading-tight ${large ? 'text-base' : 'text-2xl'}`}>{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate('/portal/shipments')}
            className="flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-4 transition-colors shadow-sm">
            <PackagePlus size={20} className="flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Book a Shipment</div>
              <div className="text-xs text-violet-200 mt-0.5">Send a parcel or document</div>
            </div>
            <ArrowRight size={16} className="ml-auto" />
          </button>
          <button onClick={() => navigate('/portal/rate-calculator')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border text-slate-700 rounded-xl px-5 py-4 transition-colors shadow-sm">
            <Calculator size={20} className="text-violet-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Check Rates</div>
              <div className="text-xs text-slate-400 mt-0.5">Get a shipping quote</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-400" />
          </button>
          <button onClick={() => navigate('/portal/wallet')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border text-slate-700 rounded-xl px-5 py-4 transition-colors shadow-sm">
            <TrendingUp size={20} className="text-emerald-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Top Up Wallet</div>
              <div className="text-xs text-slate-400 mt-0.5">Add funds to your account</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tabs: Recent Parcels | Ready for Collection */}
      <div>
        <div className="flex items-center gap-1 mb-4 border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${activeTab === t.id
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${activeTab === t.id ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
          {activeTab === 'recent' && totalCount > 0 && (
            <Link to="/portal/shipments" className="ml-auto text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 pb-2">
              View all <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {/* Recent Parcels tab */}
        {activeTab === 'recent' && (
          shipments.slice(0, 5).length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package size={26} className="text-slate-400" />
              </div>
              <div className="text-slate-700 font-semibold text-sm">No parcels yet</div>
              <div className="text-slate-400 text-xs mt-1 mb-4">Book your first shipment to get started.</div>
              <button onClick={() => navigate('/portal/shipments')}
                className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
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
              {shipments.slice(0, 5).map((s, i) => (
                <div key={s.awb}
                  className={`grid grid-cols-12 gap-3 items-center px-5 py-3.5 text-sm hover:bg-slate-50 transition-colors ${i < Math.min(shipments.length, 5) - 1 ? 'border-b' : ''}`}>
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
          )
        )}

        {/* Ready for Collection tab */}
        {activeTab === 'collection' && (
          readyForCollection.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <PackageCheck size={26} className="text-emerald-400" />
              </div>
              <div className="text-slate-700 font-semibold text-sm">No parcels ready for collection</div>
              <div className="text-slate-400 text-xs mt-1">
                When a parcel arrives at your nearest hub it will appear here.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                <p className="text-xs font-semibold text-emerald-800">
                  {readyForCollection.length} parcel{readyForCollection.length > 1 ? 's' : ''} ready — please bring valid ID when collecting
                </p>
              </div>
              {readyForCollection.map((s, i) => (
                <div key={s.awb}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < readyForCollection.length - 1 ? 'border-b' : ''}`}>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PackageCheck size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-violet-700 text-sm">{s.awb}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.description || 'No description'} · {s.weight ? `${s.weight} kg` : ''}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      From: {s.sender?.city}, {s.sender?.country}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={s.status} />
                    {s.createdAt && (
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Quick Tracking modal */}
      {trackOpen && <QuickTrackModal onClose={() => setTrackOpen(false)} />}
    </div>
  )
}
