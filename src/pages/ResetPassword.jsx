import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../authStore'

const API = import.meta.env.VITE_API_URL || '/api'

export default function ResetPassword() {
  const [params]        = useSearchParams()
  const navigate        = useNavigate()
  const resetPassword   = useAuthStore((s) => s.resetPassword)

  const token = params.get('token') || ''

  // Token validation state (on mount)
  const [validating,  setValidating]  = useState(true)
  const [tokenEmail,  setTokenEmail]  = useState('')   // email tied to this token
  const [tokenError,  setTokenError]  = useState('')

  // Form state
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [showCon,     setShowCon]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [done,        setDone]        = useState(false)

  // ── Validate token on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token found. Please request a new password reset link.')
      setValidating(false)
      return
    }
    fetch(`${API}/auth/validate-reset-token`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setTokenError(
            data.error === 'TOKEN_EXPIRED'
              ? 'This reset link has expired. Please request a new one — links are valid for 1 hour.'
              : 'This reset link is invalid or has already been used. Please request a new one.'
          )
        } else {
          setTokenEmail(data.email)
        }
      })
      .catch(() => setTokenError('Could not verify the reset link. Please check your connection and try again.'))
      .finally(() => setValidating(false))
  }, [token])

  // ── Handle form submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (password.length < 6) return setFormError('Password must be at least 6 characters.')
    if (password !== confirm)  return setFormError('Passwords do not match.')

    setSubmitting(true)
    try {
      // Consume the token on the server
      const res = await fetch(`${API}/auth/reset-password`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data.error === 'TOKEN_EXPIRED')  return setFormError('This link has expired. Please request a new reset link.')
        if (data.error === 'TOKEN_NOT_FOUND') return setFormError('This link has already been used. Please request a new reset link.')
        throw new Error(data.message || 'Something went wrong.')
      }

      const email = data.email || tokenEmail
      // Update server-side portal_users password hash (for server-registered customers)
      fetch(`${API}/portal/update-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, newPassword: password }),
      }).catch(() => {})
      // Also update local authStore for any legacy local customer
      const result = resetPassword(email, password)
      if (result.error) {
        console.warn('[reset-password] authStore miss:', result.error)
      }

      setDone(true)
      // Redirect to login after 2.5 s
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set a new password</h1>
          <p className="text-slate-400 text-sm mt-1">Online Express</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ── Loading ── */}
          {validating && (
            <div className="flex flex-col items-center gap-3 py-6 text-slate-500 text-sm">
              <Loader2 size={24} className="animate-spin text-violet-500" />
              Verifying your reset link…
            </div>
          )}

          {/* ── Token error ── */}
          {!validating && tokenError && (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 mb-1">Link is no longer valid</h2>
                <p className="text-sm text-slate-500 leading-relaxed">{tokenError}</p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-block bg-violet-600 hover:bg-violet-700 text-white py-2.5 px-6 rounded-xl font-semibold text-sm transition-colors"
              >
                Request a New Link
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {!validating && !tokenError && done && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Password updated!</h2>
                <p className="text-slate-500 text-sm mt-2">
                  Your password has been changed. Redirecting you to sign in…
                </p>
              </div>
            </div>
          )}

          {/* ── Password form ── */}
          {!validating && !tokenError && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tokenEmail && (
                <p className="text-sm text-slate-500">
                  Setting a new password for <span className="font-semibold text-slate-700">{tokenEmail}</span>
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
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

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showCon ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCon(!showCon)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCon ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= (i + 1) * 2
                          ? password.length >= 8 ? 'bg-emerald-400' : 'bg-amber-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">
                    {password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair' : 'Good'}
                  </span>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          <Link to="/login" className="hover:text-slate-200 transition-colors">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
