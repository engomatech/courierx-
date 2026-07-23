/**
 * DPEX Inbound Simulation
 * Simulates receiving, bagging, and dispatching inbound items from DPEX.
 * All state is local — no API calls — designed as a training/demo workflow.
 */

import { useState, useRef, useCallback } from 'react'
import {
  Package, Search, CheckCircle2, AlertCircle, Clock, Archive,
  Send, RefreshCw, Truck, MapPin, User, Weight, Box,
  ChevronDown, ChevronUp, X, ScanLine, PackageCheck,
  Loader2, ArrowRight, DownloadCloud, Hash, Globe2,
  BadgeCheck, Layers, ClipboardCheck, PlaneTakeoff,
  BarChart3, Filter, Info,
} from 'lucide-react'

// ── Seed manifest ─────────────────────────────────────────────────────────────
// Represents a single DPEX inbound truck/flight manifest arriving today.
// DPEX AWB format: DPX + 10 digits. OEX assigns its own AWB on receipt.

function makeAwb(n) {
  return `CX9003${String(n).padStart(6, '0')}`
}

const SEED_MANIFEST = [
  {
    id: 1,
    dpexAwb: 'DPX2607160001',
    sender:   { name: 'Shein Global', city: 'Guangzhou', country: 'China' },
    receiver: { name: 'Mwango Phiri', phone: '+260 97 123 4501', address: '15 Cairo Rd, Northmead', city: 'Lusaka' },
    weight: 1.2, pieces: 1, description: 'Clothing & Accessories', value: 45, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 2,
    dpexAwb: 'DPX2607160002',
    sender:   { name: 'Alibaba Logistics', city: 'Shenzhen', country: 'China' },
    receiver: { name: 'Chanda Mulenga', phone: '+260 96 234 5602', address: 'Plot 22 Buchi Rd', city: 'Kitwe' },
    weight: 0.8, pieces: 1, description: 'Phone Accessories', value: 28, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 3,
    dpexAwb: 'DPX2607160003',
    sender:   { name: 'Amazon UK', city: 'London', country: 'United Kingdom' },
    receiver: { name: 'Bwalya Tembo', phone: '+260 95 345 6703', address: '7 Leopards Hill Rd', city: 'Lusaka' },
    weight: 2.4, pieces: 2, description: 'Books & Stationery', value: 75, currency: 'USD',
    serviceType: 'Express',
  },
  {
    id: 4,
    dpexAwb: 'DPX2607160004',
    sender:   { name: 'Jumia SA Warehouse', city: 'Johannesburg', country: 'South Africa' },
    receiver: { name: 'Nsofwa Banda', phone: '+260 97 456 7804', address: '33 Nasser Rd', city: 'Lusaka' },
    weight: 3.1, pieces: 1, description: 'Electronics — Smart Watch', value: 120, currency: 'USD',
    serviceType: 'Express',
  },
  {
    id: 5,
    dpexAwb: 'DPX2607160005',
    sender:   { name: 'iHerb US', city: 'Los Angeles', country: 'USA' },
    receiver: { name: 'Kapambwe Zulu', phone: '+260 96 567 8905', address: 'Stand 41 Chimwemwe', city: 'Kitwe' },
    weight: 4.5, pieces: 3, description: 'Health Supplements', value: 89, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 6,
    dpexAwb: 'DPX2607160006',
    sender:   { name: 'AliExpress Freight', city: 'Shenzhen', country: 'China' },
    receiver: { name: 'Mutale Kalumba', phone: '+260 95 678 9006', address: '8 Buteko Ave', city: 'Ndola' },
    weight: 0.5, pieces: 1, description: 'Hair Products', value: 22, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 7,
    dpexAwb: 'DPX2607160007',
    sender:   { name: 'Dubai Trade Hub', city: 'Dubai', country: 'UAE' },
    receiver: { name: 'Lubuto Musonda', phone: '+260 97 789 0107', address: '19 Kabulonga Rd', city: 'Lusaka' },
    weight: 6.8, pieces: 1, description: 'Auto Spare Parts', value: 340, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 8,
    dpexAwb: 'DPX2607160008',
    sender:   { name: 'Shein Global', city: 'Guangzhou', country: 'China' },
    receiver: { name: 'Nalwimba Siame', phone: '+260 96 890 1208', address: 'Stand 5 Avondale', city: 'Lusaka' },
    weight: 1.8, pieces: 2, description: 'Ladies Fashion', value: 55, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 9,
    dpexAwb: 'DPX2607160009',
    sender:   { name: 'Samsung Electronics', city: 'Seoul', country: 'South Korea' },
    receiver: { name: 'Kondwa Nkonde', phone: '+260 97 901 2309', address: '2 Lilayi Rd', city: 'Lusaka' },
    weight: 0.9, pieces: 1, description: 'Mobile Phone — Galaxy A35', value: 290, currency: 'USD',
    serviceType: 'Express',
  },
  {
    id: 10,
    dpexAwb: 'DPX2607160010',
    sender:   { name: 'Takealot SA', city: 'Cape Town', country: 'South Africa' },
    receiver: { name: 'Mwiza Lungu', phone: '+260 96 012 3410', address: 'Plot 88 Parklands', city: 'Lusaka' },
    weight: 2.2, pieces: 1, description: 'Kitchen Appliance', value: 95, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 11,
    dpexAwb: 'DPX2607160011',
    sender:   { name: 'Amazon US', city: 'Seattle', country: 'USA' },
    receiver: { name: 'Twalumba Mwansa', phone: '+260 95 123 4511', address: '7 Freedom Way', city: 'Kabwe' },
    weight: 1.4, pieces: 1, description: 'Educational Toys', value: 38, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 12,
    dpexAwb: 'DPX2607160012',
    sender:   { name: 'AliExpress Freight', city: 'Yiwu', country: 'China' },
    receiver: { name: 'Mapalo Chibanda', phone: '+260 97 234 5612', address: 'Plot 14 Matero', city: 'Lusaka' },
    weight: 5.0, pieces: 4, description: 'Cosmetics & Beauty', value: 60, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 13,
    dpexAwb: 'DPX2607160013',
    sender:   { name: 'Noon.com UAE', city: 'Dubai', country: 'UAE' },
    receiver: { name: 'Mubanga Chipeta', phone: '+260 96 345 6713', address: '3 Mokambo Rd', city: 'Chingola' },
    weight: 3.6, pieces: 2, description: 'Power Tools', value: 185, currency: 'USD',
    serviceType: 'Express',
  },
  {
    id: 14,
    dpexAwb: 'DPX2607160014',
    sender:   { name: 'Shein Global', city: 'Guangzhou', country: 'China' },
    receiver: { name: 'Chomba Miyanda', phone: '+260 97 456 7814', address: 'Flat 5 Woodlands', city: 'Lusaka' },
    weight: 1.1, pieces: 1, description: "Children's Clothing", value: 32, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 15,
    dpexAwb: 'DPX2607160015',
    sender:   { name: 'Zalando DE', city: 'Berlin', country: 'Germany' },
    receiver: { name: 'Simunji Hakalima', phone: '+260 96 567 8915', address: '55 Masaiti Rd', city: 'Ndola' },
    weight: 2.8, pieces: 3, description: 'Sports Footwear', value: 145, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 16,
    dpexAwb: 'DPX2607160016',
    sender:   { name: 'Alibaba Logistics', city: 'Shenzhen', country: 'China' },
    receiver: { name: 'Loveness Mbewe', phone: '+260 95 678 9016', address: 'House 9 Chainda', city: 'Lusaka' },
    weight: 0.6, pieces: 1, description: 'Earphones & Cables', value: 18, currency: 'USD',
    serviceType: 'Economy',
  },
  {
    id: 17,
    dpexAwb: 'DPX2607160017',
    sender:   { name: 'Takealot SA', city: 'Johannesburg', country: 'South Africa' },
    receiver: { name: 'Nkemdirim Obi', phone: '+260 97 789 0117', address: '12 Rhodes Park', city: 'Lusaka' },
    weight: 4.2, pieces: 1, description: 'Laptop Bag & Accessories', value: 78, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 18,
    dpexAwb: 'DPX2607160018',
    sender:   { name: 'iHerb US', city: 'Perris', country: 'USA' },
    receiver: { name: 'Mundo Sinyangwe', phone: '+260 96 890 1218', address: 'Plot 7 New Kasama', city: 'Lusaka' },
    weight: 3.9, pieces: 2, description: 'Vitamins & Protein Powder', value: 115, currency: 'USD',
    serviceType: 'Standard',
  },
  {
    id: 19,
    dpexAwb: 'DPX2607160019',
    sender:   { name: 'ASOS UK', city: 'London', country: 'United Kingdom' },
    receiver: { name: 'Chilufya Katongo', phone: '+260 97 901 2319', address: '28 Ibex Hill', city: 'Lusaka' },
    weight: 1.6, pieces: 2, description: 'Fashion Clothing', value: 67, currency: 'USD',
    serviceType: 'Express',
  },
  {
    id: 20,
    dpexAwb: 'DPX2607160020',
    sender:   { name: 'AliExpress Freight', city: 'Guangzhou', country: 'China' },
    receiver: { name: 'Kafue Mwila', phone: '+260 96 012 3420', address: 'Stand 102 Emmasdale', city: 'Lusaka' },
    weight: 7.3, pieces: 5, description: 'Solar Panel Components', value: 420, currency: 'USD',
    serviceType: 'Economy',
  },
]

// Initialise items from seed — status all pending
const INITIAL_ITEMS = SEED_MANIFEST.map(s => ({
  ...s,
  oexAwb:             null,
  status:             'pending',   // pending | received | exception | bagged | dispatched
  receivedAt:         null,
  bagId:              null,
  exceptionNote:      null,
  customerAccountNo:  s.customerAccountNo || '',
}))

const STATUS_META = {
  pending:    { label: 'Pending Receipt',   dot: 'bg-slate-300',   chip: 'bg-slate-100 text-slate-500'         },
  received:   { label: 'Received',          dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700'     },
  exception:  { label: 'Exception',         dot: 'bg-red-500',     chip: 'bg-red-100 text-red-700'             },
  bagged:     { label: 'Bagged',            dot: 'bg-violet-500',  chip: 'bg-violet-100 text-violet-700'       },
  dispatched: { label: 'Dispatched',        dot: 'bg-blue-500',    chip: 'bg-blue-100 text-blue-700'           },
}

const SERVICE_CHIP = {
  Express:  'bg-amber-100 text-amber-700',
  Standard: 'bg-sky-100 text-sky-700',
  Economy:  'bg-slate-100 text-slate-500',
}

const EXCEPTION_REASONS = [
  'Package damaged in transit',
  'Label unreadable — re-label required',
  'Address incomplete — hold for customer contact',
  'Prohibited item — refer to compliance',
  'Weight discrepancy — verify with DPEX manifest',
]

let oexSeq = 1

function assignOexAwb() {
  return makeAwb(oexSeq++)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-slate-900', bg = 'bg-white', icon: Icon }) {
  return (
    <div className={`${bg} rounded-2xl border shadow-sm px-5 py-4 flex items-center gap-4`}>
      {Icon && (
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={18} className="text-slate-500" />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-none mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${m.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function ExceptionModal({ item, onClose, onSave }) {
  const [note, setNote] = useState('')
  const [custom, setCustom] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Flag Exception</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.dpexAwb}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select reason</p>
          {EXCEPTION_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
              <input
                type="radio"
                name="exc"
                value={r}
                checked={note === r}
                onChange={() => { setNote(r); setCustom('') }}
                className="accent-red-600"
              />
              {r}
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="radio" name="exc" value="custom" checked={note === 'custom'} onChange={() => setNote('custom')} className="accent-red-600" />
            Other (describe below)
          </label>
        </div>
        {note === 'custom' && (
          <textarea
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Describe the exception…"
            rows={2}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl py-2.5 transition-colors">Cancel</button>
          <button
            onClick={() => {
              const finalNote = note === 'custom' ? custom : note
              if (finalNote) onSave(item.id, finalNote)
            }}
            disabled={!note || (note === 'custom' && !custom.trim())}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
          >
            Flag Exception
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DPEXInbound() {
  const [items, setItems]               = useState(INITIAL_ITEMS)
  const [scanInput, setScanInput]       = useState('')
  const [scanMsg, setScanMsg]           = useState(null)   // { ok, text }
  const [scanShake, setScanShake]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId]     = useState(null)
  const [exceptionTarget, setExceptionTarget] = useState(null)
  const [bagId, setBagId]               = useState('DPEX-BAG-001')
  const [step, setStep]                 = useState(1)      // 1=receive, 2=bag, 3=dispatch
  const [finalising, setFinalising]     = useState(false)
  const [dispatched, setDispatched]     = useState(false)
  const scanRef = useRef(null)

  // ── Derived counts ──────────────────────────────────────────────────────────
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1
    return acc
  }, {})
  const total      = items.length
  const pending    = counts.pending    || 0
  const received   = counts.received   || 0
  const exceptions = counts.exception  || 0
  const bagged     = counts.bagged     || 0
  const dDispatched = counts.dispatched || 0
  const totalWeight = items.reduce((s, i) => s + i.weight, 0)
  const totalPieces = items.reduce((s, i) => s + i.pieces, 0)

  const allReceived = items.every(i => i.status === 'received' || i.status === 'exception')
  const allBagged   = items.every(i => i.status === 'bagged' || i.status === 'exception' || i.status === 'dispatched')
  const canBag      = step === 2 && received > 0
  const canDispatch = step === 3 && bagged > 0

  // ── Filtered list ───────────────────────────────────────────────────────────
  const displayed = filterStatus === 'all'
    ? items
    : items.filter(i => i.status === filterStatus)

  // ── Actions ─────────────────────────────────────────────────────────────────
  const receiveItem = useCallback((id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.status !== 'pending') return i
      return { ...i, status: 'received', oexAwb: assignOexAwb(), receivedAt: new Date().toISOString() }
    }))
  }, [])

  const handleScan = () => {
    const q = scanInput.trim().toUpperCase()
    if (!q) return

    const item = items.find(i => i.dpexAwb.toUpperCase() === q || (i.oexAwb && i.oexAwb.toUpperCase() === q))
    if (!item) {
      setScanMsg({ ok: false, text: `"${q}" not found on this manifest.` })
      setScanShake(true)
      setTimeout(() => setScanShake(false), 500)
      setTimeout(() => setScanMsg(null), 3500)
      setScanInput('')
      return
    }
    if (item.status === 'exception') {
      setScanMsg({ ok: false, text: `${item.dpexAwb} is flagged as an exception — resolve before receiving.` })
      setTimeout(() => setScanMsg(null), 3500)
      setScanInput('')
      return
    }
    if (item.status !== 'pending') {
      setScanMsg({ ok: true, text: `${item.dpexAwb} already ${item.status}. OEX AWB: ${item.oexAwb || '—'}` })
      setTimeout(() => setScanMsg(null), 2500)
      setScanInput('')
      return
    }
    receiveItem(item.id)
    setScanMsg({ ok: true, text: `Received! ${item.dpexAwb} → OEX AWB assigned` })
    setTimeout(() => setScanMsg(null), 2500)
    setScanInput('')
    scanRef.current?.focus()
  }

  const receiveAll = () => {
    setItems(prev => prev.map(i =>
      i.status === 'pending' ? { ...i, status: 'received', oexAwb: assignOexAwb(), receivedAt: new Date().toISOString() } : i
    ))
  }

  const flagException = (id, note) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'exception', exceptionNote: note, oexAwb: i.oexAwb || `EXC-${id}` } : i
    ))
    setExceptionTarget(null)
  }

  const resolveException = (id) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'pending', exceptionNote: null, oexAwb: null } : i
    ))
  }

  const updateCustomerAccountNo = (id, val) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, customerAccountNo: val.toUpperCase() } : i))
  }

  const bagAll = () => {
    const bid = bagId || 'DPEX-BAG-001'
    setItems(prev => prev.map(i =>
      i.status === 'received' ? { ...i, status: 'bagged', bagId: bid } : i
    ))
  }

  const dispatchAll = async () => {
    setFinalising(true)
    await new Promise(r => setTimeout(r, 1200))
    setItems(prev => prev.map(i =>
      i.status === 'bagged' ? { ...i, status: 'dispatched' } : i
    ))
    setDispatched(true)
    setFinalising(false)
  }

  const resetSimulation = () => {
    oexSeq = 1
    setItems(INITIAL_ITEMS)
    setScanInput('')
    setScanMsg(null)
    setFilterStatus('all')
    setExpandedId(null)
    setStep(1)
    setDispatched(false)
    setBagId('DPEX-BAG-001')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">DPEX Inbound</h1>
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Simulation</span>
          </div>
          <p className="text-sm text-slate-500">
            Manifest <span className="font-mono font-semibold text-slate-700">DPEX-MAN-20260716-01</span>
            {' · '}Flight <span className="font-mono font-semibold text-slate-700">QZ 0421</span>
            {' · '}Arrived <span className="font-semibold text-slate-700">16 Jul 2026, 08:35</span>
          </p>
        </div>
        <button
          onClick={resetSimulation}
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <RefreshCw size={13} /> Reset Simulation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Package}     label="Total Items"  value={total}                                   sub={`${totalPieces} pieces · ${totalWeight.toFixed(1)} kg`} />
        <StatCard icon={Clock}       label="Pending"      value={pending}     color={pending    > 0 ? 'text-amber-600' : 'text-slate-900'} />
        <StatCard icon={CheckCircle2}label="Received"     value={received}    color={received   > 0 ? 'text-emerald-600' : 'text-slate-900'} />
        <StatCard icon={AlertCircle} label="Exceptions"   value={exceptions}  color={exceptions > 0 ? 'text-red-600' : 'text-slate-900'} />
      </div>

      {/* Step pipeline */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Workflow Progress</p>
        <div className="flex items-start gap-2">
          {[
            { n: 1, label: 'Receive', desc: 'Scan & accept each item from DPEX manifest', icon: ScanLine,      done: step > 1 },
            { n: 2, label: 'Bag',     desc: 'Consolidate received items into an OEX bag',  icon: Archive,       done: step > 2 },
            { n: 3, label: 'Dispatch',desc: 'Assign to hub, enter pipeline',               icon: PlaneTakeoff,  done: dispatched },
          ].map((s, idx, arr) => (
            <div key={s.n} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2
                  ${s.done ? 'bg-emerald-600' : step === s.n ? 'bg-slate-900' : 'bg-slate-100'}`}>
                  <s.icon size={16} className={s.done || step === s.n ? 'text-white' : 'text-slate-400'} />
                </div>
                <p className={`text-xs font-bold text-center ${step === s.n && !s.done ? 'text-slate-900' : s.done ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Step {s.n}: {s.label}
                </p>
                <p className="text-xs text-slate-400 text-center leading-snug mt-0.5 hidden sm:block">{s.desc}</p>
              </div>
              {idx < arr.length - 1 && (
                <ArrowRight size={14} className="text-slate-200 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step actions */}
        <div className="border-t mt-4 pt-4 flex flex-wrap gap-2 items-center justify-between">
          {step === 1 && (
            <>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info size={12} /> Receive all items, then advance to Bag step.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={receiveAll}
                  disabled={pending === 0}
                  className="text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <PackageCheck size={14} /> Receive All Pending
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!allReceived}
                  className="text-sm bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  Next: Bag <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Bag ID:</label>
                <input
                  value={bagId}
                  onChange={e => setBagId(e.target.value)}
                  className="text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={bagAll}
                  disabled={!canBag}
                  className="text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Archive size={14} /> Bag All Received ({received})
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!allBagged || bagged === 0}
                  className="text-sm bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  Next: Dispatch <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}

          {step === 3 && !dispatched && (
            <>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info size={12} /> {bagged} items bagged in <span className="font-mono font-semibold">{bagId}</span>. Ready for dispatch.
              </p>
              <button
                onClick={dispatchAll}
                disabled={!canDispatch || finalising}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {finalising
                  ? <><Loader2 size={14} className="animate-spin" /> Dispatching…</>
                  : <><Send size={14} /> Dispatch to Hub ({bagged} items)</>
                }
              </button>
            </>
          )}

          {dispatched && (
            <div className="w-full flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-semibold">
              <BadgeCheck size={16} className="shrink-0" />
              All items dispatched to hub. They are now in the OEX pipeline — visible in Hub Inbound &amp; DRS.
            </div>
          )}
        </div>
      </div>

      {/* Scan bar — only in step 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ScanLine size={13} /> Scan DPEX Tracking Number
          </p>
          <div className="flex gap-2">
            <div className={`relative flex-1 transition-transform ${scanShake ? 'translate-x-1' : ''}`} style={{ animation: scanShake ? 'shake 0.4s ease' : '' }}>
              <ScanLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="DPX2607160001 — type or scan, press Enter"
                className="w-full pl-8 pr-3 py-3 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 bg-slate-50"
                autoFocus
              />
            </div>
            <button
              onClick={handleScan}
              className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Search size={14} /> Receive
            </button>
          </div>
          {scanMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 ${scanMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {scanMsg.ok ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
              {scanMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { key: 'all',        label: `All (${total})` },
          { key: 'pending',    label: `Pending (${pending})` },
          { key: 'received',   label: `Received (${received})` },
          { key: 'exception',  label: `Exceptions (${exceptions})` },
          { key: 'bagged',     label: `Bagged (${bagged})` },
          { key: 'dispatched', label: `Dispatched (${dDispatched})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
              ${filterStatus === f.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package size={36} className="mb-2 opacity-30" />
            <p className="text-sm">No items in this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">DPEX AWB</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">OEX AWB</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Receiver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Acct No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Origin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Wt / Pcs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayed.flatMap(item => {
                  const expanded = expandedId === item.id
                  const mainRow = (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${item.status === 'exception' ? 'bg-red-50/40' : ''}`}
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {item.dpexAwb}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.oexAwb ? (
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {item.status === 'exception' ? <span className="text-red-500">{item.oexAwb}</span> : item.oexAwb}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 leading-tight">{item.receiver.name}</div>
                        <div className="text-xs text-slate-400">{item.receiver.city}</div>
                      </td>
                      <td className="px-4 py-3">
                        {item.customerAccountNo ? (
                          <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                            {item.customerAccountNo}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600">{item.sender.name}</div>
                        <div className="text-xs text-slate-400">{item.sender.city}, {item.sender.country}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {item.weight} kg / {item.pieces} pc{item.pieces > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={item.status} />
                        {item.status === 'bagged' && (
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">{item.bagId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {item.status === 'pending' && step === 1 && (
                            <>
                              <button
                                onClick={() => receiveItem(item.id)}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={11} /> Receive
                              </button>
                              <button
                                onClick={() => setExceptionTarget(item)}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-red-200"
                                title="Flag exception"
                              >
                                <AlertCircle size={11} />
                              </button>
                            </>
                          )}
                          {item.status === 'exception' && (
                            <button
                              onClick={() => resolveException(item.id)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {item.status === 'received' && step === 1 && (
                            <button
                              onClick={() => setExceptionTarget(item)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-red-200"
                            >
                              Flag
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(expanded ? null : item.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                          >
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                  if (!expanded) return [mainRow]
                  return [
                    mainRow,
                    <tr key={`${item.id}-x`} className="bg-slate-50/60">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 mb-0.5">Description</p>
                            <p className="font-medium text-slate-700">{item.description}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Declared Value</p>
                            <p className="font-medium text-slate-700">{item.currency} {item.value}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Service Type</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SERVICE_CHIP[item.serviceType] || 'bg-slate-100 text-slate-500'}`}>
                              {item.serviceType}
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Receiver Phone</p>
                            <p className="font-medium text-slate-700">{item.receiver.phone}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 mb-0.5">Delivery Address</p>
                            <p className="font-medium text-slate-700">{item.receiver.address}, {item.receiver.city}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-1">OEX Account No.</p>
                            <input
                              type="text"
                              value={item.customerAccountNo}
                              onChange={(e) => updateCustomerAccountNo(item.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="e.g. CX000001"
                              className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>
                          {item.receivedAt && (
                            <div>
                              <p className="text-slate-400 mb-0.5">Received At</p>
                              <p className="font-medium text-slate-700">
                                {new Date(item.receivedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )}
                          {item.exceptionNote && (
                            <div className="col-span-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                              <span className="font-semibold">Exception: </span>{item.exceptionNote}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>,
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="bg-slate-800 text-white rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="text-center">
            <p className="text-slate-400 text-xs">Total</p>
            <p className="font-bold">{total} items</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Total Weight</p>
            <p className="font-bold">{totalWeight.toFixed(1)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Total Pieces</p>
            <p className="font-bold">{totalPieces}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Received</p>
            <p className="font-bold text-emerald-400">{received + bagged + dDispatched} / {total - exceptions}</p>
          </div>
          {exceptions > 0 && (
            <div className="text-center">
              <p className="text-slate-400 text-xs">Exceptions</p>
              <p className="font-bold text-red-400">{exceptions}</p>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-400">
          Manifest <span className="font-mono text-slate-300">DPEX-MAN-20260716-01</span>
        </div>
      </div>

      {/* Exception modal */}
      {exceptionTarget && (
        <ExceptionModal
          item={exceptionTarget}
          onClose={() => setExceptionTarget(null)}
          onSave={flagException}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
