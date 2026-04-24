import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle, CheckCircle2, Mail, RefreshCw, FileText } from 'lucide-react'
import { useAuthStore } from '../authStore'

// ── Terms & Conditions content ────────────────────────────────
const TERMS = [
  { n: '1', title: 'ACCEPTANCE OF TERMS', body: 'By registering or using Online Express services, you agree to be legally bound by these Terms & Conditions. Acceptance occurs upon account registration, shipment creation, or use of our services.' },
  { n: '2', title: 'DEFINITIONS', body: 'Shipment: Any parcel transported under one tracking number. Customer ID: Unique identifier assigned to each customer. Hub Address: Virtual address (UK, USA, China). Declared Value: Value declared for customs and insurance.' },
  { n: '3', title: 'SCOPE OF SERVICES', body: 'International e-commerce forwarding, consolidation, customs clearance support, last-mile delivery, and tracking services.' },
  { n: '4', title: 'CUSTOMER OBLIGATIONS', body: 'Provide accurate information, use your Customer ID, declare correct values, comply with all applicable laws, and pay all charges. Failure may result in delays, seizure, or suspension of your account.' },
  { n: '5', title: 'PROHIBITED ITEMS', body: 'Illegal goods, weapons, narcotics, counterfeit goods, and hazardous materials are strictly prohibited. Online Express reserves the right to refuse or dispose of any such items.' },
  { n: '6', title: 'PRICING & PAYMENTS', body: 'Charges are based on weight, destination, and service level selected. No parcel will be released without full payment of all applicable charges.' },
  { n: '7', title: 'CUSTOMS CLEARANCE', body: 'All shipments are subject to inspection by the relevant authorities. The customer is solely responsible for all applicable duties and taxes.' },
  { n: '8', title: 'DELIVERY TERMS', body: 'Delivery timelines are estimates only and may be affected by external factors including customs, weather, or carrier delays.' },
  { n: '9', title: 'UNDELIVERABLE SHIPMENTS', body: 'Shipments with an incorrect address or an unresponsive recipient may result in return to sender, storage charges, or disposal at our discretion.' },
  { n: '10', title: 'LIABILITY LIMITATION', body: 'Online Express is not liable for delays, customs actions, or damage resulting from improper packaging by the sender. Our liability is limited to the declared value of the shipment.' },
  { n: '11', title: 'INSURANCE', body: 'Customers are strongly encouraged to purchase additional insurance for high-value items. Basic coverage is included as defined in our pricing schedule.' },
  { n: '12', title: 'CLAIMS & DISPUTES', body: 'Claims for damage must be submitted within 48 hours of delivery. Claims for loss must be submitted within 7 days of the expected delivery date. Supporting documentation is required for all claims.' },
  { n: '13', title: 'STORAGE POLICY', body: 'A free storage period applies to all shipments. Storage charges apply thereafter. Uncollected shipments may be disposed of after the maximum storage period.' },
  { n: '14', title: 'TRACKING & NOTIFICATIONS', body: 'Tracking updates are provided via email, SMS, and WhatsApp. It is the customer\'s responsibility to ensure their contact details are accurate.' },
  { n: '15', title: 'DATA PROTECTION', body: 'Customer data is collected and used solely to provide our services and to comply with applicable legal requirements. We do not sell your personal data to third parties.' },
  { n: '16', title: 'SERVICE SUSPENSION', body: 'Accounts may be suspended or terminated for fraud, misdeclaration of goods, or non-payment of charges.' },
  { n: '17', title: 'FORCE MAJEURE', body: 'Online Express is not liable for any delays or failures caused by events beyond our reasonable control, including acts of God, strikes, or government actions.' },
  { n: '18', title: 'AMENDMENTS', body: 'These Terms may be updated at any time. Continued use of our services following any update constitutes your acceptance of the revised Terms.' },
  { n: '19', title: 'GOVERNING LAW', body: 'These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of Zambia.' },
  { n: '20', title: 'CONTACT', body: 'Online Express Limited — For queries regarding these Terms, please contact us via the details listed on our website at https://www.onlineexpress.co.zm.' },
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

export default function Register() {
  const register            = useAuthStore((s) => s.register)
  const resendVerification  = useAuthStore((s) => s.resendVerification)

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPwd,    setShowPwd]    = useState(false)
  const [showCfm,    setShowCfm]    = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [agreed,     setAgreed]     = useState(false)

  // After successful registration
  const [pending,    setPending]    = useState(null)   // { email, token }
  const [resent,     setResent]     = useState(false)
  const [emailSent,  setEmailSent]  = useState(false)  // true = SMTP succeeded

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!agreed) { setError('You must read and accept the Terms & Conditions to register.'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    if (result.pendingVerification) {
      const newPending = { email: result.email, token: result.token, name: form.name }
      setPending(newPending)
      // Try sending the real verification email via API
      sendVerificationViaApi(form.name, result.email, result.token)
    }
  }

  const sendVerificationViaApi = async (name, email, token) => {
    try {
      const url = `${window.location.origin}/verify-email?token=${token}`
      const res = await fetch('/api/auth/send-verification', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ name, email, verifyUrl: url }),
      })
      if (res.ok) setEmailSent(true)
    } catch (_) {
      // SMTP not configured — dev mode link stays visible
    }
  }

  const handleResend = async () => {
    const result = resendVerification(pending.email)
    if (result.token) {
      setPending((p) => ({ ...p, token: result.token }))
      setResent(true)
      setEmailSent(false)
      setTimeout(() => setResent(false), 3000)
      sendVerificationViaApi(pending.name || pending.email, pending.email, result.token)
    }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-400', w: '25%' }
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-400', w: '50%' }
    if (!/[0-9]/.test(p) || !/[A-Z]/.test(p)) return { label: 'Fair', color: 'bg-amber-400', w: '75%' }
    return { label: 'Strong', color: 'bg-emerald-500', w: '100%' }
  })()

  const verifyUrl = pending ? `${window.location.origin}/verify-email?token=${pending.token}` : ''

  // ── Pending verification screen ──────────────────────────────────────────
  if (pending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-2xl mb-5">
              <Mail size={32} className="text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verify your email address</h2>
            <p className="text-slate-500 text-sm mb-6">
              We've sent a verification link to{' '}
              <span className="font-semibold text-slate-700">{pending.email}</span>.
              Click the link in that email to activate your account.
            </p>

            {emailSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Verification email sent
                </p>
                <p className="text-xs text-emerald-600">
                  Check your inbox at <span className="font-semibold">{pending.email}</span> and click the link to activate your account.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  Development mode — email not sent
                </p>
                <p className="text-xs text-amber-600 mb-2">Use this link to verify your account:</p>
                <a href={verifyUrl} className="text-xs text-violet-700 font-medium break-all hover:underline">
                  {verifyUrl}
                </a>
              </div>
            )}

            <button
              onClick={handleResend}
              className="flex items-center gap-2 mx-auto text-sm text-slate-500 hover:text-violet-600 transition-colors"
            >
              <RefreshCw size={14} className={resent ? 'animate-spin' : ''} />
              {resent ? 'New link generated above ✓' : 'Resend verification email'}
            </button>

            <p className="text-center text-sm text-slate-400 mt-6">
              Already verified?{' '}
              <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700">Sign in</Link>
            </p>
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

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
              <input
                type="text" required value={form.name} onChange={set('name')}
                placeholder="Jane Banda"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address</label>
              <input
                type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone Number</label>
              <input
                type="tel" value={form.phone} onChange={set('phone')}
                placeholder="0971234567"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="At least 6 characters"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11"
                />
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showCfm ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')}
                  placeholder="Repeat your password"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11"
                />
                <button type="button" onClick={() => setShowCfm(!showCfm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirm && form.password === form.confirm && (
                  <CheckCircle2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <TermsBox />
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${agreed ? 'bg-violet-600 border-violet-600' : 'border-slate-300 group-hover:border-violet-400'}`}>
                    {agreed && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-snug">
                  I have read and agree to the <span className="font-semibold text-violet-700">Online Express Terms & Conditions of Service</span>. I understand that by creating an account I am legally bound by these terms.
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !agreed}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
            >
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
