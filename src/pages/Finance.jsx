/**
 * Finance Dashboard — /ops/finance
 * Revenue, payment breakdown, COD tracking, top customers, weight analytics.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { formatDate, formatDateShort } from '../utils'
import {
  DollarSign, TrendingUp, CreditCard, Banknote, Wallet,
  Package, Truck, CheckCircle2, AlertTriangle, Download,
  BarChart3, PieChart, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

// ── helpers ─────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return 'ZMW 0.00'
  return `ZMW ${Number(n).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function pct(a, b) {
  if (!b) return '0%'
  return `${Math.round((a / b) * 100)}%`
}

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend != null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-slate-500 shrink-0 truncate">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <div className="w-20 text-xs text-right text-slate-700 shrink-0 font-medium">{fmt(value)}</div>
    </div>
  )
}

// ── Date range filter ────────────────────────────────────────
const RANGES = ['Today', '7 Days', '30 Days', '90 Days', 'All Time']

function filterByRange(shipments, range) {
  if (range === 'All Time') return shipments
  const now = Date.now()
  const days = range === 'Today' ? 1 : range === '7 Days' ? 7 : range === '30 Days' ? 30 : 90
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return shipments.filter(s => s.createdAt && new Date(s.createdAt).getTime() >= cutoff)
}

// ── CSV export ───────────────────────────────────────────────
function exportFinanceCSV(shipments) {
  const cols = ['AWB', 'HAWB', 'Date', 'Status', 'Payment Type', 'Bill To', 'Goods Value (ZMW)',
                'Weight (kg)', 'Service', 'Sender', 'Receiver', 'COD Amount']
  const rows = shipments.map(s => [
    s.awb, s.hawb || '', s.createdAt ? formatDateShort(s.createdAt) : '',
    s.status, s.paymentType || '', s.billTo || '', s.goodsValue || 0,
    s.weight || 0, s.serviceType, s.sender?.name, s.receiver?.name, s.codAmount || 0,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"` ))
  const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `finance_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

// ── Main component ───────────────────────────────────────────
export default function Finance() {
  const allShipments = useStore(s => s.shipments)
  const [range, setRange] = useState('30 Days')

  const shipments = useMemo(() => filterByRange(allShipments, range), [allShipments, range])

  // ── Revenue stats (from courier cost, not declared goods value) ──────────
  // s.cost = what the customer was charged; s.goodsValue = declared value of goods
  const rev = (s) => parseFloat(s.cost || s.goodsValue) || 0
  const totalRevenue   = shipments.reduce((acc, s) => acc + rev(s), 0)
  const prepaidRev     = shipments.filter(s => s.paymentType === 'Prepaid').reduce((a, s) => a + rev(s), 0)
  const cashRev        = shipments.filter(s => s.paymentType === 'Cash').reduce((a, s) => a + rev(s), 0)
  const creditRev      = shipments.filter(s => s.paymentType === 'Credit').reduce((a, s) => a + rev(s), 0)
  const codRev         = shipments.filter(s => s.paymentType === 'COD').reduce((a, s) => a + (parseFloat(s.codAmount) || rev(s)), 0)

  // ── Shipment counts ─────────────────────────────────────────
  const total      = shipments.length
  const delivered  = shipments.filter(s => s.status === 'Delivered').length
  const ndr        = shipments.filter(s => s.status === 'Non-Delivery').length
  const inTransit  = shipments.filter(s => !['Delivered', 'Non-Delivery', 'Booked'].includes(s.status)).length

  // ── Weight stats ────────────────────────────────────────────
  const totalWeight = shipments.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)
  const avgWeight   = total > 0 ? (totalWeight / total).toFixed(2) : 0

  // ── Payment type breakdown ──────────────────────────────────
  const byPayment = ['Prepaid', 'Cash', 'Credit', 'COD'].map(pt => ({
    label: pt,
    count: shipments.filter(s => s.paymentType === pt).length,
    revenue: pt === 'COD'
      ? shipments.filter(s => s.paymentType === pt).reduce((a, s) => a + (parseFloat(s.codAmount) || rev(s)), 0)
      : shipments.filter(s => s.paymentType === pt).reduce((a, s) => a + rev(s), 0),
  }))

  // ── Service type breakdown ──────────────────────────────────
  const byService = ['Standard', 'Express', 'International'].map(st => ({
    label: st,
    count: shipments.filter(s => s.serviceType === st).length,
    revenue: shipments.filter(s => s.serviceType === st).reduce((a, s) => a + rev(s), 0),
  }))

  // ── Top senders by revenue ──────────────────────────────────
  const senderMap = {}
  shipments.forEach(s => {
    const key = s.sender?.name || 'Unknown'
    senderMap[key] = (senderMap[key] || 0) + (parseFloat(s.goodsValue) || 0)
  })
  const topSenders = Object.entries(senderMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxSenderRev = topSenders[0]?.[1] || 1

  // ── Top destinations ─────────────────────────────────────────
  const destMap = {}
  shipments.forEach(s => {
    const key = `${s.receiver?.city || ''}${s.receiver?.country ? ', ' + s.receiver.country : ''}`
    destMap[key] = (destMap[key] || 0) + 1
  })
  const topDests = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxDestCount = topDests[0]?.[1] || 1

  // ── Recent transactions ──────────────────────────────────────
  const recentTx = [...shipments]
    .filter(s => s.goodsValue)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)

  const PAYMENT_COLORS = {
    Prepaid: 'bg-blue-100 text-blue-700',
    Cash:    'bg-amber-100 text-amber-700',
    Credit:  'bg-purple-100 text-purple-700',
    COD:     'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >{r}</button>
          ))}
        </div>
        <button
          onClick={() => exportFinanceCSV(shipments)}
          className="flex items-center gap-2 text-sm border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${total} shipments · courier charges`}
          icon={DollarSign} color="bg-blue-500" />
        <StatCard label="Prepaid" value={fmt(prepaidRev)}
          sub={`${shipments.filter(s => s.paymentType === 'Prepaid').length} shipments`}
          icon={CreditCard} color="bg-indigo-500" />
        <StatCard label="Cash Collections" value={fmt(cashRev)}
          sub={`${shipments.filter(s => s.paymentType === 'Cash').length} shipments`}
          icon={Banknote} color="bg-amber-500" />
        <StatCard label="Credit" value={fmt(creditRev)}
          sub={`${shipments.filter(s => s.paymentType === 'Credit').length} shipments`}
          icon={Wallet} color="bg-purple-500" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Delivered" value={delivered} sub={`${pct(delivered, total)} success rate`}
          icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="In Transit" value={inTransit} sub="Active pipeline"
          icon={Truck} color="bg-orange-500" />
        <StatCard label="NDR" value={ndr} sub={`${pct(ndr, total)} failure rate`}
          icon={AlertTriangle} color="bg-red-500" />
        <StatCard label="Total Weight" value={`${totalWeight.toFixed(1)} kg`} sub={`Avg ${avgWeight} kg/shipment`}
          icon={Package} color="bg-teal-500" />
      </div>

      {/* Middle row: Payment breakdown + Service breakdown */}
      <div className="grid grid-cols-2 gap-6">

        {/* Payment type */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-blue-500" /> Payment Breakdown
          </h3>
          <div className="space-y-4">
            {byPayment.map(({ label, count, revenue }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PAYMENT_COLORS[label] || 'bg-slate-100 text-slate-600'}`}>
                    {label}
                  </span>
                  <span className="text-sm text-slate-500">{count} shipments</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{fmt(revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service type */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Service Breakdown
          </h3>
          <div className="space-y-4">
            {byService.map(({ label, count, revenue }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    label === 'Express' ? 'bg-orange-100 text-orange-700' :
                    label === 'International' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{label}</span>
                  <span className="text-sm text-slate-500">{count} shipments</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{fmt(revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Top senders + Top destinations */}
      <div className="grid grid-cols-2 gap-6">

        {/* Top senders */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> Top Senders by Value
          </h3>
          {topSenders.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topSenders.map(([name, rev]) => (
                <Bar key={name} label={name} value={rev} max={maxSenderRev} color="bg-blue-400" />
              ))}
            </div>
          )}
        </div>

        {/* Top destinations */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-emerald-500" /> Top Destinations
          </h3>
          {topDests.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topDests.map(([dest, count]) => (
                <div key={dest} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-500 shrink-0 truncate">{dest}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${Math.round((count / maxDestCount) * 100)}%` }} />
                  </div>
                  <div className="w-12 text-xs text-right text-slate-700 shrink-0 font-medium">{count} pkgs</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions table */}
      {recentTx.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" /> Recent Transactions
            </h3>
            <span className="text-xs text-slate-400">Shipments with declared value</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['AWB', 'Date', 'Sender', 'Receiver', 'Service', 'Payment', 'Value (ZMW)', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTx.map(s => (
                  <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{s.awb}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateShort(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{s.sender?.name}</p>
                      <p className="text-slate-400 text-xs">{s.sender?.city}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{s.receiver?.name}</p>
                      <p className="text-slate-400 text-xs">{s.receiver?.city}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
                        s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{s.serviceType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${PAYMENT_COLORS[s.paymentType] || 'bg-slate-100 text-slate-600'}`}>
                        {s.paymentType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{fmt(s.goodsValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        s.status === 'Non-Delivery' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
          <DollarSign size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No shipments in the selected period</p>
          <p className="text-slate-400 text-sm mt-1">Book shipments with goods values to see financial analytics here</p>
        </div>
      )}

    </div>
  )
}
