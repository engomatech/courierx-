/**
 * Exceptions — Damage & exception management page
 *
 * Shows all flagged exceptions (damage, lost, wrong item, etc.)
 * reported across the ops pipeline. Supervisors can review, escalate
 * for investigation, and mark resolved once actioned.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { useAuthStore } from '../authStore'
import { Modal } from '../components/Modal'
import { ExceptionModal, EXCEPTION_TYPE_META, EXCEPTION_SEV_META, EXCEPTION_TYPES, EXCEPTION_SEVERITIES } from '../components/ExceptionModal'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate } from '../utils'
import {
  AlertOctagon, ShieldCheck, Clock, Search, Filter, X,
  ChevronDown, ChevronUp, Camera, ArrowUpCircle, CheckCircle,
  Plus, Package,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  open        : { label: 'Open',         bg: 'bg-red-100    text-red-700',    dot: 'bg-red-500' },
  under_review: { label: 'Under Review', bg: 'bg-amber-100  text-amber-700',  dot: 'bg-amber-500' },
  resolved    : { label: 'Resolved',     bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

const RESOLVE_OPTIONS = [
  'Returned to sender',
  'Replacement dispatched',
  'Insurance claim filed',
  'Customer compensated',
  'Item repacked and forwarded',
  'Written off — total loss',
  'False alarm — no issue found',
  'Other',
]

// ── Escalate confirm modal ────────────────────────────────────────────────────

function EscalateModal({ exc, onClose }) {
  const escalateException = useStore((s) => s.escalateException)

  const handleConfirm = () => {
    escalateException(exc.id)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Escalate for Review">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This will mark <span className="font-mono font-semibold text-slate-800">{exc.awb}</span> as{' '}
          <span className="font-semibold text-amber-700">Under Review</span>, flagging it for supervisor attention.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          <strong>Exception:</strong> {EXCEPTION_TYPE_META[exc.type]?.label || exc.type} — {EXCEPTION_SEV_META[exc.severity]?.label || exc.severity}
          <div className="mt-1 text-amber-600">{exc.description}</div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={handleConfirm}
            className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium flex items-center gap-2">
            <ArrowUpCircle size={15} />
            Escalate
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Resolve modal ─────────────────────────────────────────────────────────────

function ResolveModal({ exc, onClose }) {
  const resolveException = useStore((s) => s.resolveException)
  const user             = useAuthStore((s) => s.user)
  const [resolution, setResolution] = useState(RESOLVE_OPTIONS[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    resolveException(exc.id, resolution, user?.name || 'Ops')
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Resolve Exception">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
          <p className="font-mono font-semibold text-slate-800 mb-1">{exc.awb}</p>
          <p className="text-slate-600">{EXCEPTION_TYPE_META[exc.type]?.label || exc.type} · {EXCEPTION_SEV_META[exc.severity]?.label || exc.severity}</p>
          {exc.description && <p className="text-slate-500 mt-1 italic">{exc.description}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Resolution *</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {RESOLVE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit"
            className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2">
            <ShieldCheck size={15} />
            Mark Resolved
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Exception row ─────────────────────────────────────────────────────────────

function ExcRow({ exc, onEscalate, onResolve, onAWBClick }) {
  const [expanded, setExpanded] = useState(false)
  const typeMeta = EXCEPTION_TYPE_META[exc.type]  || { label: exc.type,     badgeBg: 'bg-slate-100 text-slate-600' }
  const sevMeta  = EXCEPTION_SEV_META[exc.severity] || { label: exc.severity, badgeBg: 'bg-slate-100 text-slate-600' }
  const statMeta = STATUS_META[exc.status] || STATUS_META.open
  const isOpen   = exc.status === 'open'
  const isReview = exc.status === 'under_review'

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isOpen   ? 'border-orange-200 bg-white' :
      isReview ? 'border-amber-200 bg-white'  :
                 'border-slate-100 bg-slate-50'
    }`}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${statMeta.dot}`} />

        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); if (exc.awb) onAWBClick(exc.awb) }}
              className="font-mono text-sm font-semibold text-cyan-700 hover:text-cyan-900 hover:underline"
            >{exc.awb}</button>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeMeta.badgeBg}`}>
              {typeMeta.label}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sevMeta.badgeBg}`}>
              {sevMeta.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statMeta.bg}`}>
              {statMeta.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {exc.description || '—'}
            {exc.location && <span className="text-slate-400"> · {exc.location}</span>}
          </p>
        </div>

        {/* Time + reported by */}
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
            <Clock size={11} />{formatDate(exc.reportedAt)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{exc.reportedBy}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <button
              onClick={() => onEscalate(exc)}
              className="text-xs px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <ArrowUpCircle size={12} /> Escalate
            </button>
          )}
          {(isOpen || isReview) && (
            <button
              onClick={() => onResolve(exc)}
              className="text-xs px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <CheckCircle size={12} /> Resolve
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t px-5 py-4 space-y-4 ${
          exc.status === 'resolved' ? 'border-slate-100 bg-slate-50' : 'border-orange-100 bg-orange-50/20'
        }`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">Exception ID</p>
              <p className="font-mono font-medium text-slate-700">{exc.id}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Reported</p>
              <p className="text-slate-700">
                {new Date(exc.reportedAt).toLocaleString('en-ZM', {
                  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Reported by</p>
              <p className="font-medium text-slate-700">{exc.reportedBy}</p>
            </div>
            {exc.location && (
              <div>
                <p className="text-slate-400 mb-0.5">Location</p>
                <p className="font-medium text-slate-700">{exc.location}</p>
              </div>
            )}
            {exc.escalatedAt && (
              <div>
                <p className="text-slate-400 mb-0.5">Escalated at</p>
                <p className="text-amber-700">
                  {new Date(exc.escalatedAt).toLocaleString('en-ZM', {
                    day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {exc.description && (
            <div className="text-xs">
              <p className="text-slate-400 mb-0.5">Description</p>
              <p className="text-slate-700 leading-relaxed">{exc.description}</p>
            </div>
          )}

          {/* Photos */}
          {exc.photos?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Camera size={11} /> Photos ({exc.photos.length})
              </p>
              <div className="flex gap-3 flex-wrap">
                {exc.photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Exception photo ${i + 1}`}
                    className="w-28 h-28 object-cover rounded-lg border border-orange-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {exc.status === 'resolved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 -mx-5 -mb-4 px-5 pb-4">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-2">
                <ShieldCheck size={13} /> Resolved
              </div>
              <p className="text-xs font-medium text-emerald-800">{exc.resolution}</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                By <strong>{exc.resolvedBy}</strong> ·{' '}
                {new Date(exc.resolvedAt).toLocaleString('en-ZM', {
                  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Exceptions() {
  const exceptions = useStore((s) => s.exceptions)

  const [statusFilter, setStatusFilter] = useState('open')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [sevFilter,    setSevFilter]    = useState('')
  const [search,       setSearch]       = useState('')

  const [reporting,  setReporting]  = useState(false)
  const [escalating, setEscalating] = useState(null)
  const [resolving,  setResolving]  = useState(null)
  const [activeAWB,  setActiveAWB]  = useState(null)

  // Stats
  const openExcs   = exceptions.filter((e) => e.status === 'open')
  const reviewExcs = exceptions.filter((e) => e.status === 'under_review')
  const resolvedExcs = exceptions.filter((e) => e.status === 'resolved')

  // Filtered list
  const filtered = useMemo(() => {
    let list = [...exceptions].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))

    if (statusFilter === 'open')        list = list.filter((e) => e.status === 'open')
    if (statusFilter === 'under_review') list = list.filter((e) => e.status === 'under_review')
    if (statusFilter === 'resolved')    list = list.filter((e) => e.status === 'resolved')
    if (typeFilter)  list = list.filter((e) => e.type     === typeFilter)
    if (sevFilter)   list = list.filter((e) => e.severity === sevFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((e) =>
        e.id?.toLowerCase().includes(q)          ||
        e.awb?.toLowerCase().includes(q)         ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)    ||
        e.reportedBy?.toLowerCase().includes(q)  ||
        e.resolution?.toLowerCase().includes(q)
      )
    }

    return list
  }, [exceptions, statusFilter, typeFilter, sevFilter, search])

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open',         count: openExcs.length,    color: openExcs.length > 0 ? 'text-red-600' : 'text-slate-400',    filter: 'open' },
          { label: 'Under Review', count: reviewExcs.length,  color: reviewExcs.length > 0 ? 'text-amber-600' : 'text-slate-400', filter: 'under_review' },
          { label: 'Resolved',     count: resolvedExcs.length,color: 'text-emerald-600',   filter: 'resolved' },
          { label: 'Total',        count: exceptions.length,  color: 'text-slate-700',     filter: '' },
        ].map(({ label, count, color, filter }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(filter)}
            className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === filter && filter !== '' ? 'ring-2 ring-orange-400 border-orange-300' : ''
            }`}
          >
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {[
            { v: 'open',         label: `Open (${openExcs.length})` },
            { v: 'under_review', label: `Review (${reviewExcs.length})` },
            { v: 'resolved',     label: `Resolved (${resolvedExcs.length})` },
            { v: '',             label: 'All' },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-2 transition-colors whitespace-nowrap ${
                statusFilter === v ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-7 pr-7 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none">
            <option value="">All types</option>
            {EXCEPTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Severity filter */}
        <div className="relative">
          <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">All severities</option>
            {EXCEPTION_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AWB, description…"
            className="w-full pl-7 pr-7 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Report button */}
        <button
          onClick={() => setReporting(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} /> Report Exception
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-14 text-center">
          {openExcs.length === 0 && statusFilter === 'open' ? (
            <>
              <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-slate-700">No open exceptions</p>
              <p className="text-sm text-slate-400 mt-1">All shipments are processing without issues.</p>
            </>
          ) : (
            <>
              <Package size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">No exceptions match your filters</p>
              <button
                onClick={() => { setStatusFilter(''); setTypeFilter(''); setSevFilter(''); setSearch('') }}
                className="mt-3 text-sm text-orange-500 hover:underline"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium px-1">
            {filtered.length} {filtered.length === 1 ? 'exception' : 'exceptions'}
          </p>
          {filtered.map((e) => (
            <ExcRow key={e.id} exc={e} onEscalate={setEscalating} onResolve={setResolving} onAWBClick={setActiveAWB} />
          ))}
        </div>
      )}

      {/* Modals */}
      {reporting && (
        <ExceptionModal onClose={() => setReporting(false)} />
      )}
      {escalating && (
        <EscalateModal exc={escalating} onClose={() => setEscalating(null)} />
      )}
      {resolving && (
        <ResolveModal exc={resolving} onClose={() => setResolving(null)} />
      )}
      {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </div>
  )
}
