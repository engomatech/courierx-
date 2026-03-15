import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils'
import { ScanLine, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function InboundScan() {
  const shipments        = useStore((s) => s.shipments)
  const originInboundScan = useStore((s) => s.originInboundScan)

  const [input, setInput] = useState('')
  const [results, setResults] = useState([])

  const eligible  = shipments.filter((s) => s.status === 'Picked Up')
  const scanned   = shipments.filter((s) => s.status === 'Origin Scanned')

  const handleScan = (e) => {
    e.preventDefault()
    const awb = input.trim().toUpperCase()
    if (!awb) return
    const res = originInboundScan(awb)
    setResults((prev) => [{ awb, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
    setInput('')
  }

  return (
    <div className="space-y-6">
      {/* Scanner */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <ScanLine size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Pickup Inbound Scanner</h2>
            <p className="text-sm text-slate-500">Scan shipments received at the origin warehouse</p>
          </div>
        </div>
        <form onSubmit={handleScan} className="flex gap-3 max-w-lg">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter or scan AWB number…"
            className="flex-1 border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase placeholder:normal-case placeholder:text-slate-400"
          />
          <button type="submit"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <ScanLine size={16} /> Scan
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan log */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900">Recent Scan Activity</h3>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">No scans yet in this session.</p>
            ) : (
              results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${r.ok ? '' : 'bg-red-50'}`}>
                  {r.ok
                    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                    : <XCircle    size={18} className="text-red-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-medium text-slate-700">{r.awb}</span>
                    <p className={`text-xs mt-0.5 ${r.ok ? 'text-slate-500' : 'text-red-600'}`}>{r.msg}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDate(r.at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <p className="text-sm text-slate-500">Awaiting Scan</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{eligible.length}</p>
              <p className="text-xs text-slate-400 mt-1">Status: Picked Up</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <p className="text-sm text-slate-500">Scanned Today</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{results.filter((r) => r.ok).length}</p>
              <p className="text-xs text-slate-400 mt-1">This session</p>
            </div>
          </div>

          {/* Pending list */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-3 border-b">
              <h3 className="font-medium text-slate-700 text-sm">Shipments Awaiting Inbound Scan</h3>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {eligible.length === 0 ? (
                <p className="px-5 py-6 text-center text-slate-400 text-sm">All shipments scanned!</p>
              ) : (
                eligible.map((s) => (
                  <div key={s.awb} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-blue-600 font-medium">{s.awb}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{s.sender.name} → {s.receiver.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        const res = originInboundScan(s.awb)
                        setResults((prev) => [{ awb: s.awb, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                    >
                      Scan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scanned */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-medium text-slate-700 text-sm">Origin Scanned</h3>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{scanned.length}</span>
            </div>
            <div className="divide-y max-h-48 overflow-y-auto">
              {scanned.slice(0, 10).map((s) => (
                <div key={s.awb} className="flex items-center gap-3 px-5 py-2.5">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="font-mono text-xs text-slate-700">{s.awb}</span>
                  <span className="text-xs text-slate-400 ml-auto">{s.receiver.city}</span>
                </div>
              ))}
              {scanned.length === 0 && (
                <p className="px-5 py-4 text-center text-slate-400 text-sm">No scanned shipments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
