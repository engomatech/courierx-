import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle, Save, User, FileText, Upload, AlertCircle, Loader2,
  Copy, BadgeCheck, Mail, Phone, MapPin, Hash, Briefcase,
  MessageCircle, Calendar, Globe, Building2, Home,
  ShieldCheck, ShieldAlert, ShieldOff,
} from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { useAdminStore } from '../../admin/adminStore'
import { ADMIN_HEADERS } from '../../apiHeaders'

/* ── Hub forwarding addresses ────────────────────────────────────────────────── */
const HUB_ADDRESSES = [
  {
    flag: '🇭🇰',
    country: 'Hong Kong',
    color: 'amber',
    note: 'Use this address for all deliveries that cannot be delivered within mainland China.',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'DPEX Worldwide (HK) Ltd',
      'Flat B1, 12F Block B',
      'Yee Lim Industrial Centre',
      '2-28 Kwai Lok Street',
      'Kwai Chung, New Territories',
      'Hong Kong',
      'Tel: +852 8106 3232',
    ],
  },
  {
    flag: '🇨🇳',
    country: 'China Mainland',
    color: 'rose',
    note: 'Use this address for all deliveries within mainland China only.',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'No.133 Liangbai Road',
      'Pinghu Street, Longgang District',
      'Shenzhen City, China 518111',
      'TEL: 18998992874',
    ],
  },
]

/* ── Input styles ─────────────────────────────────────────────────────────── */
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white disabled:bg-slate-50 disabled:text-slate-400'
const sel = inp + ' appearance-none'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
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

/* ── Section heading ──────────────────────────────────────────────────────── */
function SectionHeading({ title, description }) {
  return (
    <div className="pb-3 border-b border-slate-100 mb-5">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
  )
}

/* ── Hub Address Card ─────────────────────────────────────────────────────── */
function HubAddressCard({ hub, customerId, customerName }) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', note: 'bg-amber-100 text-amber-800' },
    rose:  { bg: 'bg-rose-50',  border: 'border-rose-200',  text: 'text-rose-700',  note: 'bg-rose-100 text-rose-800'  },
  }
  const c = colorMap[hub.color]
  const addressText = hub.lines
    .map((l) => l.replace('[YOUR NAME]', customerName || 'YOUR NAME').replace('[CUSTOMER ID]', customerId || 'CXXXXXNN'))
    .join('\n')
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 space-y-3`}>
      <div className="flex items-center justify-between">
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
      {hub.note && (
        <div className={`flex items-start gap-1.5 text-xs rounded-lg px-3 py-2 ${c.note}`}>
          <span className="shrink-0">ℹ️</span>
          <span>{hub.note}</span>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main: CustomerProfile
══════════════════════════════════════════════════════════════════════════════ */
export default function CustomerProfile() {
  const user               = useAuthStore((s) => s.user)
  const users              = useAuthStore((s) => s.users)
  const getProfile         = useCustomerStore((s) => s.getProfile)
  const saveProfileSection = useCustomerStore((s) => s.saveProfileSection)
  const countries          = useAdminStore((s) => s.countries)
  const cities             = useAdminStore((s) => s.cities)

  const customerId = users.find((u) => u.id === user?.id)?.customerId || user?.customerId
  const stored     = getProfile(user?.id)

  const [saved,        setSaved]      = useState(false)
  const [profileError, setProfileError] = useState('')
  const [backendKyc,   setBackendKyc] = useState(null)
  const [kycFile,      setKycFile]    = useState(null)
  const [kycSaving,    setKycSaving]  = useState(false)
  const [kycSaveMsg,   setKycSaveMsg] = useState(null)
  const fileInputRef = useRef(null)

  /* ── Form state — single flat object ── */
  const [form, setForm] = useState({
    firstName:   stored.firstName   || user?.firstName   || '',
    surname:     stored.surname     || user?.surname      || '',
    pronouns:    stored.pronouns    || user?.pronouns     || '',
    companyName: stored.companyName || '',
    phone:       stored.phone       || user?.phone        || '',
    whatsapp:    stored.whatsapp    || '',
    dateOfBirth: stored.dateOfBirth || '',
    sex:         stored.sex         || user?.gender       || '',
    nationality: stored.nationality || '',
    // Address
    houseNo:    stored.houseNo    || '',
    street:     stored.street     || '',
    address:    stored.address    || user?.town || '',
    cityId:     stored.cityId     || '',
    countryId:  stored.countryId  || '',
    postalCode: stored.postalCode || '',
    hubId:      stored.hubId      || '',
    // KYC
    tpin:           stored.tpin           || user?.tpin       || '',
    kycWith:        stored.kycWith        || '',
    idProofNo:      stored.idProofNo      || '',
    occupation:     stored.occupation     || user?.occupation || '',
    kycCompanyName: stored.kycCompanyName || '',
    position:       stored.position       || '',
    maritalStatus:  stored.maritalStatus  || '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    const p = getProfile(user?.id)
    const u = user || {}
    setForm({
      firstName:   p.firstName   || u.firstName   || '',
      surname:     p.surname     || u.surname      || '',
      pronouns:    p.pronouns    || u.pronouns     || '',
      companyName: p.companyName || '',
      phone:       p.phone       || u.phone        || '',
      whatsapp:    p.whatsapp    || '',
      dateOfBirth: p.dateOfBirth || '',
      sex:         p.sex         || u.gender       || '',
      nationality: p.nationality || '',
      houseNo:    p.houseNo    || '',
      street:     p.street     || '',
      address:    p.address    || u.town || '',
      cityId:     p.cityId     || '',
      countryId:  p.countryId  || '',
      postalCode: p.postalCode || '',
      hubId:      p.hubId      || '',
      tpin:           p.tpin           || u.tpin       || '',
      kycWith:        p.kycWith        || '',
      idProofNo:      p.idProofNo      || '',
      occupation:     p.occupation     || u.occupation || '',
      kycCompanyName: p.kycCompanyName || '',
      position:       p.position       || '',
      maritalStatus:  p.maritalStatus  || '',
    })
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!user?.customer_id) return
    fetch(`/api/v1/admin/customers/${user.customer_id}`, { headers: ADMIN_HEADERS })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.customer) setBackendKyc(d.customer) })
      .catch(() => {})
  }, [user?.customer_id])

  async function submitBackendKyc() {
    if (!user?.customer_id || backendKyc?.kyc_status === 'verified') return
    setKycSaving(true); setKycSaveMsg(null)
    try {
      const fd = new FormData()
      fd.append('national_id',        form.idProofNo || '')
      fd.append('kyc_document_type',  form.kycWith   || '')
      fd.append('date_of_birth',      form.dateOfBirth || '')
      fd.append('physical_address',   `${form.houseNo} ${form.street}, ${form.address}`.trim())
      if (kycFile) fd.append('kyc_document', kycFile)
      const r = await fetch(`/api/v1/admin/customers/${user.customer_id}/kyc/submit`, { method: 'POST', headers: ADMIN_HEADERS, body: fd })
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
    setProfileError('')
    if (!form.firstName.trim() || !form.surname.trim()) {
      setProfileError('First name and surname are required.')
      return
    }
    if (!form.address.trim()) {
      setProfileError('Town / Area is required.')
      return
    }
    const { tpin, kycWith, idProofNo, occupation, kycCompanyName, position, maritalStatus, ...rest } = form
    saveProfileSection(user?.id, { ...rest })
    saveProfileSection(user?.id, { tpin, kycWith, idProofNo, occupation, kycCompanyName, position, maritalStatus })
    if (user?.customer_id) submitBackendKyc()
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const filteredCities = cities.filter((c) => c.countryId === form.countryId && c.status === 'Active')
  const HUBS      = ['Lusaka Main Hub', 'Kitwe Hub', 'Ndola Hub', 'Livingstone Hub', 'Chipata Hub', 'Solwezi Hub']
  const KYC_OPTS  = ['NRC', 'Passport', 'Driving Licence', 'TPIN Certificate', 'Company Registration']
  const customerName = [form.firstName, form.surname].filter(Boolean).join(' ') || stored.name || user?.name

  const kycStatus = backendKyc?.kyc_status || 'not_started'
  const kycCfg = {
    not_started: { cls: 'bg-slate-100 text-slate-500',     icon: ShieldOff,   label: 'KYC Pending' },
    submitted:   { cls: 'bg-amber-100 text-amber-700',     icon: ShieldAlert, label: 'Under Review' },
    verified:    { cls: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck, label: 'Verified' },
    rejected:    { cls: 'bg-red-100 text-red-600',         icon: ShieldOff,   label: 'Rejected' },
  }
  const { cls: kycCls, icon: KycIcon, label: kycLabel } = kycCfg[kycStatus] || kycCfg.not_started

  return (
    <div className="p-6 max-w-2xl space-y-6">

      {/* ── Account Details (read-only) ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <SectionHeading title="Account Details" description="Your Online Express account information" />

        {customerId && (
          <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <BadgeCheck size={18} className="text-violet-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-violet-500 mb-0.5">Customer ID — use to log in</div>
                <div className="text-xl font-extrabold font-mono text-violet-900 tracking-widest">{customerId}</div>
              </div>
            </div>
            <CopyBtn text={customerId} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email Address">
            <IconInput icon={Mail} value={user?.email || ''} disabled />
          </Field>
          <Field label="Account Status">
            <div className="flex items-center h-10 px-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm text-slate-500 capitalize">{user?.status || 'active'}</span>
            </div>
          </Field>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <SectionHeading title="Personal Information" description="Your name and personal details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required>
            <IconInput icon={User} value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" />
          </Field>
          <Field label="Surname" required>
            <IconInput icon={User} value={form.surname}
              onChange={(e) => set('surname', e.target.value)} placeholder="Banda" />
          </Field>
          <Field label="Title">
            <select value={form.pronouns} onChange={(e) => set('pronouns', e.target.value)} className={sel}>
              <option value="">— Select Title —</option>
              {['Mr','Mrs','Miss','Ms','Dr','Prof','Rev','Other'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Gender">
            <select value={form.sex} onChange={(e) => set('sex', e.target.value)} className={sel}>
              <option value="">— Please Select —</option>
              {['Male','Female','Other','Prefer not to say'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Date of Birth">
            <IconInput icon={Calendar} type="date" value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Nationality">
            <IconInput icon={Globe} value={form.nationality}
              onChange={(e) => set('nationality', e.target.value)} placeholder="e.g. Zambian" />
          </Field>
        </div>
      </div>

      {/* ── Contact Information ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <SectionHeading title="Contact Information" description="Phone numbers and delivery address" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number" required>
            <IconInput icon={Phone} type="tel" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} placeholder="+260 97 123 4567" />
          </Field>
          <Field label="WhatsApp Number" hint="Leave blank if same as phone">
            <IconInput icon={MessageCircle} type="tel" value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)} placeholder="+260 97 123 4567" />
          </Field>
          <Field label="House / Flat Number" required>
            <IconInput icon={Home} value={form.houseNo}
              onChange={(e) => set('houseNo', e.target.value)} placeholder="e.g. Flat 4, House 12" />
          </Field>
          <Field label="Street / Road Name" required>
            <IconInput icon={MapPin} value={form.street}
              onChange={(e) => set('street', e.target.value)} placeholder="e.g. Cairo Road" />
          </Field>
          <Field label="Town / Area" required>
            <input value={form.address} onChange={(e) => set('address', e.target.value)}
              className={inp} placeholder="e.g. Longacres, Lusaka" />
          </Field>
          <Field label="Postal Code">
            <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)}
              className={inp} placeholder="e.g. 10101" />
          </Field>
          <Field label="Country" required>
            <select value={form.countryId}
              onChange={(e) => set('countryId', e.target.value)} className={sel}>
              <option value="">— Please Select —</option>
              {countries.filter((c) => c.status === 'Active').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="City" required>
            <select value={form.cityId}
              onChange={(e) => set('cityId', e.target.value)} className={sel}
              disabled={!form.countryId}>
              <option value="">— Please Select —</option>
              {filteredCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Nearest Online Express Hub">
            <select value={form.hubId} onChange={(e) => set('hubId', e.target.value)} className={sel}>
              <option value="">— Please Select —</option>
              {HUBS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="Company Name">
            <IconInput icon={Building2} value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </div>

      {/* ── KYC & Compliance ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">KYC &amp; Compliance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Identity verification required by Zambian customs</p>
          </div>
          {user?.customer_id && backendKyc && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${kycCls}`}>
              <KycIcon size={11} />{kycLabel}
            </span>
          )}
        </div>

        {user?.customer_id && backendKyc?.kyc_status === 'rejected' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
            <ShieldOff size={15} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">KYC Rejected</p>
              {backendKyc.kyc_rejection_reason && <p className="text-red-600 text-xs mt-0.5">{backendKyc.kyc_rejection_reason}</p>}
              <p className="text-red-600 text-xs mt-1">Please update your details and save changes to resubmit.</p>
            </div>
          </div>
        )}
        {user?.customer_id && backendKyc?.kyc_status === 'verified' && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 mb-4">
            <ShieldCheck size={15} className="shrink-0" />
            <span className="font-semibold">KYC Verified</span>
            <span className="text-xs text-emerald-600 ml-1">— your identity has been confirmed.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="TPIN Number" required hint="Your Tax Payer Identification Number from ZRA — required for all imports">
              <IconInput icon={Hash} value={form.tpin}
                onChange={(e) => set('tpin', e.target.value)} placeholder="Enter your TPIN number" />
            </Field>
          </div>
          <Field label="ID Document Type" required>
            <select value={form.kycWith} onChange={(e) => set('kycWith', e.target.value)} className={sel}>
              <option value="">— Please Select —</option>
              {KYC_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="ID / Document Number" required>
            <IconInput icon={Hash} value={form.idProofNo}
              onChange={(e) => set('idProofNo', e.target.value)} placeholder="e.g. 123456/78/1" />
          </Field>
          <Field label="Occupation">
            <IconInput icon={Briefcase} value={form.occupation}
              onChange={(e) => set('occupation', e.target.value)} placeholder="e.g. Business Owner" />
          </Field>
          <Field label="Marital Status">
            <select value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)} className={sel}>
              <option value="">— Please Select —</option>
              {['Single','Married','Divorced','Widowed'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>

        {backendKyc?.kyc_status !== 'verified' && (
          <div className="mt-4">
            <Field label="Upload ID Document" hint="Clear photo or scan — JPG, PNG, or PDF · max 5 MB">
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors mt-1.5
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
          </div>
        )}

        {kycSaveMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mt-4
            ${kycSaveMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {kycSaveMsg.ok ? <ShieldCheck size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            {kycSaveMsg.text}
          </div>
        )}
      </div>

      {/* ── Save Changes ── */}
      {profileError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0" /> {profileError}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} className="text-emerald-600" /> Profile saved successfully!
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={kycSaving}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
      >
        {kycSaving
          ? <><Loader2 size={16} className="animate-spin" /> Saving &amp; submitting KYC…</>
          : <><Save size={16} /> Save Changes</>
        }
      </button>

      <p className="text-xs text-slate-400 pb-2">
        Fields marked <span className="text-red-500 font-semibold">*</span> are required to book shipments and pass customs clearance.
      </p>

      {/* ── Forwarding Hub Addresses ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <SectionHeading
          title="Online Express Forwarding Hub Addresses"
          description="Use these addresses when shopping online — include your name and Customer ID so we can identify your parcel"
        />

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-1">How to use:</p>
            <ol className="space-y-0.5 list-decimal list-inside">
              <li>Shop on any UK, US, or Chinese website and enter the hub address as your delivery address.</li>
              <li>Include your <strong>full name</strong> and <strong>Customer ID ({customerId})</strong> on the first line.</li>
              <li>We receive, consolidate and forward your parcel to Zambia.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {HUB_ADDRESSES.map((hub) => (
            <HubAddressCard key={hub.country} hub={hub} customerId={customerId} customerName={customerName} />
          ))}
        </div>
      </div>

    </div>
  )
}
