import { useState, useEffect } from 'react'
import { Search, Package, ArrowRight, Loader2 } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import TrackingTimeline from '../components/TrackingTimeline'

/**
 * Public Shipment Tracking Page — /track
 * No login required. Anyone can enter an AWB / HAWB / MAWB.
 *
 * Strategy:
 *  1. Try our internal OEX API (/api/v1/track/:ref) — partner API shipments
 *  2. If found → redirect to /track/:ref (HawbTracking page)
 *  3. If not found (404) → fall back to DPEX carrier TrackingTimeline
 */
export default function TrackShipment() {
  const [searchParams]     = useSearchParams()
  const navigate           = useNavigate()
  const [input,  setInput] = useState(searchParams.get('awb') || '')
  const [awb,    setAwb]   = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const param = searchParams.get('awb')
    if (param) { setInput(param); resolve(param) }
  }, [searchParams])

  async function resolve(ref) {
    const trimmed = (ref || input).trim()
    if (!trimmed) return
    setChecking(true)
    try {
      const res = await fetch(`/api/v1/track/${encodeURIComponent(trimmed)}`)
      if (res.ok) {
        // Found in OEX — redirect to the rich tracking page
        navigate(`/track/${encodeURIComponent(trimmed)}`, { replace: true })
        return
      }
    } catch {
      // Network error — fall through to DPEX
    } finally {
      setChecking(false)
    }
    // Not in OEX — use DPEX carrier tracking
    setAwb(trimmed)
  }

  function handleTrack(e) {
    e.preventDefault()
    setAwb(null)
    resolve(input.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col">

      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Online Express</span>
        </Link>
        <Link to="/login"
          className="text-sm text-violet-300 hover:text-white transition-colors">
          Sign in →
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-16 pb-12">
        <div className="w-full max-w-2xl">

          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-3">
              Track Your Shipment
            </h1>
            <p className="text-slate-400 text-lg">
              Enter your AWB number to get real-time delivery updates.
            </p>
          </div>

          {/* Search box */}
          <form onSubmit={handleTrack}
            className="flex gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter AWB, HAWB, or MAWB…"
              className="flex-1 bg-transparent text-white placeholder-slate-400 px-4 py-3 text-sm outline-none"
            />
            <button type="submit" disabled={checking}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shrink-0">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Track
            </button>
          </form>

          {/* DPEX fallback results */}
          {awb && (
            <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden">

              {/* AWB header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">AWB Number</p>
                  <p className="text-white font-bold text-lg mt-0.5">{awb}</p>
                </div>
                <button
                  onClick={() => { setAwb(null); setInput('') }}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  Track another <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Timeline (DPEX carrier) */}
              <div className="p-6">
                <TrackingTimeline awb={awb} />
              </div>

            </div>
          )}

          {/* Helper links */}
          {!awb && !checking && (
            <div className="mt-8 text-center text-slate-500 text-sm">
              Have an account?{' '}
              <Link to="/portal/shipments" className="text-violet-400 hover:text-violet-300">
                View all your shipments →
              </Link>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-600 text-xs py-4">
        © {new Date().getFullYear()} Online Express · Powered by DPEX
      </footer>

    </div>
  )
}
