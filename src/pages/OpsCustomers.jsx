/**
 * Ops Customers Page — /ops/customers
 *
 * Lists all consignee accounts auto-created from partner API shipments.
 * Ops staff can view customer details, KYC status, shipment history, and wallet balance.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, RefreshCw,
  ChevronDown, ChevronRight, CheckCircle2,
  UserX, UserCheck, Phone, Mail, MapPin, ExternalLink,
  Loader2, AlertCircle, ShieldCheck, ShieldAlert,
  ShieldOff, FileText, Send, Eye, X, Check,
} from 'lucide-react'

/* ── Account status badge ─────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    active   : 'bg-emerald-100 text-emerald-700',
    pending  : 'bg-amber-100 text-amber-700',
    inactive : 'bg-slate-100 text-slate-500',
  }
  const labels = {
    active   : '● Active',
    pending  : '● Pending Setup',
    inactive : '● Inactive',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {labels[status] || status}
    </span>
  )
}

/* ── KYC status badge ─────────────────────────────────────────────────────── */
function KycBadge({ status }) {
  const cfg = {
    not_started : { cls: 'bg-slate-100 text-slate-500',   label: 'KYC Pending' },
    submitted   : { cls: 'bg-amber-100 text-amber-700',   label: '● KYC Submitted' },
    verified    : { cls: 'bg-emerald-100 text-emerald-700', label: '✓ KYC Verified' },
    rejected    : { cls: 'bg-red-100 text-red-600',       label: '✗ KYC Rejected' },
  }
  const { cls, label } = cfg[status] || cfg.not_started
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

/* ── Payment badge ────────────────────────────────────────────────────────── */
function PayBadge({ status }) {
  const map = {
    paid             : 'bg-emerald-100 text-emerald-700',
    pending          : 'bg-slate-100 text-slate-500',
    quoted           : 'bg-yellow-100 text-yellow-700',
    credit_approved  : 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {status?.replace('_', ' ') || '—'}
    </span>
  )
}

/* ── Mask national ID: show only last 4 chars ─────────────────────────────── */
function maskId(id) {
  if (!id) return '—'
  const visible = id.slice(-4)
  const stars   = '*'.repeat(Math.max(0, id.length - 4))
  return stars + visible
}

/* ── Customer row with expandable KYC + shipments ────────────────────────── */
function CustomerRow({ customer: initCustomer, onStatusChange }) {
  const [customer, setCustomer] = useState(initCustomer)
  const [expanded, setExpanded]       = useState(false)
  const [shipments, setShipments]     = useState(null)
  const [loadingShip, setLoadingShip] = useState(false)
  const [updating, setUpdating]       = useState(false)

  // KYC reject state
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason]       = useState('')
  const [kycWorking, setKycWorking]           = useState(false)
  const [kycMsg, setKycMsg]                   = useState(null) // { type: 'ok'|'err', text }

  // Update local customer when parent updates
  useEffect(() => { setCustomer(initCustomer) }, [initCustomer])

  async function loadShipments() {
    if (shipments) return
    setLoadingShip(true)
    try {
      const r = await fetch(`/api/v1/admin/customers/${customer.id}/shipments`)
      const d = await r.json()
      setShipments(d.shipments || [])
    } catch {
      setShipments([])
    } finally {
      setLoadingShip(false)
    }
  }

  function toggle() {
    const next = !expanded
    setExpanded(next)
    if (next) loadShipments()
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      await fetch(`/api/v1/admin/customers/${customer.id}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ account_status: newStatus }),
      })
      setCustomer(c => ({ ...c, account_status: newStatus }))
      onStatusChange(customer.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  async function handleKycVerify() {
    setKycWorking(true)
    setKycMsg(null)
    try {
      const r = await fetch(`/api/v1/admin/customers/${customer.id}/kyc/verify`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Verify failed')
      setCustomer(c => ({ ...c, kyc_status: 'verified', account_status: 'active', kyc_verified_at: new Date().toISOString() }))
      onStatusChange(customer.id, 'active')
      setKycMsg({ type: 'ok', text: 'KYC verified — customer is now active.' })
    } catch (e) {
      setKycMsg({ type: 'err', text: e.message })
    } finally {
      setKycWorking(false)
    }
  }

  async function handleKycReject() {
    if (!rejectReason.trim()) return
    setKycWorking(true)
    setKycMsg(null)
    try {
      const r = await fetch(`/api/v1/admin/customers/${customer.id}/kyc/reject`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ reason: rejectReason.trim() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Reject failed')
      setCustomer(c => ({ ...c, kyc_status: 'rejected', kyc_rejection_reason: rejectReason.trim() }))
      setShowRejectInput(false)
      setRejectReason('')
      setKycMsg({ type: 'ok', text: 'KYC rejected — customer has been notified.' })
    } catch (e) {
      setKycMsg({ type: 'err', text: e.message })
    } finally {
      setKycWorking(false)
    }
  }

  async function handleResendInvite() {
    setKycWorking(true)
    setKycMsg(null)
    try {
      const r = await fetch(`/api/v1/admin/customers/${customer.id}/kyc/resend-invite`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Resend failed')
      setKycMsg({ type: 'ok', text: `Invitation sent to ${customer.email}.` })
    } catch (e) {
      setKycMsg({ type: 'err', text: e.message })
    } finally {
      setKycWorking(false)
    }
  }

  const ks = customer.kyc_status || 'not_started'

  return (
    <>
      {/* ── Main row ── */}
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={toggle}
      >
        <td className="px-4 py-3 w-8">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </td>

        {/* Avatar + Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm
                            flex items-center justify-center shrink-0">
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{customer.name}</p>
              <p className="text-xs text-slate-400 font-mono">{customer.id}</p>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="px-4 py-3">
          <p className="text-sm text-slate-700 flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" />{customer.email || '—'}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />{customer.phone || '—'}
          </p>
        </td>

        {/* Location */}
        <td className="px-4 py-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
          </span>
        </td>

        {/* Source */}
        <td className="px-4 py-3">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            {customer.created_from || 'manual'}
          </span>
        </td>

        {/* KYC status */}
        <td className="px-4 py-3">
          <KycBadge status={ks} />
        </td>

        {/* Account status */}
        <td className="px-4 py-3">
          <StatusBadge status={customer.account_status} />
        </td>

        {/* Created */}
        <td className="px-4 py-3 text-xs text-slate-500">
          {customer.created_at?.slice(0, 10) || '—'}
        </td>

        {/* Actions */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {customer.account_status === 'pending' ? (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg
                         flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
              Activate
            </button>
          ) : customer.account_status === 'active' ? (
            <button
              onClick={() => handleStatusChange('inactive')}
              disabled={updating}
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-lg
                         flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg
                         flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
              Activate
            </button>
          )}
        </td>
      </tr>

      {/* ── Expanded panel ── */}
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-slate-50 border-b border-slate-100">
            <div className="px-6 py-4 space-y-5">

              {/* KYC section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ks === 'verified'    && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    {ks === 'submitted'   && <ShieldAlert  className="w-4 h-4 text-amber-500" />}
                    {ks === 'rejected'    && <ShieldOff    className="w-4 h-4 text-red-500" />}
                    {ks === 'not_started' && <ShieldOff    className="w-4 h-4 text-slate-400" />}
                    <p className="text-sm font-semibold text-slate-700">KYC / Identity Verification</p>
                    <KycBadge status={ks} />
                  </div>

                  {/* Resend invitation when not started */}
                  {ks === 'not_started' && customer.email && (
                    <button
                      onClick={handleResendInvite}
                      disabled={kycWorking}
                      className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700
                                 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {kycWorking
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Send className="w-3 h-3" />
                      }
                      Send Invitation
                    </button>
                  )}
                </div>

                {/* KYC details when submitted / verified / rejected */}
                {ks !== 'not_started' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Document Type</p>
                      <p className="text-slate-700 font-medium">{customer.kyc_document_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">National ID</p>
                      <p className="text-slate-700 font-mono">{maskId(customer.national_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
                      <p className="text-slate-700">{customer.date_of_birth || '—'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Physical Address</p>
                      <p className="text-slate-700">{customer.physical_address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Submitted</p>
                      <p className="text-slate-700">{customer.kyc_submitted_at?.slice(0,10) || '—'}</p>
                    </div>
                    {ks === 'verified' && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Verified</p>
                        <p className="text-emerald-600 font-medium">{customer.kyc_verified_at?.slice(0,10) || '—'}</p>
                      </div>
                    )}
                    {ks === 'rejected' && customer.kyc_rejection_reason && (
                      <div className="md:col-span-3">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Rejection Reason</p>
                        <p className="text-red-600">{customer.kyc_rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document + action buttons */}
                {ks !== 'not_started' && (
                  <div className="flex items-center flex-wrap gap-3 pt-1">
                    {/* View document */}
                    {customer.kyc_document_path && (
                      <a
                        href={`/api/v1/admin/customers/${customer.id}/kyc/document`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200
                                   text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View Document
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Verify + Reject buttons — only when submitted */}
                    {ks === 'submitted' && (
                      <>
                        <button
                          onClick={handleKycVerify}
                          disabled={kycWorking}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700
                                     text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {kycWorking
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ShieldCheck className="w-3 h-3" />
                          }
                          Verify KYC
                        </button>

                        {!showRejectInput ? (
                          <button
                            onClick={() => setShowRejectInput(true)}
                            disabled={kycWorking}
                            className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100
                                       text-red-600 border border-red-200 px-3 py-1.5 rounded-lg
                                       disabled:opacity-50 transition-colors"
                          >
                            <X className="w-3 h-3" /> Reject KYC
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 min-w-64">
                            <input
                              autoFocus
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Rejection reason (required)…"
                              className="flex-1 text-xs border border-red-300 rounded-lg px-3 py-1.5
                                         outline-none focus:ring-1 focus:ring-red-400 text-slate-700"
                            />
                            <button
                              onClick={handleKycReject}
                              disabled={kycWorking || !rejectReason.trim()}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5
                                         rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                              {kycWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Confirm
                            </button>
                            <button
                              onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Resend invite after rejection */}
                    {ks === 'rejected' && customer.email && (
                      <button
                        onClick={handleResendInvite}
                        disabled={kycWorking}
                        className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700
                                   text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {kycWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Re-send Invitation
                      </button>
                    )}
                  </div>
                )}

                {/* KYC status message */}
                {kycMsg && (
                  <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                    kycMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {kycMsg.type === 'ok'
                      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      : <AlertCircle  className="w-3.5 h-3.5 shrink-0" />
                    }
                    {kycMsg.text}
                  </div>
                )}
              </div>

              {/* Shipment history */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Shipment History
                </p>
                {loadingShip ? (
                  <div className="flex items-center gap-2 py-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading shipments…
                  </div>
                ) : !shipments || shipments.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No shipments linked to this customer yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wider">
                        <th className="text-left pb-2">AWB</th>
                        <th className="text-left pb-2">HAWB</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-left pb-2">KYC Hold</th>
                        <th className="text-left pb-2">Payment</th>
                        <th className="text-left pb-2">Amount</th>
                        <th className="text-left pb-2">Date</th>
                        <th className="text-left pb-2">Track</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shipments.map(s => (
                        <tr key={s.awb} className="hover:bg-white">
                          <td className="py-2 font-mono text-xs text-slate-700">{s.awb}</td>
                          <td className="py-2 font-mono text-xs text-slate-500">{s.hawb || '—'}</td>
                          <td className="py-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2">
                            {s.kyc_hold ? (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                ⚠ Held
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2"><PayBadge status={s.payment_status} /></td>
                          <td className="py-2 text-xs text-slate-600">
                            {s.payment_amount
                              ? `${s.payment_currency || 'ZMW'} ${Number(s.payment_amount).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="py-2 text-xs text-slate-500">{s.created_at?.slice(0, 10)}</td>
                          <td className="py-2">
                            <a
                              href={`/track/${s.hawb || s.awb}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1"
                            >
                              Track <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function OpsCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [search,    setSearch]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/v1/admin/customers')
      const d = await r.json()
      setCustomers(d.customers || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleStatusChange(id, newStatus) {
    setCustomers(prev =>
      prev.map(c => c.id === id ? { ...c, account_status: newStatus } : c)
    )
  }

  const q = search.toLowerCase()
  const filtered = customers.filter(c =>
    !q ||
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.id?.toLowerCase().includes(q) ||
    c.created_from?.toLowerCase().includes(q)
  )

  /* ── stats ── */
  const total        = customers.length
  const pending      = customers.filter(c => c.account_status === 'pending').length
  const active       = customers.filter(c => c.account_status === 'active').length
  const kycSubmitted = customers.filter(c => c.kyc_status === 'submitted').length
  const totalWallet  = customers.reduce((s, c) => s + Number(c.wallet_balance || 0), 0)

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Consignee accounts auto-created from partner API shipments
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200
                     hover:border-slate-300 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">● Pending Setup</p>
          <p className="text-3xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">● Active</p>
          <p className="text-3xl font-bold text-emerald-600">{active}</p>
        </div>
        <div className={`rounded-xl border p-4 ${kycSubmitted > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs uppercase tracking-wider mb-1 ${kycSubmitted > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {kycSubmitted > 0 ? '● KYC Submitted' : 'KYC Submitted'}
          </p>
          <p className={`text-3xl font-bold ${kycSubmitted > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {kycSubmitted}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wallet Balance</p>
          <p className="text-xl font-bold text-slate-800">ZMW {totalWallet.toFixed(2)}</p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, ID or source partner…"
            className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading customers…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 px-6 py-8 text-red-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
            {!search && (
              <p className="text-xs mt-1">
                Customers are auto-created when partners submit shipments via the API
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">KYC</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
