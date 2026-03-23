/**
 * COD Dashboard — /ops/cod
 * Track Cash on Delivery collections: pending, collected, remitted.
 * Each COD shipment has a declared COD amount that the driver collects from the receiver.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { formatDate, formatDateShort } from '../utils'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import {
  Banknote, Search, CheckCircle2, Clock, AlertTriangle,
  Download, DollarSign, Wallet, ArrowUpRight,
} from 'lucide-react'

function fmt(n) {
  if (!n && n !== 0) return 'ZMW 0.00'
  return `ZMW ${Number(n).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const COD_STATUS_COLORS = {
  'Pending':   'bg-amber-100 text-amber-700 border-amber-200',
  'Collected': 'bg-blue-100 text-blue-700 border-blue-200',
  'Remitted':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Failed':    'bg-red-100 text-red-700 border-red-200',
}

function CODBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${COD_STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Pending'}
    </span>
  )
}

export default function CODDashboard() {
  const shipments      = useStore(s => s.shipments)
  const updateCOD      = useStore(s => s.updateCODStatus)

  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('All')
  const [detailAwb, setDetailAwb] = useState(null)

  // COD shipments = paymentType === 'COD' OR codAmount is set
  const codShipments = useMemo(() => {
    return shipments.filter(s => s.paymentType === 'COD' || s.codAmount)
  }, [shipments])

  const TABS = ['All', 'Pending', 'Collected', 'Remitted', 'Failed']

  const filtered = useMemo(() => {
    return codShipments
      .filter(s => {
        const codStatus = s.codStatus || 'Pending'
        return tab === 'All' || codStatus === tab
      })
      .filter(s => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          s.awb?.toLowerCase().includes(q) ||
          s.hawb?.toLowerCase().includes(q) ||
          s.sender?.name?.toLowerCase().includes(q) ||
          s.receiver?.name?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [codShipments, tab, search])

  // Stats
  const totalCOD      = codShipments.reduce((a, s) => a + (parseFloat(s.codAmount || s.goodsValue) || 0), 0)
  const pendingAmt    = codShipments.filter(s => !s.codStatus || s.codStatus === 'Pending').reduce((a, s) => a + (parseFloat(s.codAmount || s.goodsValue) || 0), 0)
  const collectedAmt  = codShipments.filter(s => s.codStatus === 'Collected').reduce((a, s) => a + (parseFloat(s.codAmount || s.goodsValue) || 0), 0)
  const remittedAmt   = codShipments.filter(s => s.codStatus === 'Remitted').reduce((a, s) => a + (parseFloat(s.codAmount || s.goodsValue) || 0), 0)

  function markStatus(awb, status) {
    if (updateCOD) updateCOD(awb, status)
  }

  function exportCSV() {
    const cols = ['AWB', 'HAWB', 'Date', 'Sender', 'Receiver', 'COD Amount', 'COD Status', 'Shipment Status']
    const rows = filtered.map(s => [
      s.awb, s.hawb || '', formatDateShort(s.createdAt),
      s.sender?.name, s.receiver?.name,
      s.codAmount || s.goodsValue || 0,
      s.codStatus || 'Pending', s.status,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`))
    const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `cod_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total COD Value', value: fmt(totalCOD),     color: 'bg-blue-500',    icon: DollarSign },
          { label: 'Pending Collection', value: fmt(pendingAmt),   color: 'bg-amber-500',   icon: Clock },
          { label: 'Collected',       value: fmt(collectedAmt), color: 'bg-blue-600',    icon: Banknote },
          { label: 'Remitted',        value: fmt(remittedAmt),  color: 'bg-emerald-500', icon: Wallet },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search AWB, sender, receiver…"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Banknote size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No COD shipments found</p>
            <p className="text-slate-400 text-sm mt-1">
              {codShipments.length === 0
                ? 'Book shipments with payment type "COD" to track them here'
                : 'No shipments match the current filter'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['AWB / HAWB', 'Date', 'Sender', 'Receiver', 'COD Amount', 'Shipment Status', 'COD Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const codStatus = s.codStatus || 'Pending'
                  const codAmt = parseFloat(s.codAmount || s.goodsValue) || 0
                  return (
                    <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button onClick={() => setDetailAwb(s.awb)}
                          className="font-mono text-xs text-blue-600 hover:underline">{s.awb}</button>
                        {s.hawb && <div className="text-slate-400 font-mono text-xs mt-0.5">HAWB: {s.hawb}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDateShort(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs">{s.sender?.name}</div>
                        <div className="text-slate-400 text-xs">{s.sender?.city}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs">{s.receiver?.name}</div>
                        <div className="text-slate-400 text-xs">{s.receiver?.city}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 text-sm">{fmt(codAmt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s.status === 'Non-Delivery' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3"><CODBadge status={codStatus} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {codStatus === 'Pending' && s.status === 'Delivered' && (
                            <button onClick={() => markStatus(s.awb, 'Collected')}
                              className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                              Mark Collected
                            </button>
                          )}
                          {codStatus === 'Collected' && (
                            <button onClick={() => markStatus(s.awb, 'Remitted')}
                              className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200">
                              Mark Remitted
                            </button>
                          )}
                          {codStatus === 'Pending' && s.status === 'Non-Delivery' && (
                            <button onClick={() => markStatus(s.awb, 'Failed')}
                              className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                              Mark Failed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShipmentDetailDrawer awb={detailAwb} onClose={() => setDetailAwb(null)} />
    </div>
  )
}
