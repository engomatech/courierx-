import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw, FileText, ShieldCheck, UserCheck, X } from 'lucide-react'

// ── Terms & Conditions content ────────────────────────────────
const TERMS = [
  { n: '1',  title: 'ACCEPTANCE OF TERMS',     body: 'By registering or using Online Express services, you agree to be legally bound by these Terms & Conditions. Acceptance occurs upon account registration, shipment creation, or use of our services.' },
  { n: '2',  title: 'DEFINITIONS',             body: 'Shipment: Any parcel transported under one tracking number. Customer ID: Unique identifier assigned to each customer. Hub Address: Virtual address (UK, USA, China). Declared Value: Value declared for customs and insurance.' },
  { n: '3',  title: 'SCOPE OF SERVICES',       body: 'International e-commerce forwarding, consolidation, customs clearance support, last-mile delivery, and tracking services.' },
  { n: '4',  title: 'CUSTOMER OBLIGATIONS',    body: 'Provide accurate information, use your Customer ID, declare correct values, comply with all applicable laws, and pay all charges. Failure may result in delays, seizure, or suspension of your account.' },
  { n: '5',  title: 'PROHIBITED ITEMS',        body: 'Illegal goods, weapons, narcotics, counterfeit goods, and hazardous materials are strictly prohibited. Online Express reserves the right to refuse or dispose of any such items.' },
  { n: '6',  title: 'PRICING & PAYMENTS',      body: 'Charges are based on weight, destination, and service level selected. No parcel will be released without full payment of all applicable charges.' },
  { n: '7',  title: 'CUSTOMS CLEARANCE',       body: 'All shipments are subject to inspection by the relevant authorities. The customer is solely responsible for all applicable duties and taxes.' },
  { n: '8',  title: 'DELIVERY TERMS',          body: 'Delivery timelines are estimates only and may be affected by external factors including customs, weather, or carrier delays.' },
  { n: '9',  title: 'UNDELIVERABLE SHIPMENTS', body: 'Shipments with an incorrect address or an unresponsive recipient may result in return to sender, storage charges, or disposal at our discretion.' },
  { n: '10', title: 'LIABILITY LIMITATION',    body: 'Online Express is not liable for delays, customs actions, or damage resulting from improper packaging by the sender. Our liability is limited to the declared value of the shipment.' },
  { n: '11', title: 'INSURANCE',               body: 'Customers are strongly encouraged to purchase additional insurance for high-value items. Basic coverage is included as defined in our pricing schedule.' },
  { n: '12', title: 'CLAIMS & DISPUTES',       body: 'Claims for damage must be submitted within 48 hours of delivery. Claims for loss must be submitted within 7 days of the expected delivery date. Supporting documentation is required for all claims.' },
  { n: '13', title: 'STORAGE POLICY',          body: 'A free storage period applies to all shipments. Storage charges apply thereafter. Uncollected shipments may be disposed of after the maximum storage period.' },
  { n: '14', title: 'TRACKING & NOTIFICATIONS',body: "Tracking updates are provided via email, SMS, and WhatsApp. It is the customer's responsibility to ensure their contact details are accurate." },
  { n: '15', title: 'DATA PROTECTION',         body: 'Customer data is collected and used solely to provide our services and to comply with applicable legal requirements. We do not sell your personal data to third parties.' },
  { n: '16', title: 'SERVICE SUSPENSION',      body: 'Accounts may be suspended or terminated for fraud, misdeclaration of goods, or non-payment of charges.' },
  { n: '17', title: 'FORCE MAJEURE',           body: 'Online Express is not liable for any delays or failures caused by events beyond our reasonable control, including acts of God, strikes, or government actions.' },
  { n: '18', title: 'AMENDMENTS',              body: 'These Terms may be updated at any time. Continued use of our services following any update constitutes your acceptance of the revised Terms.' },
  { n: '19', title: 'GOVERNING LAW',           body: 'These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of Zambia.' },
  { n: '20', title: 'CONTACT',                 body: 'Online Express Limited — For queries regarding these Terms, please contact us via the details listed on our website at https://www.onlineexpress.co.zm.' },
]

const ZAMBIA_PROVINCES = [
  'Central Province', 'Copperbelt Province', 'Eastern Province', 'Luapula Province',
  'Lusaka Province', 'Muchinga Province', 'Northern Province', 'North-Western Province',
  'Southern Province', 'Western Province',
]

function TermsBox() {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
        <FileText size={14} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Terms & Conditions of Service</span>
        <span className="ml-auto text-xs text-slate-400">Online Express Zambia</span>
      </div>
      <div className="h-48 overflow-y-auto px-4 py-3 text-xs text-slate-600 space-y-3 bg-white">
        {TERMS.map((t) => (
          <div key={t.n}>
            <p className="font-semibold text-slate-800">{t.n}. {t.title}</p>
            <p className="mt-0.5 leading-relaxed">{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Duplicate-account notification ────────────────────────────
function DuplicateAccountNotice({ field, value, onDismiss }) {
  const config = {
    email: {
      body:  <>An account is already registered with email <span className="font-semibold">{value}</span>.</>,
      label: 'email address',
    },
    phone: {
      body:  <>An account is already registered with phone number <span className="font-semibold">{value}</span>.</>,
      label: 'phone number',
    },
    tpin: {
      body:  <>A TPIN of <span className="font-semibold">{value}</span> is already linked to an existing account. Each TPIN can only be registered once.</>,
      label: 'TPIN',
    },
  }
  const { body, label } = config[field] || config.email
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <UserCheck size={16} className="text-amber-700" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900 text-sm">Account already exists</p>
          <p className="text-amber-800 text-sm mt-0.5">{body}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
            >
              Sign in to your account
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2 transition-colors"
            >
              Use a different {label}
            </button>
          </div>
        </div>
        <button type="button" onClick={onDismiss}
          className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors" aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

const REQ = <span className="text-red-500">*</span>

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '', surname: '', pronouns: '', gender: '',
    email: '', phone: '',
    plotNo: '', street: '', area: '', town: '', province: '',
    tpin: '', occupation: '',
    password: '', confirm: '',
  })
  const [showPwd,         setShowPwd]         = useState(false)
  const [showCfm,         setShowCfm]         = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [agreed,          setAgreed]          = useState(false)
  const [duplicateNotice, setDuplicateNotice] = useState(null) // { field: 'email'|'phone'|'tpin', value }

  // After successful registration
  const [pending, setPending] = useState(null) // { email, name }

  // OTP verification state
  const [otp,       setOtp]       = useState('')
  const [otpLoading,setOtpLoading]= useState(false)
  const [otpError,  setOtpError]  = useState('')
  const [otpSuccess,setOtpSuccess]= useState(false)
  const [resending, setResending] = useState(false)
  const [resentMsg, setResentMsg] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDuplicateNotice(null)

    // ── Mandatory field validation ─────────────────────────────
    if (!form.firstName.trim() || !form.surname.trim()) { setError('First name and surname are required.'); return }
    if (!form.email.trim())      { setError('Email address is required.'); return }
    if (!form.phone.trim())      { setError('Phone number is required.'); return }
    if (!form.gender)            { setError('Please select your gender.'); return }
    if (!form.occupation.trim()) { setError('Profession / Occupation is required.'); return }
    if (!form.plotNo.trim())     { setError('Plot / House No. is required.'); return }
    if (!form.street.trim())     { setError('Street name is required.'); return }
    if (!form.area.trim())       { setError('Area / Suburb / Compound is required.'); return }
    if (!form.town.trim())       { setError('Town / City is required.'); return }
    if (!form.province)          { setError('Province is required.'); return }
    if (!form.tpin.trim())       { setError('TPIN is required for customs clearance and account verification.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return }
    if (!agreed) { setError('You must read and accept the Terms & Conditions to register.'); return }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    try {
      const physicalAddress = [form.plotNo, form.street, form.area, form.town, form.province]
        .filter(Boolean).join(', ')

      const res = await fetch('/api/portal/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          firstName:       form.firstName,
          surname:         form.surname,
          pronouns:        form.pronouns,
          gender:          form.gender,
          email:           form.email,
          phone:           form.phone,
          plotNo:          form.plotNo,
          street:          form.street,
          area:            form.area,
          town:            form.town,
          province:        form.province,
          physicalAddress,
          tpin:            form.tpin,
          occupation:      form.occupation,
          password:        form.password,
          verifyBaseUrl:   window.location.origin,
        }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) {
        const msg  = (data.message || '').toLowerCase()
        const code = data.code || ''
        const isDupEmail = code === 'DUPLICATE_EMAIL' || res.status === 409 ||
          (msg.includes('email') && (msg.includes('exist') || msg.includes('taken') || msg.includes('already') || msg.includes('registered')))
        if (isDupEmail) { setDuplicateNotice({ field: 'email', value: form.email }); return }

        const isDupPhone = code === 'DUPLICATE_PHONE' ||
          (msg.includes('phone') && (msg.includes('exist') || msg.includes('taken') || msg.includes('already') || msg.includes('registered')))
        if (isDupPhone) { setDuplicateNotice({ field: 'phone', value: form.phone }); return }

        const isDupTpin = code === 'DUPLICATE_TPIN' ||
          (msg.includes('tpin') && (msg.includes('exist') || msg.includes('taken') || msg.includes('already') || msg.includes('registered')))
        if (isDupTpin) { setDuplicateNotice({ field: 'tpin', value: form.tpin }); return }

        setError(data.message || 'Registration failed. Please try again.')
        return
      }
      if (data.ok) {
        setPending({ email: data.email, name: form.firstName })
      }
    } catch (_) {
      setLoading(false)
      setError('Connection error. Please check your connection and try again.')
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code from your email.'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res  = await fetch('/api/portal/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: pending.email, otp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setOtpError(data.message || 'Invalid code. Please try again.'); return }
      setOtpSuccess(true)
      setTimeout(() => navigate('/login', { state: { verified: true } }), 2000)
    } catch (_) {
      setOtpError('Connection error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true); setResentMsg(''); setOtpError('')
    try {
      await fetch('/api/portal/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: pending.email, verifyBaseUrl: window.location.origin }),
      })
      setResentMsg('New code sent — check your inbox.')
    } catch (_) {
      setResentMsg('Could not resend. Check your connection.')
    } finally {
      setResending(false)
      setTimeout(() => setResentMsg(''), 4000)
    }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-400',    w: '25%' }
    if (p.length < 8) return { label: 'Weak',      color: 'bg-orange-400', w: '50%' }
    if (!/[0-9]/.test(p) || !/[A-Z]/.test(p)) return { label: 'Fair', color: 'bg-amber-400', w: '75%' }
    return { label: 'Strong', color: 'bg-emerald-500', w: '100%' }
  })()

  // ── OTP verification screen ───────────────────────────────────────────────
  if (pending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
              <Package size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Online Express</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {otpSuccess ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h2>
                <p className="text-slate-500 text-sm">Your account is now active. Taking you to sign in…</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-100 rounded-2xl mb-4">
                    <ShieldCheck size={28} className="text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Check your email</h2>
                  <p className="text-slate-500 text-sm">We sent a 6-digit verification code to</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{pending.email}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-2 text-center uppercase tracking-wide">
                    Enter verification code
                  </label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                    placeholder="000000"
                    className="w-full border-2 border-slate-200 focus:border-violet-500 rounded-xl px-4 py-4 text-3xl font-mono font-bold text-center text-slate-900 tracking-[0.5em] focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>

                {otpError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <AlertCircle size={14} className="shrink-0" /> {otpError}
                  </div>
                )}
                {resentMsg && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <CheckCircle2 size={14} className="shrink-0" /> {resentMsg}
                  </div>
                )}

                <button onClick={handleVerifyOtp} disabled={otpLoading || otp.length !== 6}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors mb-4">
                  {otpLoading ? 'Verifying…' : 'Verify Email'}
                </button>

                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-400">Didn't receive a code?</p>
                  <button onClick={handleResend} disabled={resending}
                    className="flex items-center gap-1.5 mx-auto text-sm text-violet-600 hover:text-violet-800 font-semibold transition-colors disabled:opacity-50">
                    <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                  <p className="text-xs text-slate-400">You can also click the verification link in your email instead.</p>
                </div>

                <p className="text-center text-sm text-slate-400 mt-5 pt-5 border-t border-slate-100">
                  Already verified?{' '}
                  <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start shipping with Online Express today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Name ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">First Name {REQ}</label>
                <input type="text" required value={form.firstName} onChange={set('firstName')}
                  placeholder="Jane"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Surname {REQ}</label>
                <input type="text" required value={form.surname} onChange={set('surname')}
                  placeholder="Banda"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>

            {/* ── Title ────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
              <select value={form.pronouns} onChange={set('pronouns')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="">— Select Title —</option>
                <option>Mr</option><option>Mrs</option><option>Miss</option><option>Ms</option>
                <option>Dr</option><option>Prof</option><option>Rev</option><option>Other</option>
              </select>
            </div>

            {/* ── Contact ──────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address {REQ}</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone Number {REQ}</label>
              <input type="tel" required value={form.phone} onChange={set('phone')}
                placeholder="0971234567"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            {/* ── Personal & Compliance Details ─────────────────── */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Personal &amp; Compliance Details</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender {REQ}</label>
                  <select value={form.gender} onChange={set('gender')}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="">— Select Gender —</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Profession / Occupation {REQ}</label>
                  <input type="text" required value={form.occupation} onChange={set('occupation')}
                    placeholder="e.g. Business Owner"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              {/* TPIN */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  TPIN {REQ} <span className="font-normal text-slate-400">(Tax Payer Identification Number)</span>
                </label>
                <input type="text" required value={form.tpin} onChange={set('tpin')}
                  placeholder="Enter your ZRA TPIN"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <p className="text-xs text-slate-400 mt-1">
                  Required for customs clearance. Register at{' '}
                  <a href="https://www.zra.org.zm" target="_blank" rel="noreferrer" className="text-violet-600">zra.org.zm</a>{' '}
                  if you don&apos;t have one. Must be unique — one TPIN per account.
                </p>
              </div>
            </div>

            {/* ── Physical Address ──────────────────────────────── */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Physical Address</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Plot / House No. {REQ}</label>
                  <input type="text" required value={form.plotNo} onChange={set('plotNo')}
                    placeholder="e.g. Plot 14 or House 7"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Street Name {REQ}</label>
                  <input type="text" required value={form.street} onChange={set('street')}
                    placeholder="e.g. Cairo Road"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Area / Suburb / Compound {REQ}</label>
                <input type="text" required value={form.area} onChange={set('area')}
                  placeholder="e.g. Longacres, Kabulonga, Matero"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Town / City {REQ}</label>
                  <input type="text" required value={form.town} onChange={set('town')}
                    placeholder="e.g. Lusaka"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Province {REQ}</label>
                  <select required value={form.province} onChange={set('province')}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="">— Select Province —</option>
                    {ZAMBIA_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Password ──────────────────────────────────────── */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security</p>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password {REQ}</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="At least 6 characters"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.w }} />
                    </div>
                    <p className="text-xs text-slate-400">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password {REQ}</label>
                <div className="relative">
                  <input type={showCfm ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')}
                    placeholder="Repeat your password"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11" />
                  <button type="button" onClick={() => setShowCfm(!showCfm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {form.confirm && form.password === form.confirm && (
                    <CheckCircle2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>

            {/* ── Terms & Conditions ────────────────────────────── */}
            <div className="space-y-3">
              <TermsBox />
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${agreed ? 'bg-violet-600 border-violet-600' : 'border-slate-300 group-hover:border-violet-400'}`}>
                    {agreed && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-snug">
                  I have read and agree to the{' '}
                  <span className="font-semibold text-violet-700">Online Express Terms &amp; Conditions of Service</span>.
                  I understand that by creating an account I am legally bound by these terms.
                </span>
              </label>
            </div>

            {/* ── Notifications ─────────────────────────────────── */}
            {duplicateNotice && (
              <DuplicateAccountNotice
                field={duplicateNotice.field}
                value={duplicateNotice.value}
                onDismiss={() => setDuplicateNotice(null)}
              />
            )}

            {error && !duplicateNotice && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !agreed}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link to="/" className="hover:text-slate-300 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
