import { useState, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { ExceptionModal } from '../components/ExceptionModal'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, NDR_REASONS } from '../utils'
import { CheckSquare, AlertTriangle, CheckCircle, XCircle, Phone, MapPin, User, Camera, PenLine, RotateCcw, AlertOctagon } from 'lucide-react'

// ── Signature Pad ──────────────────────────────────────────────────────────────
function SignaturePad({ onChange }) {
  const canvasRef   = useRef(null)
  const isDrawing   = useRef(false)
  const hasDrawn    = useRef(false)
  const lastPos     = useRef(null)

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current   = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
  }

  const draw = (e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
    hasDrawn.current = true
  }

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (hasDrawn.current) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }, [onChange])

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    onChange(null)
  }

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden bg-white border-2 border-slate-200 hover:border-emerald-400 transition-colors touch-none select-none"
        style={{ cursor: 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          width={560}
          height={150}
          style={{ display: 'block', width: '100%', height: '150px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-slate-400 flex items-center gap-1"><PenLine size={11} /> Draw signature above</span>
        <button type="button" onClick={clear}
          className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
          <RotateCcw size={11} /> Clear
        </button>
      </div>
    </div>
  )
}

// ── Photo Capture ──────────────────────────────────────────────────────────────
function PhotoCapture({ value, onChange }) {
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Resize + compress to keep localStorage manageable
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1024
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else       { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      onChange(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  }

  return (
    <div>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-emerald-200">
          <img src={value} alt="POD photo" className="w-full h-36 object-cover" />
          <button type="button" onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = '' }}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center shadow transition-colors">
            ×
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-lg p-5 text-center text-slate-400 hover:text-emerald-500 transition-colors group">
          <Camera size={22} className="mx-auto mb-1.5" />
          <span className="text-xs">Tap to take photo or choose from gallery</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}

// ── Shipment Card ──────────────────────────────────────────────────────────────
function ShipmentCard({ shipment, onAWBClick }) {
  const recordPOD = useStore((s) => s.recordPOD)
  const recordNDR = useStore((s) => s.recordNDR)

  const [podOpen, setPodOpen]       = useState(false)
  const [ndrOpen, setNdrOpen]       = useState(false)
  const [excOpen, setExcOpen]       = useState(false)
  const [sigError, setSigError]     = useState(false)
  const [pod, setPod] = useState({
    recipientName : '',
    mobile        : '',
    notes         : '',
    signatureData : null,
    photoData     : null,
  })
  const [ndr, setNdr] = useState({ reason: NDR_REASONS[0], rescheduleDate: '', notes: '' })

  const handlePOD = (e) => {
    e.preventDefault()
    if (!pod.signatureData) { setSigError(true); return }
    setSigError(false)
    recordPOD(shipment.awb, pod)
    setPodOpen(false)
  }

  const handleNDR = (e) => {
    e.preventDefault()
    recordNDR(shipment.awb, ndr)
    setNdrOpen(false)
  }

  const openPod = () => {
    setPod({ recipientName: '', mobile: '', notes: '', signatureData: null, photoData: null })
    setSigError(false)
    setPodOpen(true)
  }

  const canAct = shipment.status === 'Out for Delivery' || shipment.status === 'DRS Assigned'

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <button onClick={() => onAWBClick && onAWBClick(shipment.awb)} className="font-mono text-sm font-bold text-cyan-700 hover:text-cyan-900 hover:underline text-left">{shipment.awb}</button>
            <div className="mt-0.5"><StatusBadge status={shipment.status} /></div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            shipment.serviceType === 'Express'       ? 'bg-orange-100 text-orange-700' :
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
          <div className="mt-3 bg-emerald-50 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle size={13} /> POD Recorded
            </div>
            <p className="text-emerald-600">Signed by: <strong>{shipment.pod.recipientName}</strong></p>
            {shipment.pod.mobile && <p className="text-emerald-600">{shipment.pod.mobile}</p>}
            <p className="text-emerald-500">{formatDate(shipment.pod.timestamp)}</p>
            {shipment.pod.notes && <p className="text-emerald-600 italic">{shipment.pod.notes}</p>}
            {/* Signature thumbnail */}
            {shipment.pod.signatureData && (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-200">
                <p className="text-emerald-500 mb-1 flex items-center gap-1"><PenLine size={10} /> Signature</p>
                <img
                  src={shipment.pod.signatureData}
                  alt="Recipient signature"
                  className="bg-white rounded border border-emerald-200 w-full h-10 object-contain"
                />
              </div>
            )}
            {/* Photo thumbnail */}
            {shipment.pod.photoData && (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-200">
                <p className="text-emerald-500 mb-1 flex items-center gap-1"><Camera size={10} /> Photo</p>
                <img
                  src={shipment.pod.photoData}
                  alt="POD photo"
                  className="rounded border border-emerald-200 w-full h-20 object-cover"
                />
              </div>
            )}
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
            {shipment.ndr.notes && <p className="text-red-600 italic mt-0.5">{shipment.ndr.notes}</p>}
          </div>
        )}

        {canAct && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <button onClick={openPod}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors">
                <CheckCircle size={14} /> Record POD
              </button>
              <button onClick={() => setNdrOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
                <XCircle size={14} /> Record NDR
              </button>
            </div>
            <button onClick={() => setExcOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-xs font-medium transition-colors">
              <AlertOctagon size={13} /> Report Damage / Exception
            </button>
          </div>
        )}
      </div>

      {/* ── POD Modal ── */}
      <Modal open={podOpen} onClose={() => setPodOpen(false)} title={`Record POD — ${shipment.awb}`}>
        <form onSubmit={handlePOD} className="space-y-4">

          {/* Recipient details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Recipient Name *</label>
              <input
                required
                value={pod.recipientName}
                onChange={(e) => setPod((p) => ({ ...p, recipientName: e.target.value }))}
                placeholder="Name of person who received the parcel"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
              <input
                required
                value={pod.mobile}
                onChange={(e) => setPod((p) => ({ ...p, mobile: e.target.value }))}
                placeholder="+260..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Signature pad */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${sigError ? 'text-red-600' : 'text-slate-600'}`}>
              Recipient Signature *
              {sigError && <span className="ml-2 font-normal text-red-500">— please sign before confirming</span>}
            </label>
            <div className={sigError ? 'ring-2 ring-red-400 rounded-lg' : ''}>
              <SignaturePad
                onChange={(sig) => { setPod((p) => ({ ...p, signatureData: sig })); if (sig) setSigError(false) }}
              />
            </div>
          </div>

          {/* Photo capture */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Delivery Photo <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <PhotoCapture
              value={pod.photoData}
              onChange={(photo) => setPod((p) => ({ ...p, photoData: photo }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={pod.notes}
              onChange={(e) => setPod((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Left at door, handed to concierge, etc."
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setPodOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
              Confirm Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Exception Modal ── */}
      {excOpen && (
        <ExceptionModal
          awb={shipment.awb}
          location={shipment.receiver?.city || ''}
          holdShipment={true}
          onClose={() => setExcOpen(false)}
        />
      )}

      {/* ── NDR Modal ── */}
      <Modal open={ndrOpen} onClose={() => setNdrOpen(false)} title={`Record NDR — ${shipment.awb}`}>
        <form onSubmit={handleNDR} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
            <select
              value={ndr.reason}
              onChange={(e) => setNdr((n) => ({ ...n, reason: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              {NDR_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reschedule Date</label>
            <input
              type="datetime-local"
              value={ndr.rescheduleDate}
              onChange={(e) => setNdr((n) => ({ ...n, rescheduleDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={ndr.notes}
              onChange={(e) => setNdr((n) => ({ ...n, notes: e.target.value }))}
              placeholder="Additional details…"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setNdrOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
              Record NDR
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Delivery() {
  const shipments = useStore((s) => s.shipments)
  const [tab, setTab] = useState('pending')
  const [activeAWB, setActiveAWB] = useState(null)

  const outForDelivery = shipments.filter((s) => s.status === 'Out for Delivery' || s.status === 'DRS Assigned')
  const delivered      = shipments.filter((s) => s.status === 'Delivered')
  const ndr            = shipments.filter((s) => s.status === 'Non-Delivery')

  const displayed =
    tab === 'pending'   ? outForDelivery :
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
          {displayed.map((s) => <ShipmentCard key={s.awb} shipment={s} onAWBClick={setActiveAWB} />)}
        </div>
      )}
      {activeAWB && <ShipmentDetailDrawer awb={activeAWB} onClose={() => setActiveAWB(null)} />}
    </div>
  )
}
