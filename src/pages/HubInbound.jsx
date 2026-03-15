import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils'
import { MapPin, CheckCircle, XCircle, Clock, Archive } from 'lucide-react'

export default function HubInbound() {
  const shipments      = useStore((s) => s.shipments)
  const bags           = useStore((s) => s.bags)
  const manifests      = useStore((s) => s.manifests)
  const hubInboundScan = useStore((s) => s.hubInboundScan)
  const arriveManifest = useStore((s) => s.arriveManifest)

  const [input, setInput]   = useState('')
  const [results, setResults] = useState([])

  const eligibleBags      = bags.filter((b) => b.status === 'Manifested')
  const eligibleShipments = shipments.filter((s) => s.status === 'Manifested')
  const hubScanned        = shipments.filter((s) => s.status === 'Hub Inbound')
  const dispatchedManifests = manifests.filter((m) => m.status === 'Dispatched')

  const handleScan = (e) => {
    e.preventDefault()
    const val = input.trim().toUpperCase()
    if (!val) return
    const res = hubInboundScan(val)
    setResults((prev) => [{ input: val, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
    setInput('')
  }

  const scanBag = (bagId) => {
    const res = hubInboundScan(bagId)
    setResults((prev) => [{ input: bagId, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
  }

  const scanShipment = (awb) => {
    const res = hubInboundScan(awb)
    setResults((prev) => [{ input: awb, ...res, at: new Date().toISOString() }, ...prev.slice(0, 19)])
  }

  return (
    <div className="space-y-6">
      {/* Scanner */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-100 rounded-xl">
            <MapPin size={24} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Hub Inbound Scanner</h2>
            <p className="text-sm text-slate-500">Scan bags or individual shipments arriving at the destination hub</p>
          </div>
        </div>
        <form onSubmit={handleScan} className="flex gap-3 max-w-lg">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Bag ID or AWB number…"
            className="flex-1 border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase placeholder:normal-case placeholder:text-slate-400"
          />
          <button type="submit"
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <MapPin size={16} /> Scan
          </button>
        </form>
      </div>

      {/* Dispatched manifests — quick arrive */}
      {dispatchedManifests.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-slate-900 text-sm">In-Transit Manifests</h3>
          </div>
          <div className="divide-y">
            {dispatchedManifests.map((m) => {
              const bagCount = m.bags.length
              const directCount = m.shipments.length
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1">
                    <span className="font-mono text-cyan-700 font-medium text-sm">{m.id}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.origin} → {m.destination} · {m.transporter}
                      {bagCount > 0 && ` · ${bagCount} bags`}
                      {directCount > 0 && ` · ${directCount} direct`}
                    </p>
                  </div>
                  <button onClick={() => arriveManifest(m.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium">
                    Mark Arrived
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan log */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900">Scan Log</h3>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">No scans in this session.</p>
            ) : (
              results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${r.ok ? '' : 'bg-red-50'}`}>
                  {r.ok
                    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                    : <XCircle    size={18} className="text-red-500 shrink-0" />
                  }
                  <div className="flex-1">
                    <span className="font-mono text-xs font-medium text-slate-700">{r.input}</span>
                    <p className={`text-xs mt-0.5 ${r.ok ? 'text-slate-500' : 'text-red-600'}`}>{r.msg}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(r.at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">Bags Awaiting</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{eligibleBags.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">Hub Inbound</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{hubScanned.length}</p>
            </div>
          </div>

          {/* Bags to scan */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Archive size={15} className="text-indigo-500" />
              <h3 className="font-medium text-slate-700 text-sm">Bags Awaiting Hub Scan</h3>
            </div>
            <div className="divide-y max-h-48 overflow-y-auto">
              {eligibleBags.length === 0 ? (
                <p className="px-5 py-6 text-center text-slate-400 text-sm">No bags awaiting hub scan.</p>
              ) : (
                eligibleBags.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-indigo-600 font-medium">{b.id}</span>
                      <p className="text-xs text-slate-500">{b.destination} · {b.shipments.length} pkgs</p>
                    </div>
                    <button onClick={() => scanBag(b.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium">
                      Scan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Individual shipments */}
          {eligibleShipments.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-5 py-3 border-b">
                <h3 className="font-medium text-slate-700 text-sm">Individual Shipments (Manifested, no bag)</h3>
              </div>
              <div className="divide-y max-h-36 overflow-y-auto">
                {eligibleShipments.map((s) => (
                  <div key={s.awb} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="font-mono text-xs text-cyan-700 flex-1">{s.awb}</span>
                    <span className="text-xs text-slate-400">{s.receiver.city}</span>
                    <button onClick={() => scanShipment(s.awb)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium ml-2">
                      Scan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hub Inbound list */}
      {hubScanned.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Hub Inbound Shipments</h3>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{hubScanned.length} shipments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">AWB</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 font-medium">Delivery City</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {hubScanned.map((s) => (
                  <tr key={s.awb} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-teal-700 text-xs">{s.awb}</td>
                    <td className="px-4 py-3">{s.receiver.name}</td>
                    <td className="px-4 py-3">{s.receiver.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
                        s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{s.serviceType}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
