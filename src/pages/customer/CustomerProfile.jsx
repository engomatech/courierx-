import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle, ChevronRight, ChevronLeft, Save, User, FileText,
  ShieldCheck, ShieldAlert, ShieldOff, Upload, AlertCircle, Loader2,
  Copy, BadgeCheck, Mail, Phone, MapPin, KeyRound, Eye, EyeOff,
  MessageCircle, Calendar, Globe, Building2, Home, Hash, Briefcase,
  CreditCard,
} from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { useAdminStore } from '../../admin/adminStore'

/* ── Hub forwarding addresses ────────────────────────────────────────────────── */
const HUB_ADDRESSES = [
  {
    flag: '🇬🇧',
    country: 'United Kingdom',
    color: 'blue',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'Online Express UK',
      '128 Crompton Way',
      'Crawley, West Sussex',
      'RH10 9QS, United Kingdom',
    ],
  },
  {
    flag: '🇺🇸',
    country: 'United States',
    color: 'indigo',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'Online Express USA',
      '2248 Meridian Blvd, Suite H',
      'Minden, NV 89423',
      'United States',
    ],
  },
  {
    flag: '🇨🇳',
    country: 'China',
    color: 'rose',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'Online Express China',
      '广东省深圳市龙华区',
      '大浪街道大浪社区',
      'China',
    ],
  },
]

/* ── Completion gauge ────────────────────────────────────────────────────────── */
function CompletionGauge({ pct }) {
  const r = 36, circ = 2 * Math.PI * r
  const color = pct < 40 ? '#ef4444' : pct < 75 ? '#f59e0b' : '#10b981'
  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ - circ * (pct / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      </svg>
      <div className="text-center z-10">
        <div className="text-xl font-extrabold text-slate-900 leading-none">{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">done</div>
      </div>
    </div>
  )
}

/* ── Section stepper ─────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 1, label: 'Personal',  icon: User },
  { id: 2, label: 'Address',   icon: MapPin },
  { id: 3, label: 'Hub Info',  icon: Globe },
  { id: 4, label: 'KYC',       icon: FileText },
]

function SectionStepper({ active, setActive, completion }) {
  const pcts = [completion.s1, completion.s2, completion.s4, completion.s3]
  return (
    <div className="flex items-center gap-0 flex-wrap gap-y-2">
      {SECTIONS.map(({ id, label, icon: Icon }, i) => {
        const pct = pcts[i]
        const done = pct === 100
        const isActive = active === id
        return (
          <div key={id} className="flex items-center">
            <button
              onClick={() => setActive(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive ? 'bg-violet-600 text-white shadow-sm' :
                  done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
                  'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {done ? <CheckCircle size={15} /> : <Icon size={15} />}
              <span className="hidden sm:inline">{label}</span>
              <span className="inline sm:hidden">{id}</span>
              {!isActive && !done && pct > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-0.5">{pct}%</span>
              )}
            </button>
            {i < SECTIONS.length - 1 && (
              <ChevronRight size={16} className="text-slate-300 mx-1 flex-shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Input helpers ───────────────────────────────────────────────────────────── */
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white disabled:bg-slate-50 disabled:text-slate-400'
const sel = inp + ' appearance-none'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      <input className={`${inp} ${Icon ? 'pl-9' : ''}`} {...props} />
    </div>
  )
}

/* ── Copy button ─────────────────────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0
        ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50'}`}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

/* ── Hub Address Card ────────────────────────────────────────────────────────── */
function HubAddressCard({ hub, customerId, customerName }) {
  const colorMap = {
    blue:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
    indigo:{ bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    rose:  { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700' },
  }
  const c = colorMap[hub.color]
  const addressText = hub.lines
    .map((l) => l.replace('[YOUR NAME]', customerName || 'YOUR NAME').replace('[CUSTOMER ID]', customerId || 'CXXXXXNN'))
    .join('\n')

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{hub.flag}</span>
          <span className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{hub.country}</span>
        </div>
        <CopyBtn text={addressText} />
      </div>
      <div className="space-y-0.5">
        {hub.lines.map((line, i) => (
          <p key={i} className={`text-xs font-mono ${i === 0 ? `font-bold ${c.text}` : 'text-slate-600'}`}>
            {line.replace('[YOUR NAME]', customerName || 'YOUR NAME').replace('[CUSTOMER ID]', customerId || 'CXXXXXNN')}
          </p>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main: CustomerProfile
══════════════════════════════════════════════════════════════════════════════ */
export default function CustomerProfile() {
  const user               = useAuthStore((s) => s.user)
  const users              = useAuthStore((s) => s.users)
  const changePassword     = useAuthStore((s) => s.changePassword)
  const getProfile         = useCustomerStore((s) => s.getProfile)
  const saveProfileSection = useCustomerStore((s) => s.saveProfileSection)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const countries          = useAdminStore((s) => s.countries)
  const cities             = useAdminStore((s) => s.cities)

  const customerId = users.find((u) => u.id === user?.id)?.customerId || user?.customerId
  const stored     = getProfile(user?.id)

  const [section, setSection] = useState(1)
  const [saved,   setSaved]   = useState(false)

  // Change-password state
  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' })
  const [pwShow,    setPwShow]    = useState({ current: false, next: false, confirm: false })
  const [pwMsg,     setPwMsg]     = useState(null)
  const [pwSection, setPwSection] = useState(false)

  // Backend KYC
  const [backendKyc, setBackendKyc] = useState(null)
  const [kycFile,    setKycFile]    = useState(null)
  const [kycSaving,  setKycSaving]  = useState(false)
  const [kycSaveMsg, setKycSaveMsg] = useState(null)
  const fileInputRef = useRef(null)

  /* ── Section 1: Personal Details ── */
  const [s1, setS1] = useState({
    firstName:   stored.firstName   || user?.firstName   || '',
    surname:     stored.surname     || user?.surname      || '',
    pronouns:    stored.pronouns    || user?.pronouns     || '',
    companyName: stored.companyName || '',
    phone:       stored.phone       || user?.phone        || '',
    whatsapp:    stored.whatsapp    || '',
    dateOfBirth: stored.dateOfBirth || '',
    sex:         stored.sex         || user?.gender       || '',
    nationality: stored.nationality || '',
  })

  /* ── Section 2: Delivery Address ── */
  const [s2, setS2] = useState({
    houseNo:    stored.houseNo    || '',
    street:     stored.street     || '',
    address:    stored.address    || user?.town || '',   // town pre-fills from registration
    cityId:     stored.cityId     || '',
    countryId:  stored.countryId  || '',
    postalCode: stored.postalCode || '',
    hubId:      stored.hubId      || '',
  })

  /* ── Section 4 (KYC) ── */
  const [s4, setS4] = useState({
    tpin:           stored.tpin           || user?.tpin        || '',
    kycWith:        stored.kycWith        || '',
    idProofNo:      stored.idProofNo      || '',
    occupation:     stored.occupation     || user?.occupation  || '',
    kycCompanyName: stored.kycCompanyName || '',
    position:       stored.position       || '',
    maritalStatus:  stored.maritalStatus  || '',
  })

  // Sync on mount — profile fields first, fall back to authStore registration data
  useEffect(() => {
    const p  = getProfile(user?.id)
    const u  = user || {}  // authStore user (has registration-time fields)
    setS1({
      firstName:   p.firstName   || u.firstName   || '',
      surname:     p.surname     || u.surname      || '',
      pronouns:    p.pronouns    || u.pronouns     || '',
      companyName: p.companyName || '',
      phone:       p.phone       || u.phone        || '',
      whatsapp:    p.whatsapp    || '',
      dateOfBirth: p.dateOfBirth || '',
      sex:         p.sex         || u.gender       || '',
      nationality: p.nationality || '',
    })
    setS2({
      houseNo:    p.houseNo    || '',
      street:     p.street     || '',
      address:    p.address    || u.town           || '',   // town pre-fills from registration
      cityId:     p.cityId     || '',
      countryId:  p.countryId  || '',
      postalCode: p.postalCode || '',
      hubId:      p.hubId      || '',
    })
    setS4({
      tpin:           p.tpin           || u.tpin           || '',
      kycWith:        p.kycWith        || '',
      idProofNo:      p.idProofNo      || '',
      occupation:     p.occupation     || u.occupation     || '',
      kycCompanyName: p.kycCompanyName || '',
      position:       p.position       || '',
      maritalStatus:  p.maritalStatus  || '',
    })
  }, []) // eslint-disable-line

  // Load backend KYC
  useEffect(() => {
    if (!user?.customer_id) return
    fetch(`/api/v1/admin/customers/${user.customer_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.customer) setBackendKyc(d.customer) })
      .catch(() => {})
  }, [user?.customer_id])

  // Auto-assigned account number
  const autoAccountNo = user?.id
    ? (() => {
        const digits = user.id.replace(/\D/g, '').padStart(8, '0').slice(-8)
        return `ACC-${digits.slice(0, 4)}-${digits.slice(4)}`
      })()
    : ''

  async function submitBackendKyc() {
    if (!user?.customer_id || backendKyc?.kyc_status === 'verified') return
    setKycSaving(true); setKycSaveMsg(null)
    try {
      const fd = new FormData()
      fd.append('national_id',        s4.idProofNo || '')
      fd.append('kyc_document_type',  s4.kycWith   || '')
      fd.append('date_of_birth',      s1.dateOfBirth || '')
      fd.append('physical_address',   `${s2.houseNo} ${s2.street}, ${s2.address}`.trim())
      if (kycFile) fd.append('kyc_document', kycFile)
      const r = await fetch(`/api/v1/admin/customers/${user.customer_id}/kyc/submit`, { method: 'POST', body: fd })
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
    let data = {}
    if (section === 1) data = s1
    if (section === 2) data = s2
    if (section === 4) { data = s4; if (user?.customer_id) submitBackendKyc() }
    saveProfileSection(user?.id, data)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const handleSaveNext = () => { handleSave(); if (section < 4) setSection((s) => s + 1) }

  const filteredCities = cities.filter((c) => c.countryId === s2.countryId && c.status === 'Active')
  const HUBS = ['Lusaka Main Hub', 'Kitwe Hub', 'Ndola Hub', 'Livingstone Hub', 'Chipata Hub', 'Solwezi Hub']
  const KYC_OPTS = ['NRC', 'Passport', 'Driving Licence', 'TPIN Certificate', 'Company Registration']
  const SEX_OPTS = ['Male', 'Female', 'Other', 'Prefer not to say']
  const MARITAL_OPTS = ['Single', 'Married', 'Divorced', 'Widowed']

  const currentCompletion = getProfileCompletion(user?.id)

  return (
    <div className="p-6 space-y-5 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-start gap-5 flex-wrap">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">My Profile</h2>
          <p className="text-sm text-slate-400 mt-1">Keep your profile complete to access all Online Express services.</p>
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
                  ${currentCompletion.overall < 40 ? 'bg-red-500' : currentCompletion.overall < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${currentCompletion.overall}%` }}
              />
            </div>
          </div>
        </div>
        <CompletionGauge pct={currentCompletion.overall} />
      </div>

      {/* ── Account Overview ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <User size={15} className="text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Account Overview</h3>
            <p className="text-xs text-slate-400">Your Online Express registration details</p>
          </div>
        </div>

        {/* Customer ID — prominent */}
        {customerId && (
          <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <BadgeCheck size={18} className="text-violet-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-violet-500 mb-0.5">Customer ID — use to log in</div>
                <div className="text-2xl font-extrabold font-mono text-violet-900 tracking-widest">{customerId}</div>
              </div>
            </div>
            <CopyBtn text={customerId} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: User,        label: 'Full Name',
              value: [s1.firstName, s1.surname].filter(Boolean).join(' ') || stored.name || '—' },
            { icon: User,        label: 'Title',
              value: s1.pronouns || stored.pronouns || '—' },
            { icon: Mail,        label: 'Email Address',   value: user?.email || '—' },
            { icon: Phone,       label: 'Phone',           value: s1.phone || stored.phone || '—' },
            { icon: MessageCircle, label: 'WhatsApp',      value: s1.whatsapp || stored.whatsapp || '—' },
            { icon: Calendar,    label: 'Date of Birth',   value: s1.dateOfBirth || stored.dateOfBirth || '—' },
            { icon: MapPin,      label: 'Delivery Address',
              value: [s2.houseNo, s2.street, s2.address].filter(Boolean).join(', ') || '—' },
            { icon: Hash,        label: 'TPIN',            value: s4.tpin || stored.tpin || '—' },
            { icon: CreditCard,  label: 'Account No',      value: autoAccountNo || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className="text-sm text-slate-800 font-semibold truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <button
          onClick={() => { setPwSection((v) => !v); setPwMsg(null) }}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <KeyRound size={15} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm">Change Password</h3>
            <p className="text-xs text-slate-400">Update your login password at any time</p>
          </div>
          <ChevronRight size={16} className={`text-slate-300 transition-transform ${pwSection ? 'rotate-90' : ''}`} />
        </button>
        {pwSection && (
          <div className="px-5 pb-5 border-t pt-4 space-y-3">
            {(['current', 'next', 'confirm']).map((key) => {
              const labels = { current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' }
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{labels[key]}</label>
                  <div className="relative">
                    <input
                      type={pwShow[key] ? 'text' : 'password'}
                      value={pwForm[key]}
                      onChange={(e) => setPwForm((v) => ({ ...v, [key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
                      placeholder={key === 'current' ? 'Enter current password' : key === 'next' ? 'Min 6 characters' : 'Repeat new password'}
                    />
                    <button type="button" onClick={() => setPwShow((v) => ({ ...v, [key]: !v[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {pwShow[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
            {pwMsg && (
              <div className={`flex items-center gap-2 text-xs rounded-xl px-4 py-2.5
                ${pwMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {pwMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {pwMsg.text}
              </div>
            )}
            <button
              onClick={() => {
                if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return }
                const res = changePassword(user?.id, pwForm.current, pwForm.next)
                if (res.error) { setPwMsg({ ok: false, text: res.error }); return }
                setPwMsg({ ok: true, text: 'Password changed successfully!' })
                setPwForm({ current: '', next: '', confirm: '' })
              }}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Update Password
            </button>
          </div>
        )}
      </div>

      {/* Section stepper */}
      <SectionStepper active={section} setActive={setSection} completion={currentCompletion} />

      {/* Saved toast */}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} className="text-emerald-600" /> Section saved successfully!
        </div>
      )}

      {/* ── Section 1: Personal Details ─────────────────────────────────────── */}
      {section === 1 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <User size={16} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-sm">Personal Details</h3>
              <p className="text-xs text-slate-400">Your name, contact numbers and personal information</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
              ${currentCompletion.s1 === 100 ? 'bg-emerald-100 text-emerald-700' :
                currentCompletion.s1 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              {currentCompletion.s1}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <IconInput icon={User} value={s1.firstName} onChange={(e) => setS1((v) => ({ ...v, firstName: e.target.value }))} placeholder="Jane" />
            </Field>
            <Field label="Surname" required>
              <IconInput icon={User} value={s1.surname} onChange={(e) => setS1((v) => ({ ...v, surname: e.target.value }))} placeholder="Banda" />
            </Field>
            <Field label="Title">
              <select value={s1.pronouns} onChange={(e) => setS1((v) => ({ ...v, pronouns: e.target.value }))} className={sel}>
                <option value="">— Select Title —</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
                <option value="Rev">Rev</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Company Name">
              <IconInput icon={Building2} value={s1.companyName} onChange={(e) => setS1((v) => ({ ...v, companyName: e.target.value }))} placeholder="Optional" />
            </Field>
            <Field label="Email">
              <IconInput icon={Mail} value={user?.email || ''} disabled />
            </Field>
            <Field label="Phone Number" required>
              <IconInput icon={Phone} value={s1.phone} onChange={(e) => setS1((v) => ({ ...v, phone: e.target.value }))} placeholder="+260 97 123 4567" type="tel" />
            </Field>
            <Field label="WhatsApp Number" hint="Leave blank if same as phone">
              <IconInput icon={MessageCircle} value={s1.whatsapp} onChange={(e) => setS1((v) => ({ ...v, whatsapp: e.target.value }))} placeholder="+260 97 123 4567" type="tel" />
            </Field>
            <Field label="Date of Birth" required>
              <IconInput icon={Calendar} type="date" value={s1.dateOfBirth}
                onChange={(e) => setS1((v) => ({ ...v, dateOfBirth: e.target.value }))}
                max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Sex" required>
              <select value={s1.sex} onChange={(e) => setS1((v) => ({ ...v, sex: e.target.value }))} className={sel}>
                <option value="">— Please Select —</option>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Nationality">
              <IconInput icon={Globe} value={s1.nationality} onChange={(e) => setS1((v) => ({ ...v, nationality: e.target.value }))} placeholder="e.g. Zambian" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Section 2: Delivery Address ─────────────────────────────────────── */}
      {section === 2 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin size={16} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-sm">Delivery Address</h3>
              <p className="text-xs text-slate-400">Your full postal address for parcel delivery — must include house/flat number and road name</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
              ${currentCompletion.s2 === 100 ? 'bg-emerald-100 text-emerald-700' :
                currentCompletion.s2 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              {currentCompletion.s2}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="House / Flat Number" required>
              <IconInput icon={Home} value={s2.houseNo} onChange={(e) => setS2((v) => ({ ...v, houseNo: e.target.value }))} placeholder="e.g. Flat 4, House 12" />
            </Field>
            <Field label="Street / Road Name" required>
              <IconInput icon={MapPin} value={s2.street} onChange={(e) => setS2((v) => ({ ...v, street: e.target.value }))} placeholder="e.g. Cairo Road" />
            </Field>
            <Field label="Town / Area" required>
              <input value={s2.address} onChange={(e) => setS2((v) => ({ ...v, address: e.target.value }))}
                className={inp} placeholder="e.g. Longacres, Lusaka" />
            </Field>
            <Field label="Postal Code">
              <input value={s2.postalCode} onChange={(e) => setS2((v) => ({ ...v, postalCode: e.target.value }))}
                className={inp} placeholder="e.g. 10101" />
            </Field>
            <Field label="Country" required>
              <select value={s2.countryId} onChange={(e) => setS2((v) => ({ ...v, countryId: e.target.value, cityId: '' }))} className={sel}>
                <option value="">— Please Select —</option>
                {countries.filter((c) => c.status === 'Active').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="City" required>
              <select value={s2.cityId} onChange={(e) => setS2((v) => ({ ...v, cityId: e.target.value }))} className={sel}
                disabled={!s2.countryId}>
                <option value="">— Please Select —</option>
                {filteredCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nearest Online Express Hub">
              <select value={s2.hubId} onChange={(e) => setS2((v) => ({ ...v, hubId: e.target.value }))} className={sel}>
                <option value="">— Please Select —</option>
                {HUBS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* ── Section 3: Hub Forwarding Addresses ─────────────────────────────── */}
      {section === 3 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Online Express Forwarding Hub Addresses</h3>
              <p className="text-xs text-slate-400">Use these addresses when shopping online — your parcels arrive at our hub and we forward them to you</p>
            </div>
          </div>

          {/* How it works banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">💡</span>
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">How to use your hub addresses:</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                <li>Shop on any UK, US, or Chinese website and enter the hub address as your shipping address.</li>
                <li>Include your <strong>full name</strong> and <strong>Customer ID ({customerId})</strong> as the first line so we can identify your parcel.</li>
                <li>We receive, consolidate and forward your parcel to Zambia.</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            {HUB_ADDRESSES.map((hub) => (
              <HubAddressCard
                key={hub.country}
                hub={hub}
                customerId={customerId}
                customerName={[s1.firstName, s1.surname].filter(Boolean).join(' ') || stored.name || user?.name}
              />
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Your Account Reference:</span>
              <span className="font-mono font-bold text-violet-700 ml-2">{autoAccountNo}</span>
              <CopyBtn text={autoAccountNo} />
            </p>
            <p className="text-xs text-slate-400 mt-1">Use this reference number when making payments or contacting support.</p>
          </div>
        </div>
      )}

      {/* ── Section 4: KYC & Compliance ─────────────────────────────────────── */}
      {section === 4 && (
        <div className="bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-sm">KYC & Compliance</h3>
              <p className="text-xs text-slate-400">Identity verification required by Zambian customs regulations</p>
            </div>
            <div className="flex items-center gap-2">
              {user?.customer_id && backendKyc && (() => {
                const ks = backendKyc.kyc_status || 'not_started'
                const cfg = {
                  not_started: { cls: 'bg-slate-100 text-slate-500',     icon: ShieldOff,   label: 'KYC Pending' },
                  submitted:   { cls: 'bg-amber-100 text-amber-700',     icon: ShieldAlert, label: '● Submitted' },
                  verified:    { cls: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck, label: '✓ Verified' },
                  rejected:    { cls: 'bg-red-100 text-red-600',         icon: ShieldOff,   label: '✗ Rejected' },
                }
                const { cls, icon: Icon, label } = cfg[ks] || cfg.not_started
                return <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}><Icon size={11} />{label}</span>
              })()}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${currentCompletion.s3 === 100 ? 'bg-emerald-100 text-emerald-700' :
                  currentCompletion.s3 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {currentCompletion.s3}%
              </span>
            </div>
          </div>

          {/* Rejection / Verified banners */}
          {user?.customer_id && backendKyc?.kyc_status === 'rejected' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <ShieldOff size={15} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-700">KYC Rejected</p>
                {backendKyc.kyc_rejection_reason && <p className="text-red-600 text-xs mt-0.5">{backendKyc.kyc_rejection_reason}</p>}
                <p className="text-red-600 text-xs mt-1">Please update your details and resubmit.</p>
              </div>
            </div>
          )}
          {user?.customer_id && backendKyc?.kyc_status === 'verified' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <ShieldCheck size={15} className="shrink-0" />
              <span className="font-semibold">KYC Verified</span>
              <span className="text-xs text-emerald-600 ml-1">— your identity has been confirmed. No further action needed.</span>
            </div>
          )}

          {/* TPIN — prominent at the top */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={15} className="text-amber-600" />
              <p className="text-sm font-bold text-amber-800">TPIN Number (Required)</p>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Your Tax Payer Identification Number (TPIN) is required by Zambia Revenue Authority for all imported shipments.
              If you don't have a TPIN, please register at <a href="https://www.zra.org.zm" target="_blank" rel="noreferrer" className="underline font-medium">zra.org.zm</a>.
            </p>
            <IconInput
              icon={Hash}
              value={s4.tpin}
              onChange={(e) => setS4((v) => ({ ...v, tpin: e.target.value }))}
              placeholder="Enter your TPIN number"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID Document Type" required>
              <select value={s4.kycWith} onChange={(e) => setS4((v) => ({ ...v, kycWith: e.target.value }))} className={sel}>
                <option value="">— Please Select —</option>
                {KYC_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="ID / Document Number" required>
              <IconInput icon={Hash} value={s4.idProofNo} onChange={(e) => setS4((v) => ({ ...v, idProofNo: e.target.value }))} placeholder="e.g. 123456/78/1" />
            </Field>
            <Field label="Occupation">
              <IconInput icon={Briefcase} value={s4.occupation} onChange={(e) => setS4((v) => ({ ...v, occupation: e.target.value }))} placeholder="e.g. Business Owner" />
            </Field>
            <Field label="Company Name">
              <IconInput icon={Building2} value={s4.kycCompanyName} onChange={(e) => setS4((v) => ({ ...v, kycCompanyName: e.target.value }))} placeholder="Optional" />
            </Field>
            <Field label="Position / Title">
              <input value={s4.position} onChange={(e) => setS4((v) => ({ ...v, position: e.target.value }))} className={inp} placeholder="e.g. Director" />
            </Field>
            <Field label="Marital Status">
              <select value={s4.maritalStatus} onChange={(e) => setS4((v) => ({ ...v, maritalStatus: e.target.value }))} className={sel}>
                <option value="">— Please Select —</option>
                {MARITAL_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          {/* Real file upload */}
          {backendKyc?.kyc_status !== 'verified' && (
            <Field label="Upload ID Document" hint="Clear photo or scan — JPG, PNG, or PDF · max 5 MB">
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                  ${kycFile ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} className={`mx-auto mb-1 ${kycFile ? 'text-violet-500' : 'text-slate-300'}`} />
                {kycFile ? (
                  <p className="text-xs text-violet-700 font-medium">{kycFile.name}</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Click to upload ID document</p>
                    <p className="text-xs text-slate-400 mt-0.5">NRC, Passport, or Driving Licence — JPG, PNG or PDF</p>
                    {backendKyc?.kyc_document_path && (
                      <p className="text-xs text-emerald-600 mt-1">✓ Document already on file — upload new to replace</p>
                    )}
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,application/pdf"
                  className="hidden" onChange={e => setKycFile(e.target.files?.[0] || null)} />
              </div>
            </Field>
          )}

          {kycSaveMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3
              ${kycSaveMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {kycSaveMsg.ok ? <ShieldCheck size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
              {kycSaveMsg.text}
            </div>
          )}
        </div>
      )}

      {/* ── Nav buttons ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {section > 1 ? (
          <button onClick={() => setSection((s) => s - 1)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} /> Previous
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border hover:bg-slate-50 transition-colors">
            <Save size={15} /> Save
          </button>
          {section < 4 ? (
            <button onClick={handleSaveNext}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={kycSaving || (user?.customer_id && backendKyc?.kyc_status === 'verified')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {kycSaving
                ? <><Loader2 size={16} className="animate-spin" /> Submitting KYC…</>
                : <><CheckCircle size={16} /> Save & Submit KYC</>
              }
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Fields marked <span className="text-red-500 font-semibold">*</span> are required to book shipments and pass customs clearance.
      </p>
    </div>
  )
}
