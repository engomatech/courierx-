/**
 * Customs Status Process — /ops/customs
 * Shows all international shipments. Allows updating customs status,
 * recording duties, adding custom reference numbers, and flagging holds.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { formatDate, formatDateShort } from '../utils'
import { Modal } from '../components/Modal'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import {
  Globe, Search, FileText, CheckCircle2, AlertTriangle,
  Clock, XCircle, Download, RefreshCw, Hash,
} from 'lucide-react'

// ── Customs status options ───────────────────────────────────
const CUSTOMS_STATUSES = [
  'Pending Customs',
  'Customs Clearance In Progress',
  'Duty Assessment',
  'Awaiting Payment',
  'Customs Cleared',
  'Customs Hold',
  'Rejected / Returned',
]

const CUSTOMS_STATUS_COLORS = {
  'Pending Customs':                  'bg-slate-100 text-slate-600 border-slate-200',
  'Customs Clearance In Progress':    'bg-blue-100 text-blue-700 border-blue-200',
  'Duty Assessment':                  'bg-amber-100 text-amber-700 border-amber-200',
  'Awaiting Payment':                 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Customs Cleared':                  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Customs Hold':                     'bg-red-100 text-red-700 border-red-200',
  'Rejected / Returned':              'bg-rose-100 text-rose-700 border-rose-200',
}

function CustomsBadge({ status }) {
  if (!status) return <span className="text-xs text-slate-400 italic">Not started</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CUSTOMS_STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

// ── Bulk action selector ─────────────────────────────────────
const STATUS_ICONS = {
  'Customs Cleared': CheckCircle2,
  'Customs Hold': AlertTriangle,
  'Awaiting Payment': Clock,
  'Rejected / Returned': XCircle,
}

// ── Main component ───────────────────────────────────────────
export default function CustomsProcess() {
  const shipments         = useStore(s => s.shipments)
  const updateShipment    = useStore(s => s.updateShipmentCustoms)

  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('All')
  const [editAwb,   setEditAwb]   = useState(null)
  const [detailAwb, setDetailAwb] = useState(null)
  const [form,      setForm]      = useState({
    customsStatus: '', customsRef: '', dutyAmount: '', dutyPaid: false, notes: '',
  })

  // Only show international shipments
  const international = useMemo(() => {
    return shipments.filter(s =>
      s.serviceType === 'International' ||
      (s.sender?.country && s.receiver?.country && s.sender.country !== s.receiver.country)
    )
  }, [shipments])

  const TABS = ['All', 'Pending Customs', 'In Progress', 'Cleared', 'Hold']

  const filtered = useMemo(() => {
    return international
      .filter(s => {
        if (tab === 'All') return true
        if (tab === 'Pending Customs') return !s.customsStatus || s.customsStatus === 'Pending Customs'
        if (tab === 'In Progress') return ['Customs Clearance In Progress', 'Duty Assessment', 'Awaiting Payment'].includes(s.customsStatus)
        if (tab === 'Cleared') return s.customsStatus === 'Customs Cleared'
        if (tab === 'Hold') return s.customsStatus === 'Customs Hold'
        return true
      })
      .filter(s => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          s.awb?.toLowerCase().includes(q) ||
          s.hawb?.toLowerCase().includes(q) ||
          s.sender?.name?.toLowerCase().includes(q) ||
          s.receiver?.name?.toLowerCase().includes(q) ||
          s.goodsDescription?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [international, tab, search])

  function openEdit(s) {
    setEditAwb(s.awb)
    setForm({
      customsStatus: s.customsStatus || 'Pending Customs',
      customsRef:    s.customsRef    || '',
      dutyAmount:    s.dutyAmount    || '',
      dutyPaid:      s.dutyPaid      || false,
      notes:         s.customsNotes  || '',
    })
  }

  function handleSave(e) {
    e.preventDefault()
    if (updateShipment) {
      updateShipment(editAwb, {
        customsStatus: form.customsStatus,
        customsRef:    form.customsRef,
        dutyAmount:    form.dutyAmount ? parseFloat(form.dutyAmount) : null,
        dutyPaid:      form.dutyPaid,
        customsNotes:  form.notes,
        customsUpdatedAt: new Date().toISOString(),
      })
    }
    setEditAwb(null)
  }

  // Stats
  const cleared   = international.filter(s => s.customsStatus === 'Customs Cleared').length
  const hold      = international.filter(s => s.customsStatus === 'Customs Hold').length
  const pending   = international.filter(s => !s.customsStatus || s.customsStatus === 'Pending Customs').length
  const inProg    = international.filter(s => ['Customs Clearance In Progress','Duty Assessment','Awaiting Payment'].includes(s.customsStatus)).length

  // CSV export
  function exportCSV() {
    const cols = ['AWB', 'HAWB', 'Date', 'Sender', 'Receiver', 'Goods Desc', 'Goods Value', 'Customs Status', 'Customs Ref', 'Duty Amount', 'Duty Paid', 'Notes']
    const rows = filtered.map(s => [
      s.awb, s.hawb || '', formatDateShort(s.createdAt),
      s.sender?.name, s.receiver?.name, s.goodsDescription || '',
      s.goodsValue || '', s.customsStatus || '', s.customsRef || '',
      s.dutyAmount || '', s.dutyPaid ? 'Yes' : 'No', s.customsNotes || '',
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`))
    const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `customs_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending Customs',  value: pending, color: 'bg-slate-500', icon: Clock },
          { label: 'In Progress',      value: inProg,  color: 'bg-blue-500',  icon: RefreshCw },
          { label: 'Customs Cleared',  value: cleared, color: 'bg-emerald-500', icon: CheckCircle2 },
          { label: 'On Hold',          value: hold,    color: 'bg-red-500',   icon: AlertTriangle },
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
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search AWB, sender, goods…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >{t}</button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Globe size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No international shipments found</p>
            <p className="text-slate-400 text-sm mt-1">International shipments appear here for customs processing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['AWB / HAWB', 'Date', 'Sender', 'Receiver', 'Goods', 'Value', 'Customs Ref', 'Duty (ZMW)', 'Customs Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailAwb(s.awb)}
                        className="font-mono text-xs text-blue-600 hover:underline underline-offset-2">{s.awb}</button>
                      {s.hawb && <div className="text-slate-400 font-mono text-xs mt-0.5">HAWB: {s.hawb}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateShort(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{s.sender?.name}</div>
                      <div className="text-slate-400 text-xs">{s.sender?.country}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{s.receiver?.name}</div>
                      <div className="text-slate-400 text-xs">{s.receiver?.country}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[120px] truncate">{s.goodsDescription || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-medium">
                      {s.goodsValue ? `ZMW ${s.goodsValue}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.customsRef
                        ? <span className="font-mono text-xs text-slate-600">{s.customsRef}</span>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {s.dutyAmount ? (
                        <div>
                          <span className="font-medium text-slate-800 text-xs">ZMW {s.dutyAmount}</span>
                          {s.dutyPaid && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ Paid</span>}
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><CustomsBadge status={s.customsStatus} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update customs modal */}
      <Modal open={!!editAwb} onClose={() => setEditAwb(null)} title="Update Customs Status" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customs Status</label>
            <select value={form.customsStatus}
              onChange={e => setForm(f => ({ ...f, customsStatus: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CUSTOMS_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customs Reference No.</label>
            <input value={form.customsRef}
              onChange={e => setForm(f => ({ ...f, customsRef: e.target.value }))}
              placeholder="e.g. ZRA-2026-001234"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duty Amount (ZMW)</label>
              <input type="number" step="0.01" value={form.dutyAmount}
                onChange={e => setForm(f => ({ ...f, dutyAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.dutyPaid}
                  onChange={e => setForm(f => ({ ...f, dutyPaid: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-600">Duty has been paid</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} rows={2}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional customs notes…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditAwb(null)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Save Customs Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Shipment detail drawer */}
      <ShipmentDetailDrawer awb={detailAwb} onClose={() => setDetailAwb(null)} />
    </div>
  )
}
