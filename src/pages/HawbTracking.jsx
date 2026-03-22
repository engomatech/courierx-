/**
 * Public HAWB Tracking Page — /track/:ref
 *
 * No login required. Accepts any tracking reference (AWB, HAWB, or MAWB)
 * in the URL path and displays the full journey timeline.
 * Calls GET /api/v1/track/:ref — our own PMS tracking API, no auth needed.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Package, MapPin, Search, Loader2, AlertCircle, ArrowLeft,
  CheckCircle2, Truck, Clock, RefreshCw, Hash, Globe,
  CreditCard, ArrowRight,
} from 'lucide-react'

const STATUS_COLORS = {
  'Booked'           : 'bg-sky-100 text-sky-700',
  'Picked Up'        : 'bg-amber-100 text-amber-700',
  'In Transit'       : 'bg-blue-100 text-blue-700',
  'In Hub'           : 'bg-indigo-100 text-indigo-700',
  'Out for Delivery' : 'bg-orange-100 text-orange-700',
  'Delivered'        : 'bg-emerald-100 text-emerald-700',
  'Delivery Failed'  : 'bg-red-100 text-red-700',
  'NDR'              : 'bg-rose-100 text-rose-700',
  'Return'           : 'bg-purple-100 text-purple-700',
  'Cancelled'        : 'bg-slate-100 text-slate-500',
  'Awaiting Payment' : 'bg-yellow-100 text-yellow-700',
}

const STATUS_ICON = {
  'Booked'           : '📦',
  'Picked Up'        : '🚚',
  'In Transit'       : '✈️',
  'In Hub'           : '🏭',
  'Out for Delivery' : '🛵',
  'Delivered'        : '✅',
  'Delivery Failed'  : '❌',
  'NDR'              : '⚠️',
  'Return'           : '↩️',
  'Cancelled'        : '🚫',
  'Awaiting Payment' : '💳',
}

function statusIcon(status) {
  return STATUS_ICON[status] || '📍'
}

function statusColor(status) {
  return STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'
}

export default function HawbTracking() {
  const { ref: paramRef } = useParams()
  const navigate          = useNavigate()

  const [input,   setInput]   = useState(paramRef || '')
  const [ref,     setRef]     = useState(paramRef || null)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Auto-fetch on mount or when URL param changes
  useEffect(() => {
    if (paramRef) {
      setInput(paramRef)
      setRef(paramRef)
    }
  }, [paramRef])

  useEffect(() => {
    if (!ref) return
    setLoading(true)
    setError(null)
    setData(null)

    fetch(`/api/v1/track/${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.message || 'Not found')
        setData(json)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ref])

  function handleTrack(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    // Update URL + trigger fetch
    navigate(`/track/${encodeURIComponent(trimmed)}`, { replace: true })
    setRef(trimmed)
  }

  // events in reverse-chronological order for display (most recent first)
  const events = data ? [...(data.value || [])].reverse() : []

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
        <Link to="/login" className="text-sm text-violet-300 hover:text-white transition-colors">
          Sign in →
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-12 pb-16">
        <div className="w-full max-w-2xl space-y-8">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white mb-3">Track Your Shipment</h1>
            <p className="text-slate-400 text-lg">
              Enter your AWB, HAWB, or MAWB to get real-time delivery updates.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleTrack}
            className="flex gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. OEX-2026-00001 or HAWB1234567"
              className="flex-1 bg-transparent text-white placeholder-slate-400 px-4 py-3 text-sm outline-none"
            />
            <button type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
              Track
            </button>
          </form>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Fetching tracking info…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-900/40 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 font-semibold">Shipment Not Found</p>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

              {/* Header — current status */}
              <div className="bg-slate-900 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    {/* Reference numbers */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-violet-700/60 text-violet-200 font-mono px-2 py-0.5 rounded">
                        HAWB: {data.hawb}
                      </span>
                      {data.mawb && (
                        <span className="bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded">
                          MAWB: {data.mawb}
                        </span>
                      )}
                      <span className="bg-slate-700 text-slate-400 font-mono px-2 py-0.5 rounded">
                        {data['AWB NO']}
                      </span>
                    </div>
                    {/* Status + location */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl">{statusIcon(data['Current Status'])}</span>
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">
                          {data['Current Status']}
                        </p>
                        {data.current_location && (
                          <p className="text-slate-400 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {data.current_location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setRef(r => r + ' '); setTimeout(() => setRef(ref), 10) }}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Shipment summary */}
              <div className="border-b border-slate-100 px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm bg-slate-50">
                {/* From */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">From</p>
                  <p className="font-semibold text-slate-800">{data.sender?.name}</p>
                  <p className="text-slate-500 text-xs">
                    {[data.sender?.city, data.sender?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                {/* To */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">To</p>
                  <p className="font-semibold text-slate-800">{data.receiver?.name}</p>
                  <p className="text-slate-500 text-xs">
                    {[data.receiver?.city, data.receiver?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                {/* Carrier */}
                {data.origin_carrier && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Carrier</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" />
                      {data.origin_carrier}
                    </p>
                  </div>
                )}
                {/* Delivery method */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Delivery</p>
                  <p className="font-medium text-slate-700 capitalize">
                    {data.delivery_method?.replace(/_/g, ' ')}
                  </p>
                </div>
                {/* Payment status — only if not paid */}
                {data.payment_status && data.payment_status !== 'paid' && data.payment_status !== 'credit_approved' && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <CreditCard className="w-4 h-4 text-yellow-600 shrink-0" />
                      <p className="text-yellow-700 text-xs font-medium">
                        {data.payment_status === 'quoted'
                          ? 'Payment required before dispatch — please pay your shipping fee to proceed.'
                          : 'Payment pending. Our team will contact you with payment details.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tracking timeline */}
              <div className="px-6 py-5">
                {events.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No tracking events recorded yet.
                  </div>
                ) : (
                  <div className="space-y-0">
                    {events.map((evt, idx) => {
                      const isFirst = idx === 0
                      const isLast  = idx === events.length - 1
                      return (
                        <div key={idx} className="flex gap-3">
                          {/* Dot + line */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                              ${isFirst
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                : 'bg-white border-2 border-slate-200 text-slate-400'
                              }`}
                            >
                              {statusIcon(evt.Status)}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 flex-1 my-1 min-h-[1.5rem] ${isFirst ? 'bg-violet-200' : 'bg-slate-100'}`} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${isFirst ? 'text-violet-700' : 'text-slate-800'}`}>
                                  {evt.Activites}
                                </p>
                                {evt.Details && (
                                  <p className="text-xs text-slate-500 mt-0.5">{evt.Details}</p>
                                )}
                                {evt.city && (
                                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {evt.city}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-slate-500">{evt.date}</p>
                                <p className="text-xs text-slate-400">{evt.time}</p>
                                {evt.Status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusColor(evt.Status)}`}>
                                    {evt.Status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Track another */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 text-center">
                <button
                  onClick={() => { setData(null); setRef(null); setInput(''); navigate('/track', { replace: true }) }}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Track another shipment
                </button>
              </div>
            </div>
          )}

          {/* Helper links (when no ref entered) */}
          {!ref && !loading && !error && (
            <div className="text-center text-slate-500 text-sm">
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
