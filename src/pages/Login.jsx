import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle, RefreshCw, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../authStore'

const API = import.meta.env.VITE_API_URL || '/api'

export default function Login() {
  const login                = useAuthStore((s) => s.login)
  const verifyEmailByEmail   = useAuthStore((s) => s.verifyEmailByEmail)
  const navigate             = useNavigate()
  const location             = useLocation()

  const [email,        setEmail]       = useState('')
  const [password,     setPassword]    = useState('')
  const [showPwd,      setShowPwd]     = useState(false)
  const [error,        setError]       = useState('')
  const [loading,      setLoading]     = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  // OTP state
  const [otp,         setOtp]         = useState('')
  const [otpLoading,  setOtpLoading]  = useState(false)
  const [otpError,    setOtpError]    = useState('')
  const [resending,   setResending]   = useState(false)
  const [resentMsg,   setResentMsg]   = useState('')

  const verifiedJustNow = location.state?.verified

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPendingEmail('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = await login(email, password)
    if (result.error === 'PENDING_VERIFICATION') {
      // Check if user verified on a different device — if so, activate locally and let them in
      try {
        const res = await fetch(`${API}/auth/check-email-verified`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ email: result.email }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.verified) {
            verifyEmailByEmail(result.email)
            const result2 = await login(email, password)
            setLoading(false)
            if (result2.user) {
              navigate(result2.user.role === 'customer' ? '/portal' : '/ops', { replace: true })
              return
            }
          }
        }
      } catch (_) {}
      setLoading(false)
      setPendingEmail(result.email)
      return
    }
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate(result.user.role === 'customer' ? '/portal' : '/ops', { replace: true })
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code from your email.'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res  = await fetch(`${API}/portal/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: pendingEmail, otp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setOtpError(data.message || 'Invalid code. Please try again.'); return }
      // Mark verified in local store, then log in
      verifyEmailByEmail(pendingEmail)
      const result2 = await login(email, password)
      setOtpLoading(false)
      if (result2?.user) {
        navigate(result2.user.role === 'customer' ? '/portal' : '/ops', { replace: true })
      } else {
        setPendingEmail('')
        setError('Verified! Please sign in.')
      }
    } catch (_) {
      setOtpError('Connection error. Please try again.')
      setOtpLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true); setResentMsg(''); setOtpError('')
    try {
      await fetch(`${API}/portal/resend-verification`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: pendingEmail, verifyBaseUrl: window.location.origin }),
      })
      setResentMsg('New code sent — check your inbox.')
    } catch (_) {
      setResentMsg('Could not resend. Check your connection.')
    } finally {
      setResending(false)
      setTimeout(() => setResentMsg(''), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to Online Express</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ── Verified-just-now banner ─────────────────────────────── */}
          {verifiedJustNow && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm mb-5">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              Email verified! Sign in to access your account.
            </div>
          )}

          {/* ── OTP entry panel (replaces form when pending) ─────────── */}
          {pendingEmail ? (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-100 rounded-2xl mb-3">
                  <ShieldCheck size={26} className="text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Verify your email</h2>
                <p className="text-slate-500 text-sm">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{pendingEmail}</p>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
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

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.length !== 6}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors mb-4"
              >
                {otpLoading ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <div className="text-center space-y-2">
                <p className="text-xs text-slate-400">Didn't receive a code?</p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 mx-auto text-sm text-violet-600 hover:text-violet-800 font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  You can also click the verification link in your email.
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setPendingEmail(''); setOtp(''); setOtpError('') }}
                className="w-full mt-5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email Address or Customer ID
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or CX000003"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                >
                  <KeyRound size={11} /> Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          )}

        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          New customer?{' '}
          <Link to="/register" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
            Create an account
          </Link>
        </p>
        <p className="text-center text-slate-500 text-sm mt-2">
          <Link to="/" className="hover:text-slate-300 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
