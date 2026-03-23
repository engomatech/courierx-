/**
 * CustomerDetailDrawer — full customer profile slide-in panel
 * Shows: profile info, KYC status, wallet, shipment stats, recent shipments
 *
 * Props:
 *   customer  : customer object from API
 *   onClose   : () => void
 */

import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MapPin, ShieldCheck, ShieldAlert, ShieldOff,
         Wallet, Package, CheckCircle2, AlertTriangle, Clock, TrendingUp,
         Calendar, Hash, Loader2, RefreshCw, ChevronRight } from 'lucide-react'
import { ShipmentDetailDrawer } from './ShipmentDetailDrawer'

function InfoRow({ label, value, mono, badge }) {
  if (!value && !badge) return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 shrink-0 mr-4 mt-0.5">{label}</span>
      {badge || <span className={`text-sm text-slate-800 font-medium text-right ${mono ? 'font-mono' : ''}`}>{value}</span>}
    </div>
  )
}

function KycSection({ ks }) {
  const cfgMap = {
    not_started: { icon: ShieldOff,   color: 'text-slate-400',   bg: 'bg-slate-50',   label: 'Not Started',   desc: 'Customer has not yet submitted KYC documents.' },
    submitted:   { icon: ShieldAlert,  color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Submitted',     desc: 'Documents submitted, pending review.' },
    verified:    { icon: ShieldCheck,  color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Verified ✓',    desc: 'Identity verified. Account is active.' },
    rejected:    { icon: ShieldAlert,  color: 'text-red-500',     bg: 'bg-red-50',     label: 'Rejected',      desc: 'Documents were rejected. Customer needs to resubmit.' },
  }
  const cfg = cfgMap[ks] || cfgMap.not_started
  const Icon = cfg.icon
  return (
    <div className={`rounded-xl p-4 ${cfg.bg} border`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} className={cfg.color} />
        <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="text-xs text-slate-500">{cfg.desc}</p>
    </div>
  )
}

export function CustomerDetailDrawer({ customer, onClose }) {
  const [shipments, setShipments] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeAWB, setActiveAWB] = useState(null)

  useEffect(() => {
    if (!customer) return
    setLoading(true)
    fetch(`/api/v1/admin/customers/${customer.id}/shipments`)
      .then(r => r.json())
      .then(d => setShipments(d.shipments || []))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false))
  }, [customer?.id])

  if (!customer) return null

  const ks = customer.kyc_status || 'not_started'

  // Shipment stats
  const total     = shipments?.length || 0
  const delivered = shipments?.filter(s => s.status === 'Delivered').length || 0
  const inTransit = shipments?.filter(s => !['Delivered', 'Non-Delivery', 'Cancelled'].includes(s.status)).length || 0
  const ndr       = shipments?.filter(s => s.status === 'Non-Delivery').length || 0

  const walletBal = customer.wallet_balance ?? 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-white shadow-2xl border-l">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-base shrink-0">
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-white text-base leading-none">{customer.name}</p>
              <p className="font-mono text-slate-400 text-xs mt-0.5">{customer.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Wallet ─────────────────────────────── */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="opacity-80" />
              <span className="text-sm opacity-80">Wallet Balance</span>
            </div>
            <p className="text-3xl font-bold">ZMW {Number(walletBal).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                customer.account_status === 'active'   ? 'bg-white/20 text-white' :
                customer.account_status === 'pending'  ? 'bg-amber-400/30 text-amber-100' :
                'bg-red-400/30 text-red-100'
              }`}>
                {customer.account_status || 'pending'}
              </span>
              <span className="text-xs opacity-60">Source: {customer.created_from || 'manual'}</span>
            </div>
          </div>

          {/* ── Shipment Stats ──────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: total,     color: 'bg-slate-50 border',           text: 'text-slate-800' },
              { label: 'Delivered', value: delivered, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
              { label: 'In Transit', value: inTransit,color: 'bg-blue-50 border-blue-100',       text: 'text-blue-700' },
              { label: 'NDR',      value: ndr,     color: 'bg-red-50 border-red-100',    text: 'text-red-600' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
                <p className={`text-xl font-bold ${text}`}>{loading ? '—' : value}</p>
                <p className={`text-xs mt-0.5 ${text} opacity-70`}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Profile ─────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profile</p>
            <div className="bg-white rounded-xl border p-4 space-y-0">
              <InfoRow label="Full Name"    value={customer.name} />
              <InfoRow label="Email"        value={customer.email} />
              <InfoRow label="Phone"        value={customer.phone} />
              <InfoRow label="City"         value={customer.city} />
              <InfoRow label="Country"      value={customer.country} />
              <InfoRow label="Customer ID"  value={customer.id} mono />
              <InfoRow label="Joined"       value={customer.created_at?.slice(0, 10)} />
              <InfoRow label="Source"       value={customer.created_from || 'manual'} />
            </div>
          </div>

          {/* ── KYC ─────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">KYC Status</p>
            <KycSection ks={ks} />
            {customer.kyc_verified_at && (
              <p className="text-xs text-slate-400 mt-2">Verified: {new Date(customer.kyc_verified_at).toLocaleDateString()}</p>
            )}
            {customer.kyc_rejection_reason && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
                Rejection reason: {customer.kyc_rejection_reason}
              </div>
            )}
          </div>

          {/* ── Recent Shipments ──────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Shipment History</p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-300" />
              </div>
            ) : shipments && shipments.length > 0 ? (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 text-left">
                      <th className="px-3 py-2 font-medium">AWB</th>
                      <th className="px-3 py-2 font-medium">From</th>
                      <th className="px-3 py-2 font-medium">To</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.slice(0, 20).map(s => (
                      <tr key={s.tracking_number || s.id} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setActiveAWB(s.tracking_number)}
                            className="font-mono text-violet-600 hover:text-violet-800 hover:underline text-xs"
                          >
                            {s.tracking_number}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{s.origin_city}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{s.destination_city}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{s.created_at?.slice(0, 10)}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shipments.length > 20 && (
                  <p className="text-xs text-slate-400 text-center py-2 border-t">+ {shipments.length - 20} more shipments</p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-6 text-center">
                <Package size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No shipments yet</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Nested AWB detail */}
      {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </>
  )
}
