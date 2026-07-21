import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || '/api'

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Something went wrong. Please try again.')
      }
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
          <p className="text-slate-400 text-sm mt-1">We'll email you a reset link</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Check your inbox</h2>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  If <span className="font-semibold text-slate-700">{email}</span> is registered with us, you'll receive a password reset link within a few minutes.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError('') }}
                  className="text-violet-600 font-semibold hover:text-violet-800 transition-colors"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            /* ── Request form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Enter the email address linked to your account and we'll send you a secure link to reset your password.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          <Link to="/login" className="flex items-center justify-center gap-1.5 hover:text-slate-200 transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
