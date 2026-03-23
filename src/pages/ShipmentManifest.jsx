/**
 * Shipment Manifest — /ops/shipment-manifests
 * Direct-shipment manifests (individual AWBs, not bags).
 * Separate from the bag-based ManifestManagement page.
 * Used for high-value or oversized items dispatched individually.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, formatDateShort, HUBS, TRANSPORTERS } from '../utils'
import { Modal } from '../components/Modal'
import { EntityDetailDrawer } from '../components/EntityDetailDrawer'
import {
  FileText, Plus, Search, Package, Truck, CheckCircle2,
  Clock, Download, ArrowRight, X, ChevronDown, ChevronRight,
} from 'lucide-react'

// ── Status colours ────────────────────────────────────────────
const SM_COLORS = {
  Open:        'bg-blue-100 text-blue-700 border-blue-200',
  Dispatched:  'bg-amber-100 text-amber-700 border-amber-200',
  Arrived:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  Completed:   'bg-slate-100 text-slate-600 border-slate-200',
}

function SMBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SM_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

const EMPTY_FORM = {
  transporter: TRANSPORTERS[0],
  origin: HUBS[0],
  destination: HUBS[1] || HUBS[0],
  notes: '',
  selectedAwbs: [],
}

export default function ShipmentManifest() {
  const shipments        = useStore(s => s.shipments)
  const smManifests      = useStore(s => s.smManifests || [])
  const createSMManifest = useStore(s => s.createSMManifest)
  const dispatchSM       = useStore(s => s.dispatchSMManifest)
  const arriveSM         = useStore(s => s.arriveSMManifest)

  const [search,     setSearch]     = useState('')
  const [tab,        setTab]        = useState('All')
  const [open,       setOpen]       = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [awbSearch,  setAwbSearch]  = useState('')
  const [expanded,   setExpanded]   = useState(null)
  const [detailAwb,  setDetailAwb]  = useState(null)
  const [detailId,   setDetailId]   = useState(null)

  const TABS = ['All', 'Open', 'Dispatched', 'Arrived', 'Completed']

  // Shipments eligible for direct manifest (not already bagged/manifested, or in transit)
  const eligible = useMemo(() => {
    return shipments.filter(s =>
      ['Origin Scanned', 'Hub Inbound', 'Bagged'].includes(s.status) ||
      (!s.bagId && ['Picked Up', 'Origin Scanned'].includes(s.status))
    )
  }, [shipments])

  const filteredManifests = useMemo(() => {
    return smManifests
      .filter(m => tab === 'All' || m.status === tab)
      .filter(m => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          m.id?.toLowerCase().includes(q) ||
          m.transporter?.toLowerCase().includes(q) ||
          m.origin?.toLowerCase().includes(q) ||
          m.destination?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [smManifests, tab, search])

  const filteredEligible = useMemo(() => {
    if (!awbSearch) return eligible
    const q = awbSearch.toLowerCase()
    return eligible.filter(s =>
      s.awb?.toLowerCase().includes(q) ||
      s.hawb?.toLowerCase().includes(q) ||
      s.sender?.name?.toLowerCase().includes(q) ||
      s.receiver?.name?.toLowerCase().includes(q)
    )
  }, [eligible, awbSearch])

  function toggleAwb(awb) {
    setForm(f => ({
      ...f,
      selectedAwbs: f.selectedAwbs.includes(awb)
        ? f.selectedAwbs.filter(a => a !== awb)
        : [...f.selectedAwbs, awb],
    }))
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!form.selectedAwbs.length) return
    if (createSMManifest) createSMManifest(form)
    setOpen(false)
    setForm(EMPTY_FORM)
    setAwbSearch('')
  }

  // CSV export
  function exportCSV() {
    const cols = ['Manifest ID', 'Status', 'Transporter', 'Origin', 'Destination', 'AWBs', 'Created', 'Dispatched', 'Arrived']
    const rows = filteredManifests.map(m => [
      m.id, m.status, m.transporter, m.origin, m.destination,
      (m.shipments || []).join(' | '),
      formatDateShort(m.createdAt), formatDateShort(m.dispatchedAt), formatDateShort(m.arrivedAt),
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`))
    const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `shipment_manifests_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const open_count      = smManifests.filter(m => m.status === 'Open').length
  const dispatched_count = smManifests.filter(m => m.status === 'Dispatched').length

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open',       value: open_count,       color: 'bg-blue-500',    icon: FileText },
          { label: 'Dispatched', value: dispatched_count, color: 'bg-amber-500',   icon: Truck },
          { label: 'Arrived',    value: smManifests.filter(m => m.status === 'Arrived').length, color: 'bg-emerald-500', icon: CheckCircle2 },
          { label: 'Total',      value: smManifests.length, color: 'bg-slate-500',  icon: Package },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search manifest ID, transporter…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}>{t}</button>
          ))}
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <Download size={14} /> Export
        </button>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> New Manifest
        </button>
      </div>

      {/* Manifests list */}
      <div className="space-y-3">
        {filteredManifests.length === 0 ? (
          <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
            <FileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No shipment manifests</p>
            <p className="text-slate-400 text-sm mt-1">Create a direct-shipment manifest to dispatch individual AWBs</p>
          </div>
        ) : filteredManifests.map(m => {
          const isExpanded = expanded === m.id
          const manifestShipments = shipments.filter(s => (m.shipments || []).includes(s.awb))
          return (
            <div key={m.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4">
                <button onClick={() => setExpanded(isExpanded ? null : m.id)}
                  className="text-slate-400 hover:text-slate-600 shrink-0">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailId(m.id) }}
                  className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline text-left"
                >{m.id}</button>
                <SMBadge status={m.status} />
                <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Route</p>
                    <p className="font-medium text-slate-700 text-xs">{m.origin} <ArrowRight size={10} className="inline" /> {m.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Transporter</p>
                    <p className="font-medium text-slate-700 text-xs">{m.transporter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Shipments</p>
                    <p className="font-medium text-slate-700 text-xs">{(m.shipments || []).length} AWBs</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="font-medium text-slate-700 text-xs">{formatDateShort(m.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {m.status === 'Open' && (
                    <button onClick={() => dispatchSM && dispatchSM(m.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium">
                      Dispatch
                    </button>
                  )}
                  {m.status === 'Dispatched' && (
                    <button onClick={() => arriveSM && arriveSM(m.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium">
                      Mark Arrived
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-slate-50 px-5 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Included Shipments</p>
                  <div className="space-y-1">
                    {manifestShipments.length === 0
                      ? <p className="text-xs text-slate-400 italic">No shipments found</p>
                      : manifestShipments.map(s => (
                        <div key={s.awb} className="flex items-center gap-3 text-xs py-1.5 px-3 bg-white rounded-lg border">
                          <button onClick={() => setDetailAwb(s.awb)}
                            className="font-mono text-blue-600 hover:underline">{s.awb}</button>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{s.sender?.name}</span>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="text-slate-600">{s.receiver?.name}</span>
                          <span className="ml-auto"><StatusBadge status={s.status} /></span>
                        </div>
                      ))
                    }
                  </div>
                  {m.notes && <p className="text-xs text-slate-500 mt-2 italic">Notes: {m.notes}</p>}
                  {m.dispatchedAt && <p className="text-xs text-slate-400 mt-1">Dispatched: {formatDate(m.dispatchedAt)}</p>}
                  {m.arrivedAt    && <p className="text-xs text-slate-400">Arrived: {formatDate(m.arrivedAt)}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create manifest modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Shipment Manifest" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Transporter *</label>
              <select value={form.transporter} onChange={e => setForm(f => ({ ...f, transporter: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TRANSPORTERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Origin Hub *</label>
              <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {HUBS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination Hub *</label>
              <select value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {HUBS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* AWB selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">
                Select Shipments ({form.selectedAwbs.length} selected)
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={awbSearch} onChange={e => setAwbSearch(e.target.value)}
                  placeholder="Filter…"
                  className="pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
              </div>
            </div>
            <div className="border rounded-xl max-h-52 overflow-y-auto bg-slate-50">
              {filteredEligible.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6 italic">No eligible shipments</p>
              ) : filteredEligible.map(s => (
                <label key={s.awb}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white cursor-pointer border-b last:border-0">
                  <input type="checkbox"
                    checked={form.selectedAwbs.includes(s.awb)}
                    onChange={() => toggleAwb(s.awb)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <span className="font-mono text-xs text-blue-600 w-32 shrink-0">{s.awb}</span>
                  <span className="text-xs text-slate-600 flex-1">{s.sender?.name} → {s.receiver?.name}</span>
                  <StatusBadge status={s.status} />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={form.selectedAwbs.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              Create Manifest ({form.selectedAwbs.length} AWBs)
            </button>
          </div>
        </form>
      </Modal>

      <ShipmentDetailDrawer awb={detailAwb} onClose={() => setDetailAwb(null)} />
      {detailId && <EntityDetailDrawer type="smf" id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
