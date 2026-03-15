import { useState, useEffect } from 'react'
import { fetchTracking, statusColor, activityIcon } from '../services/trackingApi'
import { useAdminStore } from '../admin/adminStore'
import { Loader2, MapPin, AlertCircle, RefreshCw, Settings } from 'lucide-react'

/**
 * TrackingTimeline
 * Fetches and displays a full tracking history for a given AWB.
 * Reads the first Active carrier from the admin store and passes
 * its credentials to fetchTracking so no hardcoding is needed.
 *
 * Props:
 *   awb     {string} — AWB / shipment number to track
 *   compact {bool}   — condensed view (for modals)
 */
export default function TrackingTimeline({ awb, compact = false }) {
  // Get the first Active carrier from admin store
  const activeCarrier = useAdminStore(
    s => s.settings.carriers.find(c => c.status === 'Active') || null
  )

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!awb) return
    load()
  }, [awb])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchTracking(awb, activeCarrier)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── No active carrier configured ── */
  if (!activeCarrier) return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <Settings className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800">Carrier not configured</p>
        <p className="text-xs text-amber-600 mt-1">
          Go to <strong>Admin → Settings → Third Party Carriers</strong> and set DPEX credentials to enable live tracking.
        </p>
      </div>
    </div>
  )

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Fetching tracking info…</span>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700">Could not load tracking</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
        <button onClick={load}
          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    </div>
  )

  /* ── No data yet ── */
  if (!data) return (
    <div className="text-center py-6 text-slate-400 text-sm">
      No tracking data available yet.
    </div>
  )

  /* ── Success ── */
  return (
    <div className="space-y-4">

      {/* Current status banner */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Current location:</span>
          <span className="text-sm font-semibold text-slate-800">
            {data.currentLocation || '—'}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(data.currentStatus)}`}>
          {data.currentStatus}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {data.events.map((evt, idx) => {
          const isFirst = idx === 0
          const isLast  = idx === data.events.length - 1

          return (
            <div key={idx} className="flex gap-3">

              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0
                  ${isFirst
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                  {activityIcon(evt.activity)}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 ${isFirst ? 'bg-violet-300' : 'bg-slate-200'}`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-5 flex-1 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`text-sm font-semibold ${isFirst ? 'text-violet-700' : 'text-slate-800'}`}>
                      {evt.activity}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{evt.details}</p>
                    {evt.city && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {evt.city}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{evt.date}</p>
                    <p className="text-xs text-slate-400">{evt.time}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusColor(evt.status)}`}>
                      {evt.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
