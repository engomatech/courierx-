/**
 * Partner Orders — Ops view of incoming shipments created via the Partner API
 *
 * Fetches GET /api/v1/admin/shipments and displays all partner-created
 * bookings so the ops team can process them through the pipeline.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Globe, Search, RefreshCw, ChevronDown, ChevronUp,
  Package, MapPin, User, Phone, Calendar, Hash,
  ExternalLink, AlertCircle, Loader2, Filter, X,
  CheckCircle2, PenLine, Camera,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'

const API_BASE = '/api/v1'

// ── Status chip colours ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  Booked       : 'bg-sky-100 text-sky-700',
  'Picked Up'  : 'bg-amber-100 text-amber-700',
  'In Transit' : 'bg-blue-100 text-blue-700',
  'In Hub'     : 'bg-indigo-100 text-indigo-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  Delivered    : 'bg-emerald-100 text-emerald-700',
  'Delivery Failed': 'bg-red-100 text-red-700',
  NDR          : 'bg-rose-100 text-rose-700',
  Return       : 'bg-purple-100 text-purple-700',
  Cancelled    : 'bg-slate-100 text-slate-500',
}

function StatusChip({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function ShipmentDrawer({ awb, onClose }) {
  const [data, setData]   = useState(null)
  const [pod, setPod]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!awb) return
    setLoading(true)
    setError(null)
    setPod(null)

    fetch(`${API_BASE}/admin/shipments/${awb}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => {
        setData(d)
        setLoading(false)
        // Fetch POD evidence for delivered shipments
        if (d.status === 'Delivered') {
          fetch(`${API_BASE}/admin/pod/${awb}`)
            .then(r => r.ok ? r.json() : null)
            .then(p => { if (p?.pod) setPod(p.pod) })
            .catch(() => {}) // POD is supplementary — silent fail
        }
      })
      .catch(e => { setError(e.message || 'Failed to load'); setLoading(false) })
  }, [awb])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Partner Order</p>
            <h2 className="text-base font-bold text-slate-800">{awb}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {data && (
            <>
              {/* Partner + status */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Partner</p>
                  <p className="font-semibold text-slate-800">{data.partner_name}</p>
                  {data.partner_reference && (
                    <p className="text-xs text-slate-500 mt-0.5">Ref: {data.partner_reference}</p>
                  )}
                </div>
                <StatusChip status={data.status} />
              </div>

              {/* Service */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoCard label="Service" value={data.service_type} />
                <InfoCard label="Created" value={new Date(data.created_at).toLocaleDateString('en-ZM', { day:'2-digit', month:'short', year:'numeric' })} />
              </div>

              {/* Package */}
              <Section title="Package">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <InfoRow label="Weight"    value={`${data.package.weight} kg`} />
                  <InfoRow label="Quantity"  value={data.package.quantity} />
                  <InfoRow label="Dims (cm)" value={`${data.package.length} × ${data.package.width} × ${data.package.height}`} />
                  <InfoRow label="Value"     value={`${data.package.currency} ${data.package.value?.toLocaleString() ?? '—'}`} />
                  {data.package.description && (
                    <div className="col-span-2">
                      <InfoRow label="Description" value={data.package.description} />
                    </div>
                  )}
                </div>
              </Section>

              {/* Sender */}
              <Section title="Sender">
                <div className="space-y-2 text-sm">
                  <InfoRow label="Name"    value={data.sender.name} />
                  <InfoRow label="Phone"   value={data.sender.phone} />
                  <InfoRow label="Address" value={data.sender.address} />
                  <InfoRow label="City"    value={`${data.sender.city}, ${data.sender.country}`} />
                </div>
              </Section>

              {/* Receiver */}
              <Section title="Receiver">
                <div className="space-y-2 text-sm">
                  <InfoRow label="Name"    value={data.receiver.name} />
                  <InfoRow label="Phone"   value={data.receiver.phone} />
                  <InfoRow label="Address" value={data.receiver.address} />
                  <InfoRow label="City"    value={`${data.receiver.city}, ${data.receiver.country}`} />
                </div>
              </Section>

              {/* Proof of Delivery */}
              {data.status === 'Delivered' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Proof of Delivery
                  </h3>
                  {pod ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                        <CheckCircle2 size={16} className="shrink-0" />
                        Delivery Confirmed
                      </div>

                      {/* Recipient details */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-emerald-500 mb-0.5">Signed by</p>
                          <p className="font-semibold text-slate-800">{pod.recipient_name}</p>
                        </div>
                        {pod.recipient_mobile && (
                          <div>
                            <p className="text-xs text-emerald-500 mb-0.5">Mobile</p>
                            <p className="font-medium text-slate-700">{pod.recipient_mobile}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-xs text-emerald-500 mb-0.5">Recorded at</p>
                          <p className="text-slate-600 text-xs">
                            {new Date(pod.recorded_at).toLocaleString('en-ZM', {
                              day:'2-digit', month:'short', year:'numeric',
                              hour:'2-digit', minute:'2-digit',
                            })}
                            {pod.recorded_by && ` · ${pod.recorded_by}`}
                          </p>
                        </div>
                        {pod.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-emerald-500 mb-0.5">Notes</p>
                            <p className="text-slate-600 text-xs italic">{pod.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Signature */}
                      {pod.signature_data && (
                        <div className="border-t border-emerald-200 pt-3">
                          <p className="text-xs text-emerald-500 mb-1.5 flex items-center gap-1">
                            <PenLine size={11} /> Signature
                          </p>
                          <div className="bg-white rounded-lg border border-emerald-200 p-1.5">
                            <img
                              src={pod.signature_data}
                              alt="Recipient signature"
                              className="w-full h-16 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Photo */}
                      {pod.photo_data && (
                        <div className="border-t border-emerald-200 pt-3">
                          <p className="text-xs text-emerald-500 mb-1.5 flex items-center gap-1">
                            <Camera size={11} /> Delivery Photo
                          </p>
                          <img
                            src={pod.photo_data}
                            alt="POD photo"
                            className="w-full h-36 object-cover rounded-lg border border-emerald-200"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-slate-300 shrink-0" />
                      No proof of delivery on record for this shipment.
                    </div>
                  )}
                </div>
              )}

              {/* Tracking events */}
              {data.tracking_events?.length > 0 && (
                <Section title="Tracking History">
                  <div className="space-y-3">
                    {data.tracking_events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          {i < data.tracking_events.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-slate-700">{ev.activity}</p>
                          {ev.details && <p className="text-xs text-slate-500">{ev.details}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ev.date} {ev.time} {ev.city && `• ${ev.city}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-slate-50 rounded-lg p-3">{children}</div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PartnerOrders() {
  const [shipments, setShipments] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAwb, setSelectedAwb]   = useState(null)
  const [sortCol, setSortCol]     = useState('created_at')
  const [sortDir, setSortDir]     = useState('desc')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 50

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit : PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      if (filterStatus) params.set('status', filterStatus)

      const res  = await fetch(`${API_BASE}/admin/shipments?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load shipments')
      setShipments(data.shipments || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, page])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  // Client-side search filter
  const filtered = shipments.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.awb?.toLowerCase().includes(q) ||
      s.partner_name?.toLowerCase().includes(q) ||
      s.partner_reference?.toLowerCase().includes(q) ||
      s.sender?.name?.toLowerCase().includes(q) ||
      s.receiver?.name?.toLowerCase().includes(q) ||
      s.receiver?.city?.toLowerCase().includes(q)
    )
  })

  // Client-side sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol] ?? ''
    let bv = b[sortCol] ?? ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronDown size={12} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  const statuses = ['Booked','Picked Up','In Transit','In Hub','Out for Delivery','Delivered','Delivery Failed','NDR','Return','Cancelled']

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Partner Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Shipments submitted by partners via the API —{' '}
            <span className="font-medium text-slate-700">{total} total</span>
          </p>
        </div>
        <button
          onClick={fetchShipments}
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AWB, partner, reference, receiver…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
            className="pl-7 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Globe size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No partner orders found</p>
            <p className="text-sm mt-1">Partner-booked shipments will appear here once received via the API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <Th onClick={() => toggleSort('awb')}>AWB <SortIcon col="awb" /></Th>
                  <Th onClick={() => toggleSort('partner_name')}>Partner <SortIcon col="partner_name" /></Th>
                  <Th>Reference</Th>
                  <Th onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></Th>
                  <Th>Service</Th>
                  <Th>Receiver</Th>
                  <Th onClick={() => toggleSort('created_at')}>Created <SortIcon col="created_at" /></Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map(s => (
                  <tr
                    key={s.awb}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAwb(s.awb)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {s.awb}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{s.partner_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.partner_reference || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {s.service_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium leading-tight">{s.receiver?.name}</div>
                      <div className="text-slate-400 text-xs">{s.receiver?.city}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString('en-ZM', {
                        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedAwb(s.awb) }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedAwb && (
        <ShipmentDrawer awb={selectedAwb} onClose={() => setSelectedAwb(null)} />
      )}
    </div>
  )
}

// ── Helper table header cell ──────────────────────────────────────────────────
function Th({ children, onClick }) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${onClick ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  )
}
