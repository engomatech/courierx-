import { useState } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { formatDate, NDR_REASONS } from '../utils'
import { CheckSquare, AlertTriangle, CheckCircle, XCircle, Phone, MapPin, User } from 'lucide-react'

function ShipmentCard({ shipment }) {
  const recordPOD = useStore((s) => s.recordPOD)
  const recordNDR = useStore((s) => s.recordNDR)

  const [podOpen, setPodOpen] = useState(false)
  const [ndrOpen, setNdrOpen] = useState(false)
  const [pod, setPod] = useState({ recipientName: '', mobile: '', notes: '' })
  const [ndr, setNdr] = useState({ reason: NDR_REASONS[0], rescheduleDate: '', notes: '' })

  const handlePOD = (e) => {
    e.preventDefault()
    recordPOD(shipment.awb, pod)
    setPodOpen(false)
  }

  const handleNDR = (e) => {
    e.preventDefault()
    recordNDR(shipment.awb, ndr)
    setNdrOpen(false)
  }

  const canAct = shipment.status === 'Out for Delivery' || shipment.status === 'DRS Assigned'

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="font-mono text-sm font-bold text-slate-700">{shipment.awb}</span>
            <div className="mt-0.5"><StatusBadge status={shipment.status} /></div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            shipment.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
            shipment.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-600'
          }`}>{shipment.serviceType}</span>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-start gap-2">
            <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <span className="font-medium text-slate-700">{shipment.receiver.name}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-500 text-xs">{shipment.receiver.address}, {shipment.receiver.city}</span>
          </div>
          <div className="flex items-start gap-2">
            <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-500 text-xs">{shipment.receiver.phone}</span>
          </div>
        </div>

        {/* POD info */}
        {shipment.pod && (
          <div className="mt-3 bg-emerald-50 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium mb-1">
              <CheckCircle size={13} /> POD Recorded
            </div>
            <p className="text-emerald-600">Signed by: {shipment.pod.recipientName}</p>
            <p className="text-emerald-600">{formatDate(shipment.pod.timestamp)}</p>
            {shipment.pod.notes && <p className="text-emerald-600 mt-0.5">{shipment.pod.notes}</p>}
          </div>
        )}

        {/* NDR info */}
        {shipment.ndr && (
          <div className="mt-3 bg-red-50 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-1.5 text-red-700 font-medium mb-1">
              <XCircle size={13} /> Non-Delivery
            </div>
            <p className="text-red-600">Reason: {shipment.ndr.reason}</p>
            {shipment.ndr.rescheduleDate && <p className="text-red-600">Reschedule: {formatDate(shipment.ndr.rescheduleDate)}</p>}
          </div>
        )}

        {canAct && (
          <div className="mt-4 flex gap-2">
            <button onClick={() => setPodOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium">
              <CheckCircle size={14} /> Record POD
            </button>
            <button onClick={() => setNdrOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium">
              <XCircle size={14} /> Record NDR
            </button>
          </div>
        )}
      </div>

      {/* POD Modal */}
      <Modal open={podOpen} onClose={() => setPodOpen(false)} title={`Record POD — ${shipment.awb}`}>
        <form onSubmit={handlePOD} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Recipient Name *</label>
            <input required value={pod.recipientName}
              onChange={(e) => setPod((p) => ({ ...p, recipientName: e.target.value }))}
              placeholder="Name of person who received the parcel"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
            <input required value={pod.mobile}
              onChange={(e) => setPod((p) => ({ ...p, mobile: e.target.value }))}
              placeholder="+1-..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={pod.notes}
              onChange={(e) => setPod((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Left at door, handed to concierge, etc."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setPodOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
              Confirm Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* NDR Modal */}
      <Modal open={ndrOpen} onClose={() => setNdrOpen(false)} title={`Record NDR — ${shipment.awb}`}>
        <form onSubmit={handleNDR} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
            <select value={ndr.reason} onChange={(e) => setNdr((n) => ({ ...n, reason: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              {NDR_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reschedule Date</label>
            <input type="datetime-local" value={ndr.rescheduleDate}
              onChange={(e) => setNdr((n) => ({ ...n, rescheduleDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={ndr.notes}
              onChange={(e) => setNdr((n) => ({ ...n, notes: e.target.value }))}
              placeholder="Additional details…"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setNdrOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">
              Record NDR
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default function Delivery() {
  const shipments = useStore((s) => s.shipments)
  const [tab, setTab] = useState('pending')

  const outForDelivery = shipments.filter((s) => s.status === 'Out for Delivery' || s.status === 'DRS Assigned')
  const delivered      = shipments.filter((s) => s.status === 'Delivered')
  const ndr            = shipments.filter((s) => s.status === 'Non-Delivery')

  const displayed =
    tab === 'pending' ? outForDelivery :
    tab === 'delivered' ? delivered : ndr

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setTab('pending')}
          className={`rounded-xl border p-4 text-left transition-all ${tab === 'pending' ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white hover:shadow-md'}`}>
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-green-600" />
            <span className="text-sm text-slate-600">Out for Delivery</span>
          </div>
          <p className="text-3xl font-bold text-green-700 mt-1">{outForDelivery.length}</p>
        </button>
        <button onClick={() => setTab('delivered')}
          className={`rounded-xl border p-4 text-left transition-all ${tab === 'delivered' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'bg-white hover:shadow-md'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" />
            <span className="text-sm text-slate-600">Delivered</span>
          </div>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{delivered.length}</p>
        </button>
        <button onClick={() => setTab('ndr')}
          className={`rounded-xl border p-4 text-left transition-all ${tab === 'ndr' ? 'ring-2 ring-red-500 bg-red-50' : 'bg-white hover:shadow-md'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-slate-600">Non-Delivery (NDR)</span>
          </div>
          <p className="text-3xl font-bold text-red-600 mt-1">{ndr.length}</p>
        </button>
      </div>

      {/* Shipment cards */}
      {displayed.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>No shipments in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((s) => <ShipmentCard key={s.awb} shipment={s} />)}
        </div>
      )}
    </div>
  )
}
