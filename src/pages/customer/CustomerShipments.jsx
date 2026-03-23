import { useState } from 'react'
import {
  Package, Plus, X, ChevronRight, AlertTriangle, CheckCircle,
  Printer, Eye, Loader, Search, MapPin, UserCircle,
  FileEdit, Trash2, Wallet, Clock,
} from 'lucide-react'
import TrackingTimeline from '../../components/TrackingTimeline'
import HsCodePicker from '../../components/HsCodePicker'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { useAdminStore } from '../../admin/adminStore'
import { useStore } from '../../store'
import { generateAWB, STATUS_COLORS } from '../../utils'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

// ── Tab filter map ────────────────────────────────────────────────────────────
const TABS = ['All', 'Booked', 'Picked Up', 'In Transit', 'Delivered', 'Cancel', 'Return']

const TAB_FILTER = {
  'All':       () => true,
  'Booked':    (s) => s.status === 'Booked',
  'Picked Up': (s) => s.status === 'Picked Up',
  'In Transit':(s) => ['Origin Scanned', 'Bagged', 'Manifested', 'Hub Inbound', 'DRS Assigned', 'PRS Assigned', 'Out for Pickup', 'Out for Delivery'].includes(s.status),
  'Delivered': (s) => s.status === 'Delivered',
  'Cancel':    (s) => s.status === 'Cancelled',
  'Return':    (s) => s.status === 'Non-Delivery',
}

// ── Prohibited Items content ──────────────────────────────────────────────────
const PROHIBITED = [
  'Explosives, flammable liquids & gases', 'Weapons, firearms & ammunition',
  'Counterfeit goods & pirated material', 'Illegal drugs & narcotics',
  'Human remains, organs & blood products', 'Live animals & plants',
  'Cash, coins & negotiable instruments', 'Perishables without proper packaging',
  'Radioactive or hazardous materials', 'Any item prohibited by destination country law',
]

// ── BookShipmentModal ─────────────────────────────────────────────────────────
function BookShipmentModal({ onClose, onBooked, resumeDraft }) {
  const user               = useAuthStore((s) => s.user)
  const getProfile         = useCustomerStore((s) => s.getProfile)
  const getWallet          = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const addCustomerShipment = useCustomerStore((s) => s.addCustomerShipment)
  const deductWallet        = useCustomerStore((s) => s.deductWallet)
  const saveDraft           = useCustomerStore((s) => s.saveDraft)
  const deleteDraft         = useCustomerStore((s) => s.deleteDraft)
  const addOpsShipment      = useStore((s) => s.addShipment)
  const services            = useAdminStore((s) => s.services)
  const countries           = useAdminStore((s) => s.countries)
  const cities              = useAdminStore((s) => s.cities)

  const profile    = getProfile(user?.id)
  const wallet     = getWallet(user?.id)
  const completion = getProfileCompletion(user?.id)
  const isProfileOk = completion.overall >= 100

  const activeServices = services.filter((s) => s.status === 'Active')

  // If resuming a draft, pre-fill form and skip to step 3
  const [step,        setStep]        = useState(resumeDraft ? 3 : 1)
  const [accepted,    setAccepted]    = useState(!!resumeDraft)
  const [submitting,  setSubmitting]  = useState(false)
  const [successAwb,  setSuccessAwb]  = useState(null)
  const [draftSaved,  setDraftSaved]  = useState(false)

  const [form, setForm] = useState(
    resumeDraft?.form || {
      serviceId:         activeServices[0]?.id || '',
      description:       '',
      hsCode:            '',
      valueZK:           '',
      weight:            '',
      length:            '',
      width:             '',
      height:            '',
      quantity:          '1',
      remarks:           '',
      receiverName:      '',
      receiverPhone:     '',
      receiverAddress:   '',
      receiverCityId:    '',
      receiverCountryId: '',
    }
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const selectedService = activeServices.find((s) => s.id === form.serviceId)

  // Simple cost estimate: flat fee based on weight + service type
  const estimateCost = () => {
    if (!form.weight || isNaN(+form.weight)) return 0
    const w = +form.weight
    const base = selectedService?.deliveryType === 'Express' ? 25 : 15
    const mode  = selectedService?.mode === 'International'  ? 2.5 : 1
    return +(base + w * 8 * mode).toFixed(2)
  }
  const cost = estimateCost()
  const canAfford = wallet.balance >= cost

  const receiverCity    = cities.find((c) => c.id === form.receiverCityId)
  const receiverCountry = countries.find((c) => c.id === form.receiverCountryId)
  const senderCity      = cities.find((c) => c.id === profile.cityId)
  const senderCountry   = countries.find((c) => c.id === profile.countryId)

  const formValid = () =>
    form.description && form.weight && form.valueZK &&
    form.receiverName && form.receiverPhone && form.receiverAddress &&
    form.receiverCityId && form.receiverCountryId

  const handleConfirmBook = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    const awb = generateAWB()
    const now = new Date().toISOString()

    const shipmentData = {
      awb,
      status: 'Booked',
      serviceType: selectedService?.name || 'Standard',
      description: form.description,
      hsCode: form.hsCode,
      valueZK: +form.valueZK,
      weight: +form.weight,
      dimensions: { l: +form.length || 0, w: +form.width || 0, h: +form.height || 0 },
      quantity: +form.quantity || 1,
      remarks: form.remarks,
      cost,
      sender: {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        city: senderCity?.name || '',
        country: senderCountry?.name || '',
      },
      receiver: {
        name: form.receiverName,
        phone: form.receiverPhone,
        address: form.receiverAddress,
        city: receiverCity?.name || '',
        country: receiverCountry?.name || '',
      },
      createdAt: now,
      customerId: user.id,
      source: 'portal',
    }
    addCustomerShipment(user.id, shipmentData)
    // Bridge into ops pipeline so the shipment appears in Booking queue
    addOpsShipment(shipmentData)
    deductWallet(user.id, cost, awb)
    // Delete the draft if we resumed from one
    if (resumeDraft) deleteDraft(user.id, resumeDraft.id)
    setSuccessAwb(awb)
    setSubmitting(false)
    setStep(4)
  }

  // ── Step 4: Success ─────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Shipment Booked!</h3>
          <p className="text-slate-500 text-sm mb-4">Your shipment has been successfully booked.</p>
          <div className="bg-slate-50 rounded-xl px-5 py-3 mb-2">
            <div className="text-xs text-slate-400 mb-1">AWB Number</div>
            <div className="text-lg font-bold font-mono text-violet-700">{successAwb}</div>
          </div>
          <div className="text-xs text-slate-400 mb-6">
            ZK {cost.toFixed(2)} deducted · Remaining balance: ZK {(wallet.balance - cost).toFixed(2)}
          </div>
          <button
            onClick={() => { setSuccessAwb(null); onBooked() }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-bold text-slate-900">Book a Shipment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 3 — {step === 1 ? 'Acknowledgement' : step === 2 ? 'Shipment Details' : 'Confirm & Pay'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Step 1: Prohibited items ────────────────────────────────────── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              {!isProfileOk && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Please <a href="/portal/profile" className="underline font-semibold">complete your profile</a> before booking.</span>
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h4 className="font-bold text-red-900 text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" /> Prohibited Items Declaration
                </h4>
                <p className="text-red-700 text-xs mb-4 leading-relaxed">
                  By proceeding, you confirm that your shipment does NOT contain any of the following prohibited items:
                </p>
                <ul className="space-y-1.5">
                  {PROHIBITED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-red-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-700">
                  I confirm that my shipment does not contain any prohibited items listed above and I accept
                  full responsibility for the contents.
                </span>
              </label>
            </div>
          )}

          {/* ── Step 2: Booking form ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              {/* Service */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Service Type</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => set('serviceId', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.deliveryDays} days</option>
                  ))}
                </select>
              </div>

              {/* Sender (read-only from profile) */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Sender (You)</div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div><span className="text-slate-400 text-xs block">Name</span>{profile.name || '—'}</div>
                  <div><span className="text-slate-400 text-xs block">Phone</span>{profile.phone || '—'}</div>
                  <div className="col-span-2"><span className="text-slate-400 text-xs block">Address</span>{profile.address || '—'}</div>
                  <div><span className="text-slate-400 text-xs block">City</span>{senderCity?.name || '—'}</div>
                  <div><span className="text-slate-400 text-xs block">Country</span>{senderCountry?.name || '—'}</div>
                </div>
              </div>

              {/* Receiver */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Receiver Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Name *</label>
                    <input value={form.receiverName} onChange={(e) => set('receiverName', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Phone *</label>
                    <input value={form.receiverPhone} onChange={(e) => set('receiverPhone', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="+260..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Address *</label>
                    <input value={form.receiverAddress} onChange={(e) => set('receiverAddress', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Street address" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Country *</label>
                    <select value={form.receiverCountryId} onChange={(e) => set('receiverCountryId', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="">— Select —</option>
                      {countries.filter((c) => c.status === 'Active').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">City *</label>
                    <select value={form.receiverCityId} onChange={(e) => set('receiverCityId', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="">— Select —</option>
                      {cities.filter((c) => c.countryId === form.receiverCountryId && c.status === 'Active').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Package details */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Package Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Description of Goods *</label>
                    <input value={form.description} onChange={(e) => set('description', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="e.g. Electronic goods, clothing, documents..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">HS Code</label>
                    <HsCodePicker value={form.hsCode} onChange={(code) => set('hsCode', code)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Value (ZK) *</label>
                    <input type="number" min="0" value={form.valueZK} onChange={(e) => set('valueZK', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Weight (kg) *</label>
                    <input type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0.0" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                    <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">L × W × H (cm)</label>
                    <div className="flex gap-1">
                      <input type="number" min="0" value={form.length} onChange={(e) => set('length', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="L" />
                      <input type="number" min="0" value={form.width} onChange={(e) => set('width', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="W" />
                      <input type="number" min="0" value={form.height} onChange={(e) => set('height', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="H" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Remarks</label>
                    <input value={form.remarks} onChange={(e) => set('remarks', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Optional notes..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shipment Summary</div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-800">{selectedService?.name}</span>
                  <span className="text-slate-500">Delivery Days</span>
                  <span className="font-medium text-slate-800">{selectedService?.deliveryDays} days</span>
                  <span className="text-slate-500">From</span>
                  <span className="font-medium text-slate-800">{profile.name} · {senderCity?.name}</span>
                  <span className="text-slate-500">To</span>
                  <span className="font-medium text-slate-800">{form.receiverName} · {receiverCity?.name}</span>
                  <span className="text-slate-500">Description</span>
                  <span className="font-medium text-slate-800">{form.description}</span>
                  <span className="text-slate-500">Weight</span>
                  <span className="font-medium text-slate-800">{form.weight} kg</span>
                </div>
              </div>

              {/* Cost summary */}
              <div className={`rounded-2xl p-5 ${canAfford ? 'bg-violet-50 border border-violet-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Estimated Cost</span>
                  <span className={`text-xl font-extrabold ${canAfford ? 'text-violet-700' : 'text-red-600'}`}>
                    ZK {cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Wallet Balance</span>
                  <span className="font-semibold text-slate-700">
                    ZK {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {canAfford ? (
                  <div className="mt-3 text-xs text-violet-600 flex items-center gap-1">
                    <CheckCircle size={13} />
                    After booking: ZK {(wallet.balance - cost).toFixed(2)} remaining
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-red-700 flex items-center gap-1">
                      <AlertTriangle size={13} />
                      Insufficient balance — need ZK {(cost - wallet.balance).toFixed(2)} more.{' '}
                      <a href="/portal/wallet" className="underline font-semibold">Top up wallet</a>.
                    </div>
                    {draftSaved ? (
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
                        <CheckCircle size={12} />
                        Draft saved — top up your wallet and resume from "My Shipments".
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          saveDraft(user.id, form, cost)
                          if (resumeDraft) deleteDraft(user.id, resumeDraft.id)
                          setDraftSaved(true)
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <FileEdit size={12} />
                        Save as Draft — complete later after topping up
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step === 1 && (
            <button
              disabled={!accepted || !isProfileOk}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight size={16} />
            </button>
          )}
          {step === 2 && (
            <button
              disabled={!formValid()}
              onClick={() => setStep(3)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review & Confirm <ChevronRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button
              disabled={!canAfford || submitting}
              onClick={handleConfirmBook}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Confirm & Pay ZK {cost.toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main: CustomerShipments ───────────────────────────────────────────────────
export default function CustomerShipments() {
  const user                 = useAuthStore((s) => s.user)
  const getCustomerShipments = useCustomerStore((s) => s.getCustomerShipments)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const getDrafts            = useCustomerStore((s) => s.getDrafts)
  const deleteDraft          = useCustomerStore((s) => s.deleteDraft)
  const getWallet            = useCustomerStore((s) => s.getWallet)

  const [activeTab,   setActiveTab]   = useState('All')
  const [search,      setSearch]      = useState('')
  const [showModal,   setShowModal]   = useState(false)
  const [resumeDraft, setResumeDraft] = useState(null) // draft to resume
  const [viewDetail,  setViewDetail]  = useState(null)
  const [profileWarn, setProfileWarn] = useState(false)

  const warnProfile = () => { setProfileWarn(true); setTimeout(() => setProfileWarn(false), 4000) }

  const allShipments = getCustomerShipments(user?.id)
  const drafts       = getDrafts(user?.id)
  const wallet       = getWallet(user?.id)
  const completion   = getProfileCompletion(user?.id)
  const isProfileOk  = completion.overall >= 100

  const filtered = allShipments.filter((s) => {
    const matchTab    = TAB_FILTER[activeTab]?.(s) ?? true
    const matchSearch = !search.trim() ||
      s.awb.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.receiver?.name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const tabCounts = Object.fromEntries(
    TABS.map((t) => [t, allShipments.filter(TAB_FILTER[t]).length])
  )

  return (
    <div className="p-6 space-y-4">
      {/* Profile incomplete toast */}
      {profileWarn && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-xl shadow-sm animate-pulse">
          <UserCircle size={18} className="text-amber-500 shrink-0" />
          <span>Your profile is incomplete. <a href="/portal/profile" className="underline font-semibold hover:text-amber-900">Complete your profile</a> to book shipments.</span>
          <button onClick={() => setProfileWarn(false)} className="ml-auto text-amber-400 hover:text-amber-700"><X size={16} /></button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">All Shipments</h2>
          <p className="text-sm text-slate-400 mt-0.5">{allShipments.length} total shipments</p>
        </div>
        <button
          onClick={() => {
            if (!isProfileOk) { warnProfile(); return }
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} /> New Shipment
        </button>
      </div>

      {/* ── Drafts panel ──────────────────────────────────────────────────── */}
      {drafts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileEdit size={15} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              Saved Drafts ({drafts.length})
            </span>
            <span className="text-xs text-amber-600 ml-1">
              — top up your wallet then resume to complete booking
            </span>
          </div>
          <div className="space-y-2">
            {drafts.map((draft) => {
              const canAffordNow = wallet.balance >= draft.cost
              const age = (() => {
                const diff = Date.now() - new Date(draft.savedAt).getTime()
                const hrs  = Math.floor(diff / 3600000)
                const days = Math.floor(diff / 86400000)
                if (days > 0) return `${days}d ago`
                if (hrs  > 0) return `${hrs}h ago`
                return 'Just now'
              })()
              return (
                <div key={draft.id} className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {draft.form.description || 'Unnamed shipment'}
                      </span>
                      <span className="text-xs font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                        ZK {draft.cost.toFixed(2)}
                      </span>
                      {canAffordNow && (
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 font-medium">
                          ✓ Balance sufficient — ready to book!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {age}</span>
                      {draft.form.receiverName && <span>→ {draft.form.receiverName}</span>}
                      {draft.form.weight && <span>{draft.form.weight} kg</span>}
                    </div>
                    {!canAffordNow && (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <Wallet size={11} />
                        Need ZK {(draft.cost - wallet.balance).toFixed(2)} more —{' '}
                        <a href="/portal/wallet" className="underline font-semibold">top up wallet</a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setResumeDraft(draft); setShowModal(true) }}
                      disabled={!canAffordNow}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors
                        ${canAffordNow
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      <FileEdit size={12} />
                      Resume &amp; Pay
                    </button>
                    <button
                      onClick={() => deleteDraft(user.id, draft.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                      title="Delete draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b overflow-x-auto pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${activeTab === tab
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shipments..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
          <Package size={32} className="text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500 font-medium text-sm">No shipments found</div>
          <div className="text-slate-400 text-xs mt-1 mb-4">
            {allShipments.length === 0 ? 'Book your first shipment to get started.' : 'Try adjusting your filters.'}
          </div>
          {allShipments.length === 0 && (
            <button
              onClick={() => isProfileOk ? setShowModal(true) : warnProfile()}
              className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus size={14} /> Book Shipment
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">HAWB</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Origin</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Receiver</th>
                  <th className="px-4 py-3 text-right">Value (ZK)</th>
                  <th className="px-4 py-3 text-right">Wt (kg)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => (
                  <tr key={s.awb} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-violet-700 text-xs">{s.awb}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.sender?.city || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate">{s.description || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.receiver?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-slate-700">
                      {s.valueZK ? s.valueZK.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-slate-600">{s.weight || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewDetail(s)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          title="Print label"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book modal */}
      {showModal && (
        <BookShipmentModal
          onClose={() => { setShowModal(false); setResumeDraft(null) }}
          onBooked={() => { setShowModal(false); setResumeDraft(null) }}
          resumeDraft={resumeDraft}
        />
      )}

      {/* Detail modal */}
      {viewDetail && (
        <DetailModal shipment={viewDetail} onClose={() => setViewDetail(null)} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Detail Modal — tabbed: Shipment Info + Live Tracking
───────────────────────────────────────────────────────── */
function DetailModal({ shipment, onClose }) {
  const [tab, setTab] = useState('info')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <div className="font-bold text-slate-900">{shipment.awb}</div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> {shipment.sender?.city} → {shipment.receiver?.city}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 shrink-0">
          {[['info', 'Shipment Info'], ['tracking', 'Live Tracking']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {tab === 'info' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={shipment.status} />
              </div>
              {[
                ['Service',     shipment.serviceType],
                ['Description', shipment.description],
                ['Weight',      shipment.weight   ? `${shipment.weight} kg`   : '—'],
                ['Value',       shipment.valueZK  ? `ZK ${shipment.valueZK}`  : '—'],
                ['Sender',      `${shipment.sender?.name} · ${shipment.sender?.city}`],
                ['Receiver',    `${shipment.receiver?.name} · ${shipment.receiver?.city}`],
                ['Booked',      shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : '—'],
                ['Cost',        shipment.cost     ? `ZK ${shipment.cost}`     : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between text-sm">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs">{v || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'tracking' && (
            <TrackingTimeline awb={shipment.awb} />
          )}

        </div>
      </div>
    </div>
  )
}
