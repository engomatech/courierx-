import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../authStore'

const DEMO_ACCOUNTS = [
  { role: 'Admin',      email: 'admin@courierx.com',   password: 'admin123', badge: 'bg-violet-100 text-violet-700' },
  { role: 'Operations', email: 'ops@courierx.com',     password: 'ops123',   badge: 'bg-blue-100 text-blue-700' },
  { role: 'Customer',   email: 'customer@example.com', password: 'cust123',  badge: 'bg-emerald-100 text-emerald-700' },
]

export default function Login() {
  const login    = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = login(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate(result.user.role === 'customer' ? '/portal' : '/ops', { replace: true })
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
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
          <p className="text-slate-400 text-sm mt-1">Sign in to CourierX</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Password
              </label>
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

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t">
            <p className="text-xs font-medium text-slate-500 mb-3">
              Demo accounts — click to fill credentials:
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border hover:bg-slate-50 text-left transition-colors"
                >
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${acc.badge}`}>
                    {acc.role}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-700 font-medium truncate">{acc.email}</div>
                    <div className="text-xs text-slate-400 font-mono">{acc.password}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
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
