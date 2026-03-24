import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../authStore'

export default function Register() {
  const register            = useAuthStore((s) => s.register)
  const resendVerification  = useAuthStore((s) => s.resendVerification)

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPwd,    setShowPwd]    = useState(false)
  const [showCfm,    setShowCfm]    = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

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

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
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
