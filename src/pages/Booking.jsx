import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { LabelModal } from '../components/LabelModal'
import { ShipmentDetailDrawer } from '../components/ShipmentDetailDrawer'
import { formatDate, SERVICE_TYPES, CITIES, COUNTRIES, PAYMENT_TYPES, BILL_TO_OPTIONS } from '../utils'
import {
  Plus, Search, Package, Flame, Scissors, Pill, Skull,
  Radiation, PawPrint, Banknote, Tag, BatteryCharging,
  Wind, Wine, AlertTriangle, Bomb, Sword, ShieldAlert,
  CheckCircle2, ShieldX, Printer, Download, ArrowRight,
} from 'lucide-react'

// ── CSV Export helper ───────────────────────────────────────
function exportToCSV(shipments) {
  const cols = [
    'HAWB', 'AWB', 'Status', 'Service', 'Payment Type', 'Bill To', 'Insured',
    'Sender Name', 'Sender Phone', 'Sender City', 'Sender Country',
    'Receiver Name', 'Receiver Phone', 'Receiver City', 'Receiver Country',
    'Weight (kg)', 'Pieces', 'Dimensions (LxWxH cm)', 'Vol. Weight (kg)', 'Chargeable (kg)',
    'Description of Goods', 'Package Value (ZMW)',
    'Supplier Name', 'Supplier Tracking No.',
    'Expected Delivery', 'Booked At',
  ]
  const rows = shipments.map(s => {
    const l = s.dimensions?.l || 0, w = s.dimensions?.w || 0, h = s.dimensions?.h || 0
    const vol = l && w && h ? ((l * w * h) / 5000).toFixed(2) : ''
    const chargeable = vol ? Math.max(s.weight || 0, parseFloat(vol)).toFixed(2) : s.weight || ''
    return [
      s.hawb || '', s.awb || '', s.status, s.serviceType, s.paymentType || '', s.billTo || '',
      s.insured ? 'Yes' : 'No',
      s.sender?.name, s.sender?.phone, s.sender?.city, s.sender?.country,
      s.receiver?.name, s.receiver?.phone, s.receiver?.city, s.receiver?.country,
      s.weight, s.pieces || 1,
      l && w && h ? `${l}x${w}x${h}` : '',
      vol, chargeable,
      s.goodsDescription || '', s.goodsValue || '',
      s.supplierName || '', s.supplierTrackingNo || '',
      s.expectedDelivery || '', s.createdAt || '',
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
  })
  const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shipments_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Prohibited items data ──────────────────────────────────
const PROHIBITED = [
  { icon: Bomb,            label: 'Explosives & Fireworks' },
  { icon: Flame,           label: 'Flammable Liquids & Gases' },
  { icon: Sword,           label: 'Weapons & Firearms' },
  { icon: Scissors,        label: 'Sharp Objects & Knives' },
  { icon: Pill,            label: 'Illegal Narcotics & Drugs' },
  { icon: Skull,           label: 'Toxic & Poisonous Substances' },
  { icon: Radiation,       label: 'Radioactive Materials' },
  { icon: PawPrint,        label: 'Live Animals & Plants' },
  { icon: Banknote,        label: 'Currency & Negotiable Items' },
  { icon: Tag,             label: 'Counterfeit Goods' },
  { icon: BatteryCharging, label: 'Lithium Batteries >100 Wh' },
  { icon: Wind,            label: 'Pressurised Aerosols' },
  { icon: Wine,            label: 'Alcohol & Tobacco' },
  { icon: AlertTriangle,   label: 'Perishable Goods (Unpackaged)' },
  { icon: ShieldAlert,     label: 'Hazardous Chemicals' },
]

// ── Prohibition circle icon ────────────────────────────────
function ProhibitedSign({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center group">
      {/* Circle + diagonal */}
      <div className="relative w-[72px] h-[72px]">
        {/* Background fill */}
        <div className="absolute inset-0 rounded-full bg-red-50" />
        {/* Thick red border ring */}
        <div className="absolute inset-0 rounded-full border-[5px] border-red-600" />
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={30} className="text-slate-700" strokeWidth={1.5} />
        </div>
        {/* Diagonal red bar — rotated across the circle */}
        <div
          className="absolute left-0 right-0 top-1/2 h-[5px] bg-red-600 -translate-y-1/2"
          style={{ transform: 'translateY(-50%) rotate(-45deg)', width: '100%' }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide leading-tight w-[80px]">
        {label}
      </span>
    </div>
  )
}

// ── Prohibited items modal ─────────────────────────────────
function ProhibitedModal({ open, onClose, onAgree }) {
  const [checked, setChecked] = useState(false)

  const handleClose = () => {
    setChecked(false)
    onClose()
  }
  const handleAgree = () => {
    setChecked(false)
    onAgree()
  }

  return (
    <Modal open={open} onClose={handleClose} title="" size="xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 -mt-1">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 shrink-0">
          <ShieldX size={24} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Prohibited & Restricted Items</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            As required by international shipping regulations, the following items are
            <span className="font-semibold text-red-600"> strictly prohibited </span>
            from being shipped. Violations may result in legal prosecution.
          </p>
        </div>
      </div>

      {/* Legal reference strip */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800 mb-5 flex items-center gap-2">
        <AlertTriangle size={14} className="shrink-0 text-amber-600" />
        Regulations: IATA Dangerous Goods Regulations · ICAO Technical Instructions ·
        Local Customs & Import/Export Laws · UN Model Regulations on Transport of Dangerous Goods
      </div>

      {/* Grid of prohibited items */}
      <div className="grid grid-cols-5 gap-x-3 gap-y-5 mb-6">
        {PROHIBITED.map((item) => (
          <ProhibitedSign key={item.label} icon={item.icon} label={item.label} />
        ))}
      </div>

      {/* Acknowledgment */}
      <div className="border-t pt-4">
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              checked ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white group-hover:border-green-400'
            }`}>
              {checked && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
            </div>
          </div>
          <span className="text-sm text-slate-700 leading-snug">
            I confirm that my shipment <strong>does not contain</strong> any of the above prohibited or
            restricted items, and I understand that I am legally liable for the contents of my shipment.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAgree}
          disabled={!checked}
          className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-colors ${
            checked
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 size={15} />
          I Agree &amp; Continue to Booking
        </button>
      </div>
    </Modal>
  )
}

// ── Form helpers ───────────────────────────────────────────
const EMPTY_FORM = {
  serviceType: 'Standard',
  weight: '',
  pieces: '',
  dimensions: { l: '', w: '', h: '' },
  goodsDescription: '',
  goodsValue: '',
  paymentType: 'Prepaid',
  billTo: 'Sender',
  insured: false,
  expectedDelivery: '',
  supplierName: '',
  supplierTrackingNo: '',
  sender:   { name: '', address: '', city: 'Lusaka', country: 'Zambia', phone: '' },
  receiver: { name: '', address: '', city: 'Lusaka', country: 'Zambia', phone: '' },
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        {...props}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function Booking() {
  const navigate        = useNavigate()
  const shipments       = useStore((s) => s.shipments)
  const addShipment     = useStore((s) => s.addShipment)
  const confirmShipment = useStore((s) => s.confirmShipment)

  const [prohibitedOpen, setProhibitedOpen] = useState(false)
  const [open, setOpen]           = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastHAWB, setLastHAWB]   = useState(null)
  const [confirmedAWB, setConfirmedAWB] = useState(null)
  const [labelShipment, setLabelShipment] = useState(null)
  const [detailAWB, setDetailAWB] = useState(null)

  const awaitingConfirm = shipments.filter((s) => s.status === 'Booked').length
  const confirmed       = shipments.filter((s) => s.status === 'Confirmed').length

  const filtered = shipments
    .filter((s) => {
      const matchSearch =
        !search ||
        (s.hawb || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.awb || '').toLowerCase().includes(search.toLowerCase()) ||
        s.sender.name.toLowerCase().includes(search.toLowerCase()) ||
        s.receiver.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'booked'     && s.status === 'Booked') ||
        (statusFilter === 'confirmed'  && s.status === 'Confirmed')
      return matchSearch && matchStatus
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const set = (path, value) => {
    setForm((prev) => {
      const parts = path.split('.')
      if (parts.length === 1) return { ...prev, [path]: value }
      if (parts.length === 2) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } }
      if (parts.length === 3)
        return {
          ...prev,
          [parts[0]]: { ...prev[parts[0]], [parts[1]]: { ...prev[parts[0]][parts[1]], [parts[2]]: value } },
        }
      return prev
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const hawb = addShipment({
      ...form,
      weight:    parseFloat(form.weight),
      pieces:    form.pieces ? parseInt(form.pieces) : 1,
      goodsValue: form.goodsValue ? parseFloat(form.goodsValue) : null,
      dimensions: {
        l: parseFloat(form.dimensions.l),
        w: parseFloat(form.dimensions.w),
        h: parseFloat(form.dimensions.h),
      },
    })
    setLastHAWB(hawb)
    setConfirmedAWB(null)
    setOpen(false)
    setForm(EMPTY_FORM)
  }

  const handleConfirm = (hawb) => {
    const awb = confirmShipment(hawb)
    setConfirmedAWB(awb)
    setLastHAWB(null)
  }

  return (
    <div className="space-y-4">
      {/* Stage summary pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all',       label: 'All',               count: shipments.length },
          { key: 'booked',    label: '⏳ Awaiting Confirm', count: awaitingConfirm, urgent: awaitingConfirm > 0 },
          { key: 'confirmed', label: '✓ Confirmed → PRS',  count: confirmed },
        ].map(({ key, label, count, urgent }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === key
                ? 'bg-blue-600 text-white border-blue-600'
                : urgent
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {urgent && statusFilter !== key && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
              </span>
            )}
            {label} <span className={`font-bold ${statusFilter === key ? 'text-white' : ''}`}>{count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AWB / sender / receiver…"
            className="pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button
          onClick={() => exportToCSV(filtered)}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200"
        >
          <Download size={15} /> CSV
        </button>
        <button
          onClick={() => setProhibitedOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
        >
          <Plus size={15} /> New Booking
        </button>
      </div>

      {/* Booking success banner */}
      {lastHAWB && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Package size={20} className="text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-blue-800">Shipment booked — awaiting confirmation</p>
            <p className="text-sm text-blue-700 mt-0.5">
              HAWB: <span className="font-mono font-bold">{lastHAWB}</span>
              <span className="ml-3 text-blue-500 text-xs">Click Confirm below to assign AWB and move to PRS</span>
            </p>
          </div>
          <button onClick={() => setLastHAWB(null)} className="text-blue-400 hover:text-blue-600 text-xs shrink-0">✕</button>
        </div>
      )}

      {/* Confirmation success banner — with next-step handoff */}
      {confirmedAWB && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-800">Confirmed — AWB assigned ✓</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              AWB: <span className="font-mono font-bold">{confirmedAWB}</span>
              <span className="ml-3 text-emerald-600 text-xs">Ready for collection — assign to a PRS run</span>
            </p>
          </div>
          <button
            onClick={() => setLabelShipment(shipments.find((s) => s.awb === confirmedAWB) || null)}
            className="flex items-center gap-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg shrink-0"
          >
            <Printer size={14} /> Label
          </button>
          <button
            onClick={() => { setConfirmedAWB(null); navigate('/prs') }}
            className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shrink-0"
          >
            Assign to PRS <ArrowRight size={14} />
          </button>
          <button onClick={() => setConfirmedAWB(null)} className="text-emerald-400 hover:text-emerald-600 text-xs shrink-0">✕</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">{filtered.length} shipments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                {['HAWB / AWB', 'Sender', 'Receiver', 'Goods', 'Service', 'Weight', 'Payment', 'Status', 'Booked At', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.hawb || s.awb} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {/* HAWB is always shown — primary booking reference */}
                    <button
                      onClick={() => setDetailAWB(s.hawb || s.awb)}
                      className="font-mono font-medium text-blue-600 text-xs hover:text-blue-800 hover:underline underline-offset-2 text-left block"
                    >
                      {s.hawb || s.awb}
                    </button>
                    {/* AWB only shown once confirmed */}
                    {s.awb
                      ? <div className="text-slate-500 font-mono text-xs mt-0.5">AWB: {s.awb}</div>
                      : <div className="text-amber-500 text-xs mt-0.5 italic">AWB pending</div>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{s.sender.name}</div>
                    <div className="text-slate-400 text-xs">{s.sender.city}, {s.sender.country}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{s.receiver.name}</div>
                    <div className="text-slate-400 text-xs">{s.receiver.city}, {s.receiver.country}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[140px]">
                    <div className="text-sm text-slate-700 truncate">{s.goodsDescription || '—'}</div>
                    {s.pieces && <div className="text-slate-400 text-xs">{s.pieces} pcs</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      s.serviceType === 'Express' ? 'bg-orange-100 text-orange-700' :
                      s.serviceType === 'International' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{s.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{s.weight} kg</td>
                  <td className="px-4 py-3">
                    {s.paymentType && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.paymentType === 'Cash' ? 'bg-amber-100 text-amber-700' :
                        s.paymentType === 'Credit' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{s.paymentType}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {s.status === 'Booked' && (
                        <button
                          onClick={() => handleConfirm(s.hawb)}
                          title="Confirm shipment"
                          className="flex items-center gap-1 text-xs text-white bg-sky-600 hover:bg-sky-700 px-2 py-1 rounded-lg transition-colors font-medium"
                        >
                          <CheckCircle2 size={12} /> Confirm
                        </button>
                      )}
                      {s.status === 'Confirmed' && (
                        <button
                          onClick={() => navigate('/prs')}
                          title="Assign to PRS"
                          className="flex items-center gap-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-lg transition-colors font-medium"
                        >
                          <ArrowRight size={12} /> PRS
                        </button>
                      )}
                      {s.awb && (
                        <button
                          onClick={() => setLabelShipment(s)}
                          title="Print label"
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Printer size={13} /> Label
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Label modal */}
      <LabelModal shipment={labelShipment} onClose={() => setLabelShipment(null)} />

      {/* Shipment detail drawer */}
      <ShipmentDetailDrawer awb={detailAWB} onClose={() => setDetailAWB(null)} />

      {/* Step 1: Prohibited items warning */}
      <ProhibitedModal
        open={prohibitedOpen}
        onClose={() => setProhibitedOpen(false)}
        onAgree={() => {
          setProhibitedOpen(false)
          setOpen(true)
        }}
      />

      {/* Step 2: Booking form */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Shipment Booking" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Service & Payment */}
          <div className="grid grid-cols-3 gap-3">
            <Select label="Service Type" value={form.serviceType}
              onChange={(e) => set('serviceType', e.target.value)} options={SERVICE_TYPES} />
            <Select label="Payment Type" value={form.paymentType}
              onChange={(e) => set('paymentType', e.target.value)} options={PAYMENT_TYPES} />
            <Select label="Bill To" value={form.billTo}
              onChange={(e) => set('billTo', e.target.value)} options={BILL_TO_OPTIONS} />
          </div>

          {/* Package dimensions */}
          <div className="border rounded-xl p-4 space-y-3 bg-slate-50">
            <h3 className="font-medium text-slate-700 text-sm">Package Details</h3>
            <div className="grid grid-cols-5 gap-3">
              <Input label="Weight (kg)" type="number" step="0.1" required min="0.1"
                value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              <Input label="Pieces" type="number" min="1" placeholder="1"
                value={form.pieces} onChange={(e) => set('pieces', e.target.value)} />
              <Input label="Length (cm)" type="number" required min="1"
                value={form.dimensions.l} onChange={(e) => set('dimensions.l', e.target.value)} />
              <Input label="Width (cm)" type="number" required min="1"
                value={form.dimensions.w} onChange={(e) => set('dimensions.w', e.target.value)} />
              <Input label="Height (cm)" type="number" required min="1"
                value={form.dimensions.h} onChange={(e) => set('dimensions.h', e.target.value)} />
            </div>
            {form.dimensions.l && form.dimensions.w && form.dimensions.h && (
              <p className="text-xs text-slate-500">
                Vol. weight: <strong>{((form.dimensions.l * form.dimensions.w * form.dimensions.h) / 5000).toFixed(2)} kg</strong>
                {form.weight && (
                  <span className="ml-3">Chargeable: <strong className="text-blue-600">
                    {Math.max(parseFloat(form.weight) || 0, (form.dimensions.l * form.dimensions.w * form.dimensions.h) / 5000).toFixed(2)} kg
                  </strong></span>
                )}
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Input label="Description of Goods" required placeholder="e.g. Clothing, Electronics"
                value={form.goodsDescription} onChange={(e) => set('goodsDescription', e.target.value)} />
              <Input label="Package Value (ZMW)" type="number" step="0.01" placeholder="0.00"
                value={form.goodsValue} onChange={(e) => set('goodsValue', e.target.value)} />
              <Input label="Expected Delivery Date" type="date"
                value={form.expectedDelivery} onChange={(e) => set('expectedDelivery', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.insured}
                  onChange={(e) => set('insured', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-600">Insured shipment</span>
              </label>
            </div>
          </div>

          {/* Supplier info (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Supplier Name (optional)" placeholder="e.g. Alibaba Seller"
              value={form.supplierName} onChange={(e) => set('supplierName', e.target.value)} />
            <Input label="Supplier Tracking No. (optional)" placeholder="e.g. YT1234567890CN"
              value={form.supplierTrackingNo} onChange={(e) => set('supplierTrackingNo', e.target.value)} />
          </div>

          {/* Sender */}
          <div className="border rounded-xl p-4 space-y-3 bg-blue-50 border-blue-100">
            <h3 className="font-medium text-blue-700 text-sm">Sender / Shipper</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name / Company" required value={form.sender.name}
                onChange={(e) => set('sender.name', e.target.value)} />
              <Input label="Phone" required value={form.sender.phone}
                onChange={(e) => set('sender.phone', e.target.value)} />
              <Input label="Address" required value={form.sender.address}
                onChange={(e) => set('sender.address', e.target.value)} />
              <Select label="City" value={form.sender.city}
                onChange={(e) => set('sender.city', e.target.value)} options={CITIES} />
              <Select label="Country" value={form.sender.country}
                onChange={(e) => set('sender.country', e.target.value)} options={COUNTRIES} />
            </div>
          </div>

          {/* Receiver */}
          <div className="border rounded-xl p-4 space-y-3 bg-green-50 border-green-100">
            <h3 className="font-medium text-green-700 text-sm">Receiver / Consignee</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name / Company" required value={form.receiver.name}
                onChange={(e) => set('receiver.name', e.target.value)} />
              <Input label="Phone" required value={form.receiver.phone}
                onChange={(e) => set('receiver.phone', e.target.value)} />
              <Input label="Address" required value={form.receiver.address}
                onChange={(e) => set('receiver.address', e.target.value)} />
              <Select label="City" value={form.receiver.city}
                onChange={(e) => set('receiver.city', e.target.value)} options={CITIES} />
              <Select label="Country" value={form.receiver.country}
                onChange={(e) => set('receiver.country', e.target.value)} options={COUNTRIES} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Book Shipment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
