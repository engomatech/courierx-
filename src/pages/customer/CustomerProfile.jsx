import { useState, useEffect, useRef } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, Save, User, FileText, Users,
         ShieldCheck, ShieldAlert, ShieldOff, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { useAdminStore } from '../../admin/adminStore'

// ── Circular completion gauge ─────────────────────────────────────────────────
function CompletionGauge({ pct }) {
  const r    = 36
  const circ = 2 * Math.PI * r
  const filled = circ * (pct / 100)
  const color  = pct < 40 ? '#ef4444' : pct < 75 ? '#f59e0b' : '#10b981'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-xl font-extrabold text-slate-900 leading-none">{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">done</div>
      </div>
    </div>
  )
}

// ── Section step indicator ────────────────────────────────────────────────────
function SectionStepper({ active, completion }) {
  const sections = [
    { id: 1, label: 'Basic Details',  icon: User },
    { id: 2, label: 'KYC Details',    icon: FileText },
    { id: 3, label: 'Customer KYC',   icon: Users },
  ]
  const pcts = [completion.s1, completion.s2, completion.s3]

  return (
    <div className="flex items-center gap-0">
      {sections.map(({ id, label, icon: Icon }, i) => {
        const pct     = pcts[i]
        const done    = pct === 100
        const isActive = active === id
        return (
          <div key={id} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${isActive
                ? 'bg-violet-600 text-white'
                : done
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'}`}
            >
              {done ? <CheckCircle size={15} /> : <Icon size={15} />}
              <span className="hidden sm:inline">{label}</span>
              <span className="inline sm:hidden">{id}</span>
              {!isActive && !done && pct > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-0.5">{pct}%</span>
              )}
            </div>
            {i < sections.length - 1 && (
              <ChevronRight size={16} className="text-slate-300 mx-1 flex-shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Input helpers ─────────────────────────────────────────────────────────────
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white disabled:bg-slate-50 disabled:text-slate-400'
const sel = inp + ' appearance-none'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Main: CustomerProfile ─────────────────────────────────────────────────────
export default function CustomerProfile() {
  const user                 = useAuthStore((s) => s.user)
  const getProfile           = useCustomerStore((s) => s.getProfile)
  const saveProfileSection   = useCustomerStore((s) => s.saveProfileSection)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const countries            = useAdminStore((s) => s.countries)
  const cities               = useAdminStore((s) => s.cities)

  const stored    = getProfile(user?.id)
  const completion = getProfileCompletion(user?.id)

  const [section, setSection] = useState(1)
  const [saved,   setSaved]   = useState(false)

  // Backend KYC state (only relevant when user.customer_id is set)
  const [backendKyc,  setBackendKyc]  = useState(null)   // customer record from API
  const [kycFile,     setKycFile]     = useState(null)   // File object
  const [kycSaving,   setKycSaving]   = useState(false)
  const [kycSaveMsg,  setKycSaveMsg]  = useState(null)   // { ok, text }
  const fileInputRef = useRef(null)

  // Local form state per section
  const [s1, setS1] = useState({
    name:        stored.name        || '',
    companyName: stored.companyName || '',
    phone:       stored.phone       || '',
    postalCode:  stored.postalCode  || '',
    countryId:   stored.countryId   || '',
    cityId:      stored.cityId      || '',
    hubId:       stored.hubId       || '',
    address:     stored.address     || '',
  })

  const [s2, setS2] = useState({
    idNo:               stored.idNo               || '',
    accountHolderName:  stored.accountHolderName  || '',
    accountNo:          stored.accountNo          || '',
    ifscCode:           stored.ifscCode           || '',
  })

  const [s3, setS3] = useState({
    kycWith:        stored.kycWith        || '',
    idProofNo:      stored.idProofNo      || '',
    occupation:     stored.occupation     || '',
    kycCompanyName: stored.kycCompanyName || '',
    position:       stored.position       || '',
    tpin:           stored.tpin           || '',
    sex:            stored.sex            || '',
    maritalStatus:  stored.maritalStatus  || '',
  })

  // Sync local state when stored changes (after save)
  useEffect(() => {
    const p = getProfile(user?.id)
    setS1({ name: p.name, companyName: p.companyName, phone: p.phone, postalCode: p.postalCode,
      countryId: p.countryId, cityId: p.cityId, hubId: p.hubId, address: p.address })
    setS2({ idNo: p.idNo, accountHolderName: p.accountHolderName, accountNo: p.accountNo, ifscCode: p.ifscCode })
    setS3({ kycWith: p.kycWith, idProofNo: p.idProofNo, occupation: p.occupation,
      kycCompanyName: p.kycCompanyName, position: p.position, tpin: p.tpin, sex: p.sex, maritalStatus: p.maritalStatus })
  }, [])

  // Load backend KYC status if this user has a linked customer_id
  useEffect(() => {
    if (!user?.customer_id) return
    fetch(`/api/v1/admin/customers/${user.customer_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.customer) setBackendKyc(d.customer) })
      .catch(() => {})
  }, [user?.customer_id])

  // Submit KYC fields + optional file to the backend customer record
  async function submitBackendKyc() {
    if (!user?.customer_id) return
    const ks = backendKyc?.kyc_status
    if (ks === 'verified') return   // already verified — no re-submission
    setKycSaving(true)
    setKycSaveMsg(null)
    try {
      const fd = new FormData()
      fd.append('national_id',        s3.idProofNo || s2.idNo || '')
      fd.append('kyc_document_type',  s3.kycWith || '')
      fd.append('date_of_birth',      '')    // not collected in this form
      fd.append('physical_address',   s1.address || '')
      if (kycFile) fd.append('kyc_document', kycFile)

      const r = await fetch(`/api/v1/admin/customers/${user.customer_id}/kyc/submit`, {
        method: 'POST',
        body  : fd,
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'KYC submission failed')
      setBackendKyc(prev => ({ ...prev, kyc_status: 'submitted', ...d.customer }))
      setKycSaveMsg({ ok: true, text: 'KYC submitted — your documents are under review.' })
      setKycFile(null)
    } catch (e) {
      setKycSaveMsg({ ok: false, text: e.message })
    } finally {
      setKycSaving(false)
    }
  }

  const handleSave = () => {
    const data = section === 1 ? s1 : section === 2 ? s2 : s3
    saveProfileSection(user?.id, data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    // Also push to backend KYC if on section 3 and customer_id linked
    if (section === 3 && user?.customer_id) {
      submitBackendKyc()
    }
  }

  const handleSaveNext = () => {
    handleSave()
    if (section < 3) setSection((s) => s + 1)
  }

  // Filtered cities by selected country
  const filteredCities = cities.filter(
    (c) => c.countryId === s1.countryId && c.status === 'Active'
  )

  const HUBS = ['Lusaka Main Hub', 'Kitwe Hub', 'Ndola Hub', 'Livingstone Hub', 'Chipata Hub', 'Solwezi Hub']
  const KYC_WITH_OPTIONS = ['NRC', 'Passport', 'Driving Licence', 'TPIN Certificate', 'Company Registration']
  const SEX_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
  const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed']

  // Re-read completion after state changes
  const currentCompletion = getProfileCompletion(user?.id)

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header + gauge */}
      <div className="flex items-start gap-5 flex-wrap">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">My Profile</h2>
          <p className="text-sm text-slate-400 mt-1">
            Keep your profile up to date to access all courier services.
          </p>
          {/* Overall completion bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Overall Completion</span>
              <span className={`font-semibold ${currentCompletion.overall === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {currentCompletion.overall}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500
                  ${currentCompletion.overall < 40 ? 'bg-red-500' :
                    currentCompletion.overall < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${currentCompletion.overall}%` }}
              />
            </div>
          </div>
        </div>
        <CompletionGauge pct={currentCompletion.overall} />
      </div>

      {/* Section stepper */}
      <SectionStepper active={section} completion={currentCompletion} />

      {/* Saved toast */}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} className="text-emerald-600" />
          Section saved successfully!
        </div>
      )}

      {/* ── Section 1: Basic Details ─────────────────────────────────────────── */}
      {section === 1 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <User size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Basic Details</h3>
              <p className="text-xs text-slate-400">Personal and contact information</p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${currentCompletion.s1 === 100 ? 'bg-emerald-100 text-emerald-700' :
                  currentCompletion.s1 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {currentCompletion.s1}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full Name" required>
              <input
                value={s1.name}
                onChange={(e) => setS1((v) => ({ ...v, name: e.target.value }))}
                className={inp} placeholder="Jane Customer"
              />
            </Field>
            <Field label="Company Name">
              <input
                value={s1.companyName}
                onChange={(e) => setS1((v) => ({ ...v, companyName: e.target.value }))}
                className={inp} placeholder="Optional"
              />
            </Field>
            <Field label="Phone" required>
              <input
                value={s1.phone}
                onChange={(e) => setS1((v) => ({ ...v, phone: e.target.value }))}
                className={inp} placeholder="+260..." type="tel"
              />
            </Field>
            <Field label="Email">
              <input value={user?.email || ''} disabled className={inp} />
            </Field>
            <Field label="Postal Code" required>
              <input
                value={s1.postalCode}
                onChange={(e) => setS1((v) => ({ ...v, postalCode: e.target.value }))}
                className={inp} placeholder="10101"
              />
            </Field>
            <Field label="Country" required>
              <select
                value={s1.countryId}
                onChange={(e) => setS1((v) => ({ ...v, countryId: e.target.value, cityId: '' }))}
                className={sel}
              >
                <option value="">— Please Select —</option>
                {countries.filter((c) => c.status === 'Active').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="City" required>
              <select
                value={s1.cityId}
                onChange={(e) => setS1((v) => ({ ...v, cityId: e.target.value }))}
                className={sel}
                disabled={!s1.countryId}
              >
                <option value="">— Please Select —</option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Nearest Hub">
              <select
                value={s1.hubId}
                onChange={(e) => setS1((v) => ({ ...v, hubId: e.target.value }))}
                className={sel}
              >
                <option value="">— Please Select —</option>
                {HUBS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Address" required>
            <textarea
              value={s1.address}
              onChange={(e) => setS1((v) => ({ ...v, address: e.target.value }))}
              className={`${inp} resize-none`}
              rows={3}
              placeholder="Street address, building, flat number..."
            />
          </Field>
        </div>
      )}

      {/* ── Section 2: KYC Details ───────────────────────────────────────────── */}
      {section === 2 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">KYC Details</h3>
              <p className="text-xs text-slate-400">Bank account and identity verification (optional)</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                Optional
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="ID No (PAN / NRC)">
              <input
                value={s2.idNo}
                onChange={(e) => setS2((v) => ({ ...v, idNo: e.target.value }))}
                className={inp} placeholder="Please Enter ID No"
              />
            </Field>
            <Field label="Account Holder Name">
              <input
                value={s2.accountHolderName}
                onChange={(e) => setS2((v) => ({ ...v, accountHolderName: e.target.value }))}
                className={inp} placeholder="Please Enter Account Holder Name"
              />
            </Field>
            <Field label="Account No">
              <input
                value={s2.accountNo}
                onChange={(e) => setS2((v) => ({ ...v, accountNo: e.target.value }))}
                className={inp} placeholder="Please Enter Account No"
              />
            </Field>
            <Field label="IFSC / Sort Code">
              <input
                value={s2.ifscCode}
                onChange={(e) => setS2((v) => ({ ...v, ifscCode: e.target.value }))}
                className={inp} placeholder="Please Enter IFSC Code"
              />
            </Field>
          </div>

          {/* File upload placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID Image">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50">
                <FileText size={18} className="mx-auto mb-1 text-slate-300" />
                File upload (demo placeholder)
              </div>
            </Field>
            <Field label="Bank Passbook Image">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50">
                <FileText size={18} className="mx-auto mb-1 text-slate-300" />
                File upload (demo placeholder)
              </div>
            </Field>
          </div>
        </div>
      )}

      {/* ── Section 3: Customer KYC Details ─────────────────────────────────── */}
      {section === 3 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer KYC Details</h3>
              <p className="text-xs text-slate-400">Additional compliance and personal information</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Backend KYC status badge */}
              {user?.customer_id && backendKyc && (() => {
                const ks = backendKyc.kyc_status || 'not_started'
                const cfg = {
                  not_started: { cls: 'bg-slate-100 text-slate-500',     icon: ShieldOff,   label: 'KYC Pending' },
                  submitted:   { cls: 'bg-amber-100 text-amber-700',     icon: ShieldAlert, label: '● KYC Submitted' },
                  verified:    { cls: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck, label: '✓ KYC Verified' },
                  rejected:    { cls: 'bg-red-100 text-red-600',         icon: ShieldOff,   label: '✗ KYC Rejected' },
                }
                const { cls, icon: Icon, label } = cfg[ks] || cfg.not_started
                return (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
                    <Icon size={11} /> {label}
                  </span>
                )
              })()}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${currentCompletion.s3 === 100 ? 'bg-emerald-100 text-emerald-700' :
                  currentCompletion.s3 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {currentCompletion.s3}%
              </span>
            </div>
          </div>

          {/* Rejection reason banner */}
          {user?.customer_id && backendKyc?.kyc_status === 'rejected' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <ShieldOff size={15} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-700">KYC Rejected</p>
                {backendKyc.kyc_rejection_reason && (
                  <p className="text-red-600 text-xs mt-0.5">{backendKyc.kyc_rejection_reason}</p>
                )}
                <p className="text-red-600 text-xs mt-1">Please update your details and resubmit.</p>
              </div>
            </div>
          )}

          {/* Verified — no re-submission */}
          {user?.customer_id && backendKyc?.kyc_status === 'verified' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <ShieldCheck size={15} className="shrink-0" />
              <span className="font-semibold">KYC Verified</span>
              <span className="text-xs text-emerald-600 ml-1">
                — your identity has been confirmed. No further action needed.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="KYC With">
              <select
                value={s3.kycWith}
                onChange={(e) => setS3((v) => ({ ...v, kycWith: e.target.value }))}
                className={sel}
              >
                <option value="">— Please Select —</option>
                {KYC_WITH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="ID Proof No">
              <input
                value={s3.idProofNo}
                onChange={(e) => setS3((v) => ({ ...v, idProofNo: e.target.value }))}
                className={inp} placeholder="Please Enter ID Proof No"
              />
            </Field>
            <Field label="Occupation">
              <input
                value={s3.occupation}
                onChange={(e) => setS3((v) => ({ ...v, occupation: e.target.value }))}
                className={inp} placeholder="e.g. Business Owner"
              />
            </Field>
            <Field label="Company Name">
              <input
                value={s3.kycCompanyName}
                onChange={(e) => setS3((v) => ({ ...v, kycCompanyName: e.target.value }))}
                className={inp} placeholder="Optional"
              />
            </Field>
            <Field label="Position">
              <input
                value={s3.position}
                onChange={(e) => setS3((v) => ({ ...v, position: e.target.value }))}
                className={inp} placeholder="e.g. Director"
              />
            </Field>
            <Field label="TPIN">
              <input
                value={s3.tpin}
                onChange={(e) => setS3((v) => ({ ...v, tpin: e.target.value }))}
                className={inp} placeholder="Tax Payer Identification No"
              />
            </Field>
            <Field label="Sex" required>
              <select
                value={s3.sex}
                onChange={(e) => setS3((v) => ({ ...v, sex: e.target.value }))}
                className={sel}
              >
                <option value="">— Please Select —</option>
                {SEX_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Marital Status" required>
              <select
                value={s3.maritalStatus}
                onChange={(e) => setS3((v) => ({ ...v, maritalStatus: e.target.value }))}
                className={sel}
              >
                <option value="">— Please Select —</option>
                {MARITAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          {/* Real file upload — NRC/Passport scan */}
          {backendKyc?.kyc_status !== 'verified' && (
            <Field label="ID Document Upload">
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors max-w-sm
                  ${kycFile ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} className={`mx-auto mb-1 ${kycFile ? 'text-violet-500' : 'text-slate-300'}`} />
                {kycFile ? (
                  <p className="text-xs text-violet-700 font-medium">{kycFile.name}</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Click to upload ID document</p>
                    <p className="text-xs text-slate-400 mt-0.5">NRC, Passport, Driving Licence — JPG, PNG or PDF, max 5MB</p>
                    {backendKyc?.kyc_document_path && (
                      <p className="text-xs text-emerald-600 mt-1">✓ Document already on file — upload a new one to replace</p>
                    )}
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={e => setKycFile(e.target.files?.[0] || null)}
                />
              </div>
            </Field>
          )}

          {/* KYC save status message */}
          {kycSaveMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
              kycSaveMsg.ok
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {kycSaveMsg.ok
                ? <ShieldCheck size={15} className="shrink-0" />
                : <AlertCircle size={15} className="shrink-0" />
              }
              {kycSaveMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {section > 1 ? (
          <button
            onClick={() => setSection((s) => s - 1)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} /> Previous Section
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {/* Save only (don't advance) */}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border hover:bg-slate-50 transition-colors"
          >
            <Save size={15} /> Save
          </button>

          {section < 3 ? (
            <button
              onClick={handleSaveNext}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Save &amp; Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={kycSaving || (user?.customer_id && backendKyc?.kyc_status === 'verified')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {kycSaving
                ? <><Loader2 size={16} className="animate-spin" /> Submitting KYC…</>
                : <><CheckCircle size={16} /> Save Profile</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Mandatory fields note */}
      <p className="text-xs text-slate-400">
        Fields marked with <span className="text-red-500 font-semibold">*</span> are required to book shipments and use wallet features.
      </p>
    </div>
  )
}
