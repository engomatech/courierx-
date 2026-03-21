/**
 * Discrepancies — Manifest discrepancy management page
 *
 * Shows all flagged discrepancies (missing bags, unexpected bags,
 * unexpected shipments, missing shipments) across all inbound sessions.
 * Ops staff and supervisors can filter, review, and resolve from here.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { useAuthStore } from '../authStore'
import { Modal } from '../components/Modal'
import { formatDate } from '../utils'
import {
  AlertTriangle, CheckCircle, ShieldCheck, Archive,
  Package, HelpCircle, Filter, Search, X, ClipboardCheck,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const DISC_RESOLUTIONS = [
  'Found & processed',
  'Will arrive on next vehicle',
  'Short-shipped by origin hub',
  'Damaged in transit',
  'Returned to sender',
  'Duplicate scan — already processed',
  'Other',
]

const TYPE_META = {
  missing_bag        : { label: 'Missing Bag',        color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   badgeBg: 'bg-red-100 text-red-700',   icon: Archive },
  unexpected_bag     : { label: 'Unexpected Bag',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', badgeBg: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  unexpected_shipment: { label: 'Unexpected Shipment',color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', badgeBg: 'bg-amber-100 text-amber-700', icon: Package },
  missing_shipment   : { label: 'Missing Shipment',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   badgeBg: 'bg-red-100 text-red-700',   icon: Package },
}

// ── Resolve Modal ─────────────────────────────────────────────────────────────

function ResolveModal({ disc, onClose }) {
  const resolveDiscrepancy = useStore((s) => s.resolveDiscrepancy)
  const user               = useAuthStore((s) => s.user)
  const [resolution, setResolution] = useState(DISC_RESOLUTIONS[0])
  const [notes, setNotes]           = useState(disc.notes || '')

  const meta = TYPE_META[disc.type] || {}
  const Icon = meta.icon || HelpCircle

  const handleSubmit = (e) => {
    e.preventDefault()
    resolveDiscrepancy(disc.id, resolution, notes, user?.name || 'Ops')
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Resolve Discrepancy">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Discrepancy summary card */}
        <div className={`rounded-lg p-3 border ${meta.border || 'border-slate-200'} ${meta.bg || 'bg-slate-50'}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${meta.color || 'text-slate-700'}`}>
            <Icon size={15} />
            {meta.label || disc.type}
          </div>
          <div className="space-y-1">
            {disc.bagId      && <p className="text-xs text-slate-600">Bag: <span className="font-mono font-medium">{disc.bagId}</span></p>}
            {disc.awb        && <p className="text-xs text-slate-600">AWB: <span className="font-mono font-medium">{disc.awb}</span></p>}
            {disc.manifestId && <p className="text-xs text-slate-600">Manifest: <span className="font-mono">{disc.manifestId}</span></p>}
            <p className="text-xs text-slate-400 mt-1">Detected: {formatDate(disc.detectedAt)}</p>
          </div>
        </div>

        {/* Notes (editable — can update the original note) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details about this discrepancy…"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Resolution *</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {DISC_RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit"
            className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <ShieldCheck size={15} />
            Mark Resolved
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Discrepancy row ───────────────────────────────────────────────────────────

function DiscRow({ disc, onResolve }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[disc.type] || {}
  const Icon = meta.icon || HelpCircle
  const isOpen = disc.status === 'open'

  return (
    <div className={`border rounded-xl overflow-hidden ${isOpen ? 'border-red-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Type icon */}
        <div className={`p-2 rounded-lg shrink-0 ${meta.bg || 'bg-slate-100'}`}>
          <Icon size={15} className={meta.color || 'text-slate-500'} />
        </div>

        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeBg || 'bg-slate-100 text-slate-700'}`}>
              {meta.label || disc.type}
            </span>
            {disc.bagId      && <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{disc.bagId}</span>}
            {disc.awb        && <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{disc.awb}</span>}
            {disc.manifestId && <span className="font-mono text-xs text-slate-500">via {disc.manifestId}</span>}
          </div>
          <p className="text-xs text-slate-400 truncate">{disc.notes}</p>
        </div>

        {/* Time */}
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
            <Clock size={11} />
            {formatDate(disc.detectedAt)}
          </p>
          {!isOpen && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 justify-end mt-0.5">
              <CheckCircle size={11} />
              Resolved
            </p>
          )}
        </div>

        {/* Resolve button / chevron */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <button
              onClick={() => onResolve(disc)}
              className="text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              Resolve
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t px-5 py-4 text-xs space-y-2 ${isOpen ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-slate-400 mb-0.5">Discrepancy ID</p>
              <p className="font-mono font-medium text-slate-700">{disc.id}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Detected at</p>
              <p className="text-slate-700">{new Date(disc.detectedAt).toLocaleString('en-ZM', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}</p>
            </div>
            {disc.bagId && (
              <div>
                <p className="text-slate-400 mb-0.5">Bag ID</p>
                <p className="font-mono font-medium text-slate-700">{disc.bagId}</p>
              </div>
            )}
            {disc.awb && (
              <div>
                <p className="text-slate-400 mb-0.5">AWB</p>
                <p className="font-mono font-medium text-slate-700">{disc.awb}</p>
              </div>
            )}
            {disc.manifestId && (
              <div>
                <p className="text-slate-400 mb-0.5">Manifest</p>
                <p className="font-mono font-medium text-slate-700">{disc.manifestId}</p>
              </div>
            )}
          </div>

          {disc.notes && (
            <div>
              <p className="text-slate-400 mb-0.5">Notes</p>
              <p className="text-slate-700">{disc.notes}</p>
            </div>
          )}

          {!isOpen && (
            <div className="border-t border-slate-200 pt-3 mt-3 bg-emerald-50 -mx-5 -mb-4 px-5 pb-4 rounded-b-xl">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-2">
                <ShieldCheck size={13} />
                Resolution
              </div>
              <p className="text-emerald-800 font-medium">{disc.resolution}</p>
              <p className="text-emerald-600 mt-0.5">
                Resolved by <strong>{disc.resolvedBy}</strong> · {new Date(disc.resolvedAt).toLocaleString('en-ZM', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-slate-800', onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 text-left w-full transition-all ${
        active ? 'ring-2 ring-teal-500 border-teal-300' : 'hover:shadow-md'
      }`}
    >
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Discrepancies() {
  const discrepancies = useStore((s) => s.discrepancies)

  const [statusFilter, setStatusFilter] = useState('open')   // 'all' | 'open' | 'resolved'
  const [typeFilter,   setTypeFilter]   = useState('')        // '' = all types
  const [search,       setSearch]       = useState('')
  const [resolving,    setResolving]    = useState(null)

  // ── Computed stats ────────────────────────────────────────────────────────
  const openDiscs     = discrepancies.filter((d) => d.status === 'open')
  const resolvedDiscs = discrepancies.filter((d) => d.status === 'resolved')

  const byType = useMemo(() => {
    const counts = {}
    openDiscs.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1 })
    return counts
  }, [openDiscs])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...discrepancies].sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))

    if (statusFilter === 'open')     list = list.filter((d) => d.status === 'open')
    if (statusFilter === 'resolved') list = list.filter((d) => d.status === 'resolved')
    if (typeFilter)                  list = list.filter((d) => d.type === typeFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) =>
        d.id?.toLowerCase().includes(q)          ||
        d.bagId?.toLowerCase().includes(q)       ||
        d.awb?.toLowerCase().includes(q)         ||
        d.manifestId?.toLowerCase().includes(q)  ||
        d.notes?.toLowerCase().includes(q)       ||
        d.resolution?.toLowerCase().includes(q)
      )
    }

    return list
  }, [discrepancies, statusFilter, typeFilter, search])

  const typeOptions = Object.entries(TYPE_META).map(([key, m]) => ({ key, label: m.label }))

  return (
    <div className="space-y-5">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Open Discrepancies"
          value={openDiscs.length}
          sub={openDiscs.length > 0 ? 'Requires action' : 'All clear'}
          color={openDiscs.length > 0 ? 'text-red-600' : 'text-emerald-600'}
          onClick={() => setStatusFilter('open')}
          active={statusFilter === 'open'}
        />
        <StatCard
          label="Missing Bags"
          value={byType.missing_bag || 0}
          color={(byType.missing_bag || 0) > 0 ? 'text-red-600' : 'text-slate-400'}
          onClick={() => { setStatusFilter('open'); setTypeFilter(typeFilter === 'missing_bag' ? '' : 'missing_bag') }}
          active={typeFilter === 'missing_bag'}
        />
        <StatCard
          label="Unexpected Items"
          value={(byType.unexpected_bag || 0) + (byType.unexpected_shipment || 0)}
          color={((byType.unexpected_bag || 0) + (byType.unexpected_shipment || 0)) > 0 ? 'text-amber-600' : 'text-slate-400'}
          onClick={() => { setStatusFilter('open'); setTypeFilter('') }}
          active={false}
        />
        <StatCard
          label="Resolved"
          value={resolvedDiscs.length}
          color="text-emerald-600"
          onClick={() => setStatusFilter('resolved')}
          active={statusFilter === 'resolved'}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {[
            { v: 'open',     label: `Open (${openDiscs.length})` },
            { v: 'resolved', label: `Resolved (${resolvedDiscs.length})` },
            { v: 'all',      label: 'All' },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-4 py-2 transition-colors whitespace-nowrap ${
                statusFilter === v ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-7 pr-7 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
          >
            <option value="">All types</option>
            {typeOptions.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AWB, bag, manifest…"
            className="w-full pl-7 pr-7 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Active type chip */}
        {typeFilter && (
          <button
            onClick={() => setTypeFilter('')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${TYPE_META[typeFilter]?.badgeBg || 'bg-slate-100 text-slate-600'}`}
          >
            {TYPE_META[typeFilter]?.label || typeFilter}
            <X size={11} />
          </button>
        )}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-14 text-center">
          {openDiscs.length === 0 && statusFilter === 'open' ? (
            <>
              <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-slate-700">No open discrepancies</p>
              <p className="text-sm text-slate-400 mt-1">All manifest items have been accounted for.</p>
            </>
          ) : (
            <>
              <ClipboardCheck size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">No discrepancies match your filters</p>
              <button onClick={() => { setStatusFilter('all'); setTypeFilter(''); setSearch('') }}
                className="mt-3 text-sm text-teal-600 hover:underline">
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium px-1">
            {filtered.length} {filtered.length === 1 ? 'discrepancy' : 'discrepancies'}
          </p>
          {filtered.map((d) => (
            <DiscRow key={d.id} disc={d} onResolve={setResolving} />
          ))}
        </div>
      )}

      {/* Resolve modal */}
      {resolving && (
        <ResolveModal disc={resolving} onClose={() => setResolving(null)} />
      )}
    </div>
  )
}
