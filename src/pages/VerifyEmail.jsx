import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Package, BadgeCheck, Copy } from 'lucide-react'
import { useAuthStore } from '../authStore'

export default function VerifyEmail() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const verifyEmail     = useAuthStore((s) => s.verifyEmail)
  const user            = useAuthStore((s) => s.user)

  const [status,    setStatus]    = useState('loading') // loading | success | error
  const [message,   setMessage]   = useState('')
  const [copied,    setCopied]    = useState(false)

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please use the link from your email.')
      return
    }

    // Small delay so the loading spinner is visible briefly
    const timer = setTimeout(() => {
      const result = verifyEmail(token)
      if (result.error) {
        setStatus('error')
        setMessage(result.error)
      } else {
        setStatus('success')
        // Redirect to profile after 4 seconds (slightly longer so user can read the CX ID)
        setTimeout(() => navigate('/portal/profile', { replace: true }), 4000)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Online Express</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-2xl mb-5">
                <Loader2 size={32} className="text-violet-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying your email…</h2>
              <p className="text-slate-500 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Email verified!</h2>
              <p className="text-slate-500 text-sm mb-5">
                Welcome to Online Express, <span className="font-semibold text-slate-700">{user?.name}</span>!<br />
                Your account is now active.
              </p>

              {/* Customer ID highlight */}
              {user?.customerId && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeCheck size={15} className="text-violet-600" />
                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Your Customer ID</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-extrabold font-mono text-violet-900 tracking-widest">
                      {user.customerId}
                    </p>
                    <button
                      onClick={() => handleCopy(user.customerId)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0
                        ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                    >
                      <Copy size={11} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-violet-500 mt-1.5">
                    Save this — you can use it to log in instead of your email address.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-violet-600">
                <Loader2 size={14} className="animate-spin" />
                Taking you to your profile…
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-5">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h2>
              <p className="text-slate-500 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
