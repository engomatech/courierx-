import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { NDR_REASONS } from '../../utils'
import {
  ArrowLeft, Phone, MapPin, Package, CheckCircle2,
  XCircle, PenLine, RotateCcw, Camera, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Signature pad (touch + mouse) ─────────────────────────────
function SignaturePad({ onChange }) {
  const canvasRef  = useRef(null)
  const drawing    = useRef(false)
  const hasDrawn   = useRef(false)
  const lastPos    = useRef(null)

  const getPos = (e) => {
    const r  = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width  / r.width
    const sy = canvasRef.current.height / r.height
    const s  = e.touches ? e.touches[0] : e
    return { x: (s.clientX - r.left) * sx, y: (s.clientY - r.top) * sy }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current  = true
    lastPos.current  = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current  = pos
    hasDrawn.current = true
  }

  const end = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    if (hasDrawn.current) onChange(canvasRef.current.toDataURL('image/png'))
  }, [onChange])

  const clear = () => {
    const cv  = canvasRef.current
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, cv.width, cv.height)
    hasDrawn.current = false
    onChange(null)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={340} height={120}
        className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-white touch-none"
        style={{ touchAction: 'none' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="absolute top-2 right-2 p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600"
      >
        <RotateCcw size={12} />
      </button>
      <p className="text-center text-[10px] text-slate-400 mt-1">Sign above</p>
    </div>
  )
}

// ── Compress & capture photo ───────────────────────────────────
function usePhotoCapture(onCapture) {
  const inputRef = useRef(null)

  const trigger = () => inputRef.current?.click()

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader  = new FileReader()
    reader.onload = (ev) => {
      const img  = new Image()
      img.onload = () => {
        const MAX = 1024
        let { width: w, height: h } = img
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else       { w = Math.round(w * MAX / h); h = MAX }
        }
        const cv  = document.createElement('canvas')
        cv.width  = w
        cv.height = h
        cv.getContext('2d').drawImage(img, 0, 0, w, h)
        onCapture(cv.toDataURL('image/jpeg', 0.75))
        e.target.value = ''
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const Input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handleChange}
    />
  )

  return { trigger, Input }
}

// ── POD form ───────────────────────────────────────────────────
function PODForm({ awb, onSubmit, onCancel }) {
  const [name, setSig]      = useState('')
  const [sigData, setSigData] = useState(null)
  const [photo, setPhoto]     = useState(null)

  const { trigger: capturePhoto, Input: PhotoInput } = usePhotoCapture(setPhoto)

  const valid = name.trim() && sigData

  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <PenLine size={16} className="text-green-600" /> Proof of Delivery
      </h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Recipient name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Person who received the parcel"
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Signature *</label>
        <SignaturePad onChange={setSigData} />
      </div>

      {/* Photo */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Photo (optional)</label>
        {photo ? (
          <div className="relative inline-block">
            <img src={photo} alt="delivery" className="h-24 rounded-xl object-cover border" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 text-white rounded-full text-xs flex items-center justify-center"
            >✕</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={capturePhoto}
            className="flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-500 hover:border-green-400 hover:text-green-600 w-full justify-center"
          >
            <Camera size={16} /> Take Photo
          </button>
        )}
        {PhotoInput}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSubmit({ recipientName: name, signatureData: sigData, photoData: photo })}
          className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold"
        >
          Confirm Delivery
        </button>
      </div>
    </div>
  )
}

// ── NDR form ───────────────────────────────────────────────────
function NDRForm({ onSubmit, onCancel }) {
  const [reason, setReason] = useState('')

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 space-y-3">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <XCircle size={16} className="text-red-500" /> Non-Delivery Reason
      </h3>

      <div className="space-y-2">
        {NDR_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="ndr"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-red-500"
            />
            <span className="text-sm text-slate-700">{r}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!reason}
          onClick={() => onSubmit({ reason })}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold"
        >
          Record NDR
        </button>
      </div>
    </div>
  )
}

// ── Single shipment card ───────────────────────────────────────
const DONE_STATUSES = ['Delivered', 'Non-Delivery']

function ShipmentCard({ shipment }) {
  const recordPOD = useStore((s) => s.recordPOD)
  const recordNDR = useStore((s) => s.recordNDR)

  const [mode, setMode]       = useState(null) // null | 'pod' | 'ndr'
  const [expanded, setExpanded] = useState(false)

  const isDone    = DONE_STATUSES.includes(shipment.status)
  const isActive  = shipment.status === 'Out for Delivery'

  const statusColor = {
    'Delivered':        'bg-emerald-100 text-emerald-700',
    'Non-Delivery':     'bg-red-100    text-red-700',
    'Out for Delivery': 'bg-blue-100   text-blue-700',
    'DRS Assigned':     'bg-slate-100  text-slate-600',
  }[shipment.status] || 'bg-slate-100 text-slate-600'

  const handlePOD = (podData) => {
    recordPOD(shipment.awb, podData)
    setMode(null)
  }

  const handleNDR = (ndrData) => {
    recordNDR(shipment.awb, ndrData)
    setMode(null)
  }

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDone ? 'opacity-70' : 'bg-white'}`}>
      {/* Card header */}
      <div
        className={`px-4 py-3 flex items-start gap-3 cursor-pointer ${isDone ? 'bg-slate-50' : 'bg-white'}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm truncate">{shipment.receiver.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {shipment.status}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin size={11} /> {shipment.receiver.address}, {shipment.receiver.city}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-slate-400 shrink-0 mt-0.5" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 pb-3 pt-2 bg-slate-50 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            <Phone size={13} className="text-slate-400" />
            <a
              href={`tel:${shipment.receiver.phone}`}
              className="text-blue-600 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {shipment.receiver.phone}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Package size={12} className="text-slate-400" />
            <span className="font-mono">{shipment.awb}</span>
            <span>·</span>
            <span>{shipment.weight} kg</span>
            <span>·</span>
            <span>{shipment.serviceType}</span>
          </div>

          {/* NDR detail */}
          {shipment.status === 'Non-Delivery' && shipment.ndr && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-1">
              <p className="text-xs font-medium text-red-700">NDR: {shipment.ndr.reason}</p>
            </div>
          )}

          {/* POD detail */}
          {shipment.status === 'Delivered' && shipment.pod && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-1">
              <p className="text-xs font-medium text-emerald-700">Signed by: {shipment.pod.recipientName}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons for active shipments */}
      {isActive && mode === null && (
        <div className="flex gap-2 px-4 pb-4 border-t pt-3 bg-white">
          <button
            onClick={() => setMode('pod')}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl"
          >
            <CheckCircle2 size={15} /> Delivered
          </button>
          <button
            onClick={() => setMode('ndr')}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl"
          >
            <XCircle size={15} /> Failed
          </button>
        </div>
      )}

      {/* Inline POD form */}
      {mode === 'pod' && (
        <div className="px-4 pb-4 border-t pt-3">
          <PODForm awb={shipment.awb} onSubmit={handlePOD} onCancel={() => setMode(null)} />
        </div>
      )}

      {/* Inline NDR form */}
      {mode === 'ndr' && (
        <div className="px-4 pb-4 border-t pt-3">
          <NDRForm onSubmit={handleNDR} onCancel={() => setMode(null)} />
        </div>
      )}
    </div>
  )
}

// ── Run summary bar ────────────────────────────────────────────
function SummaryBar({ drsShipments }) {
  const delivered = drsShipments.filter((s) => s.status === 'Delivered').length
  const ndr       = drsShipments.filter((s) => s.status === 'Non-Delivery').length
  const pending   = drsShipments.filter((s) =>
    !['Delivered', 'Non-Delivery'].includes(s.status)
  ).length
  const total     = drsShipments.length
  const pct       = total > 0 ? Math.round(((delivered + ndr) / total) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{delivered + ndr} of {total} done</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-around text-center text-xs">
        <div><div className="font-bold text-green-700 text-lg">{delivered}</div><div className="text-slate-400">Delivered</div></div>
        <div><div className="font-bold text-red-500 text-lg">{ndr}</div><div className="text-slate-400">NDR</div></div>
        <div><div className="font-bold text-slate-700 text-lg">{pending}</div><div className="text-slate-400">Pending</div></div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function DriverRun() {
  const { drsId }    = useParams()
  const navigate     = useNavigate()
  const drs          = useStore((s) => s.drs.find((d) => d.id === drsId))
  const allShipments = useStore((s) => s.shipments)

  if (!drs) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>Run not found.</p>
        <button onClick={() => navigate('/driver')} className="mt-3 text-blue-600 underline text-sm">← Back</button>
      </div>
    )
  }

  const drsShipments = allShipments.filter((s) => drs.shipments.includes(s.awb))

  // Sort: Out for Delivery first, then others, then done
  const sorted = [...drsShipments].sort((a, b) => {
    const pri = (s) =>
      s.status === 'Out for Delivery' ? 0
      : DONE_STATUSES.includes(s.status) ? 2 : 1
    return pri(a) - pri(b)
  })

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate('/driver')}
          className="p-2 rounded-full hover:bg-slate-200 -ml-1"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{drsId}</h1>
          <p className="text-xs text-slate-500">{drs.hub} · {drs.routeCode}</p>
        </div>
      </div>

      {/* Progress summary */}
      <SummaryBar drsShipments={drsShipments} />

      {/* Shipment cards */}
      <div className="space-y-3">
        {sorted.map((s) => (
          <ShipmentCard key={s.awb} shipment={s} />
        ))}
      </div>

      {/* Completed message */}
      {drs.status === 'Completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-emerald-800">Run Complete!</p>
          <p className="text-sm text-emerald-600 mt-1">All stops recorded. Great work!</p>
        </div>
      )}
    </div>
  )
}
