/**
 * Ops Customers Page — /ops/customers
 *
 * Lists all consignee accounts auto-created from partner API shipments.
 * Ops staff can view customer details, shipment history, and wallet balance.
 * Supports manual status changes (activate / deactivate pending accounts).
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, RefreshCw, Package, Wallet,
  ChevronDown, ChevronRight, CheckCircle2, Clock,
  UserX, UserCheck, Phone, Mail, MapPin, ExternalLink,
  CreditCard, Loader2, AlertCircle, Plus,
} from 'lucide-react'

/* ── Status badge ─────────────────────────────────────────────────────────── */
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

/* ── Customer row with expandable shipments ───────────────────────────────── */
function CustomerRow({ customer, onStatusChange }) {
  const [expanded, setExpanded]       = useState(false)
  const [shipments, setShipments]     = useState(null)
  const [loadingShip, setLoadingShip] = useState(false)
  const [updating, setUpdating]       = useState(false)

  async function loadShipments() {
    if (shipments) return           // cached
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
        body   : JSON.stringify({
          name           : customer.name,
          phone          : customer.phone,
          email          : customer.email,
          city           : customer.city,
          country        : customer.country,
          account_status : newStatus,
          profile_complete: customer.profile_complete,
        }),
      })
      onStatusChange(customer.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

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

        {/* Wallet */}
        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
          ZMW {Number(customer.wallet_balance || 0).toFixed(2)}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={customer.account_status} />
        </td>

        {/* Created */}
        <td className="px-4 py-3 text-xs text-slate-500">
          {customer.created_at?.slice(0, 10) || '—'}
        </td>

        {/* Actions — stop propagation so row click doesn't fire */}
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

      {/* ── Expanded: shipment history ── */}
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-slate-50 border-b border-slate-100 px-6 py-4">
            {loadingShip ? (
              <div className="flex items-center gap-2 py-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading shipments…
              </div>
            ) : !shipments || shipments.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No shipments linked to this customer yet.</p>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Shipment History ({shipments.length})
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider">
                      <th className="text-left pb-2">AWB</th>
                      <th className="text-left pb-2">HAWB</th>
                      <th className="text-left pb-2">Status</th>
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
              </div>
            )}
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
  const total   = customers.length
  const pending = customers.filter(c => c.account_status === 'pending').length
  const active  = customers.filter(c => c.account_status === 'active').length
  const totalWallet = customers.reduce((s, c) => s + Number(c.wallet_balance || 0), 0)

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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Customers</p>
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Wallet Balance</p>
          <p className="text-2xl font-bold text-slate-800">ZMW {totalWallet.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
            <button
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
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
                Customers are auto-created when partners submit shipments via API
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
                  <th className="px-4 py-3 text-left">Wallet</th>
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
