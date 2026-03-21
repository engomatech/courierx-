/**
 * ExceptionModal — Report a damage / exception on a shipment
 *
 * Shared component used from HubInbound, Delivery, and anywhere else
 * in the ops pipeline where a staff member might encounter a damaged
 * or exceptional parcel.
 *
 * Props:
 *   awb          {string}   Pre-filled AWB (can be overridden)
 *   location     {string}   Pre-filled location/hub name
 *   holdShipment {boolean}  If true, sets shipment status to On Hold on submit
 *   onClose      {fn}       Called when modal should be dismissed
 */

import { useState, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { useAuthStore } from '../authStore'
import { Modal } from './Modal'
import { Camera, X, AlertOctagon, RotateCcw, Plus } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

export const EXCEPTION_TYPES = [
  { value: 'damaged',       label: 'Damaged',          desc: 'Physical damage to parcel or contents' },
  { value: 'lost',          label: 'Lost',             desc: 'Parcel cannot be located' },
  { value: 'wrong_item',    label: 'Wrong Item',       desc: 'Contents do not match shipment description' },
  { value: 'short_shipped', label: 'Short Shipped',    desc: 'Fewer items than expected' },
  { value: 'tampered',      label: 'Tampered',         desc: 'Evidence of unauthorised opening' },
  { value: 'other',         label: 'Other',            desc: 'Any other exception' },
]

export const EXCEPTION_SEVERITIES = [
  { value: 'minor',       label: 'Minor',       color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'major',       label: 'Major',       color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 'total_loss',  label: 'Total Loss',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
]

export const EXCEPTION_TYPE_META = {
  damaged      : { label: 'Damaged',       badgeBg: 'bg-orange-100 text-orange-700' },
  lost         : { label: 'Lost',          badgeBg: 'bg-red-100 text-red-700' },
  wrong_item   : { label: 'Wrong Item',    badgeBg: 'bg-purple-100 text-purple-700' },
  short_shipped: { label: 'Short Shipped', badgeBg: 'bg-amber-100 text-amber-700' },
  tampered     : { label: 'Tampered',      badgeBg: 'bg-rose-100 text-rose-700' },
  other        : { label: 'Other',         badgeBg: 'bg-slate-100 text-slate-600' },
}

export const EXCEPTION_SEV_META = {
  minor      : { label: 'Minor',      badgeBg: 'bg-yellow-100 text-yellow-700' },
  major      : { label: 'Major',      badgeBg: 'bg-orange-100 text-orange-700' },
  total_loss : { label: 'Total Loss', badgeBg: 'bg-red-100 text-red-700' },
}

const MAX_PHOTOS = 3

// ── Inline photo capture ──────────────────────────────────────────────────────

function PhotoThumb({ src, onRemove }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 w-24 h-24 shrink-0">
      <img src={src} alt="Exception photo" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition-colors"
      >
        <X size={10} />
      </button>
    </div>
  )
}

function AddPhotoBtn({ onAdd, disabled }) {
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
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
      onAdd(canvas.toDataURL('image/jpeg', 0.75))
      // Reset so same file can be picked again
      if (fileRef.current) fileRef.current.value = ''
    }
    img.src = url
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <Plus size={18} className="mb-0.5" />
        <span className="text-xs">Add photo</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ExceptionModal({ awb: initialAwb = '', location = '', holdShipment = false, onClose }) {
  const reportException = useStore((s) => s.reportException)
  const user            = useAuthStore((s) => s.user)

  const [awb,         setAwb]         = useState(initialAwb)
  const [type,        setType]        = useState('damaged')
  const [severity,    setSeverity]    = useState('minor')
  const [description, setDescription] = useState('')
  const [photos,      setPhotos]      = useState([])
  const [loc,         setLoc]         = useState(location)
  const [hold,        setHold]        = useState(holdShipment)

  const addPhoto   = (src) => setPhotos((p) => [...p, src].slice(0, MAX_PHOTOS))
  const removePhoto = (i)  => setPhotos((p) => p.filter((_, idx) => idx !== i))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!awb.trim()) return
    reportException(
      awb.trim().toUpperCase(),
      {
        type, severity, description, photos,
        reportedBy: user?.name || 'Ops',
        location  : loc,
      },
      hold
    )
    onClose()
  }

  const sevMeta = EXCEPTION_SEVERITIES.find((s) => s.value === severity)

  return (
    <Modal open onClose={onClose} title="Report Exception" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* AWB */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">AWB / Tracking Number *</label>
          <input
            required
            value={awb}
            onChange={(e) => setAwb(e.target.value.toUpperCase())}
            placeholder="e.g. CX9001234567"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Exception Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {EXCEPTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-0.5">
              {EXCEPTION_TYPES.find((t) => t.value === type)?.desc}
            </p>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Severity *</label>
            <div className="space-y-1.5">
              {EXCEPTION_SEVERITIES.map((s) => (
                <label key={s.value}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    severity === s.value ? s.bg + ' ' + s.color + ' font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <input
                    type="radio"
                    name="severity"
                    value={s.value}
                    checked={severity === s.value}
                    onChange={() => setSeverity(s.value)}
                    className="accent-orange-500"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Location / Hub</label>
          <input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="e.g. LAX Hub, Warehouse B"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the damage or exception in detail — box crushed on one corner, moisture damage to contents, seal broken, etc."
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Photos <span className="font-normal text-slate-400">(up to {MAX_PHOTOS})</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            {photos.map((src, i) => (
              <PhotoThumb key={i} src={src} onRemove={() => removePhoto(i)} />
            ))}
            {photos.length < MAX_PHOTOS && (
              <AddPhotoBtn onAdd={addPhoto} disabled={photos.length >= MAX_PHOTOS} />
            )}
          </div>
          {photos.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              <Camera size={10} className="inline mr-1" />
              Attach photos to support the exception report
            </p>
          )}
        </div>

        {/* Hold toggle */}
        <label className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
          hold ? 'bg-red-50 border-red-200' : 'border-slate-200 hover:bg-slate-50'
        }`}>
          <input
            type="checkbox"
            checked={hold}
            onChange={(e) => setHold(e.target.checked)}
            className="mt-0.5 accent-red-500"
          />
          <div>
            <p className={`text-sm font-medium ${hold ? 'text-red-700' : 'text-slate-700'}`}>
              Put shipment on hold
            </p>
            <p className="text-xs text-slate-400">Shipment status will change to "On Hold" until the exception is resolved</p>
          </div>
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit"
            className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <AlertOctagon size={15} />
            Report Exception
          </button>
        </div>
      </form>
    </Modal>
  )
}
