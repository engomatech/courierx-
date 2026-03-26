/**
 * Health Monitor — /admin/health
 * Polls /api/health every 30 s, shows live status of all subsystems,
 * keeps a 20-entry rolling history, and displays auto-repair instructions
 * when something is degraded.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity,
  Database, Mail, HardDrive, MemoryStick, Server, Clock,
  Zap, AlertOctagon, FolderOpen, ChevronDown, ChevronUp,
} from 'lucide-react'

const POLL_INTERVAL = 30_000   // 30 seconds

// ── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s) {
  if (s === 'ok')       return 'text-emerald-600'
  if (s === 'warn')     return 'text-amber-500'
  if (s === 'degraded' || s === 'error') return 'text-red-500'
  return 'text-slate-400'
}

function statusBg(s) {
  if (s === 'ok')       return 'bg-emerald-50 border-emerald-200'
  if (s === 'warn')     return 'bg-amber-50 border-amber-200'
  if (s === 'degraded' || s === 'error') return 'bg-red-50 border-red-200'
  return 'bg-slate-50 border-slate-200'
}

function StatusIcon({ status, size = 18 }) {
  if (status === 'ok')      return <CheckCircle2 size={size} className="text-emerald-500" />
  if (status === 'warn')    return <AlertTriangle size={size} className="text-amber-500" />
  if (status === 'error' || status === 'degraded') return <XCircle size={size} className="text-red-500" />
  return <RefreshCw size={size} className="text-slate-400 animate-spin" />
}

function StatusPulse({ status }) {
  const color = status === 'ok' ? 'bg-emerald-400' : status === 'warn' ? 'bg-amber-400' : status === 'degraded' || status === 'error' ? 'bg-red-400' : 'bg-slate-300'
  return (
    <span className="relative flex h-3 w-3">
      {(status === 'ok' || status === 'warn') && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  )
}

const CHECK_META = {
  database : { label: 'Database',         icon: Database    },
  smtp     : { label: 'SMTP / Email',      icon: Mail        },
  memory   : { label: 'Memory',            icon: MemoryStick },
  disk     : { label: 'Disk Space',        icon: HardDrive   },
  uploads  : { label: 'Upload Storage',    icon: FolderOpen  },
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HealthMonitor() {
  const [health,      setHealth]      = useState(null)
  const [history,     setHistory]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [nextIn,      setNextIn]      = useState(POLL_INTERVAL / 1000)
  const [showHistory, setShowHistory] = useState(false)
  const timerRef  = useRef(null)
  const countRef  = useRef(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/health', { cache: 'no-store' })
      const data = await res.json()
      setHealth(data)
      setHistory((prev) => [
        { ...data, fetchedAt: new Date().toISOString() },
        ...prev.slice(0, 19),
      ])
    } catch (e) {
      const errData = {
        status: 'degraded', service: 'Online Express API',
        timestamp: new Date().toISOString(),
        checks: { api: { status: 'error', message: 'Cannot reach API — ' + e.message } },
      }
      setHealth(errData)
      setHistory((prev) => [{ ...errData, fetchedAt: new Date().toISOString() }, ...prev.slice(0, 19)])
      setError('API unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-poll
  useEffect(() => {
    fetchHealth()

    timerRef.current  = setInterval(fetchHealth, POLL_INTERVAL)
    countRef.current  = setInterval(() => setNextIn((n) => Math.max(0, n - 1)), 1000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(countRef.current)
    }
  }, [fetchHealth])

  // Reset countdown after each fetch
  useEffect(() => { setNextIn(POLL_INTERVAL / 1000) }, [health])

  const handleRefresh = () => {
    clearInterval(timerRef.current)
    clearInterval(countRef.current)
    fetchHealth()
    timerRef.current = setInterval(fetchHealth, POLL_INTERVAL)
    countRef.current = setInterval(() => setNextIn((n) => Math.max(0, n - 1)), 1000)
    setNextIn(POLL_INTERVAL / 1000)
  }

  const overallStatus = health?.status || 'loading'
  const checks        = health?.checks || {}

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Overall status banner ── */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${statusBg(overallStatus)}`}>
        <StatusPulse status={overallStatus} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-slate-900">
              {overallStatus === 'ok'       ? 'All Systems Operational'  :
               overallStatus === 'warn'     ? 'Systems Degraded — Warning' :
               overallStatus === 'degraded' ? 'System Outage Detected'   :
               'Checking…'}
            </h2>
          </div>
          {health && (
            <p className="text-sm text-slate-500 mt-0.5">
              API uptime: <span className="font-medium text-slate-700">{health.uptimeFormatted}</span>
              &nbsp;·&nbsp; Response: <span className="font-medium text-slate-700">{health.responseMs}ms</span>
              &nbsp;·&nbsp; Checked: <span className="font-medium text-slate-700">{new Date(health.timestamp).toLocaleTimeString()}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking…' : `Refresh (${nextIn}s)`}
        </button>
      </div>

      {/* ── Check cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* API card (always shown) */}
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${error ? statusBg('error') : statusBg('ok')}`}>
          <div className="p-2 bg-white rounded-lg border shrink-0">
            <Server size={18} className={error ? 'text-red-500' : 'text-emerald-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">API Server</span>
              <StatusIcon status={error ? 'error' : 'ok'} size={14} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{error ? error : `v${health?.version || '…'} · port 3001`}</p>
          </div>
        </div>

        {/* Dynamic check cards */}
        {Object.entries(CHECK_META).map(([key, meta]) => {
          const check = checks[key]
          if (!check && !health) return null
          const st  = check?.status || 'loading'
          const Icon = meta.icon
          return (
            <div key={key} className={`rounded-xl border p-4 flex items-start gap-3 ${statusBg(st)}`}>
              <div className="p-2 bg-white rounded-lg border shrink-0">
                <Icon size={18} className={statusColor(st)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{meta.label}</span>
                  <StatusIcon status={st} size={14} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{check?.message || '—'}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Auto-repair guide (shown when degraded) ── */}
      {(overallStatus === 'degraded' || overallStatus === 'warn') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">Auto-Repair Steps</h3>
          </div>
          <p className="text-sm text-amber-700 mb-3">SSH into the server and run the repair commands for the affected checks:</p>
          <div className="space-y-2">
            {checks.database?.status === 'error' && (
              <div className="bg-white rounded-lg border border-amber-200 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">🗄 Database error</p>
                <code className="block text-xs font-mono text-slate-700 bg-slate-50 rounded p-2">
                  cd /var/www/courierx/api && pm2 restart 0
                </code>
              </div>
            )}
            {checks.smtp?.status === 'warn' && (
              <div className="bg-white rounded-lg border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">📧 SMTP not configured</p>
                <p className="text-xs text-slate-600">Go to Admin → Settings → SMTP Email and enter your Gmail App Password credentials.</p>
              </div>
            )}
            {checks.memory?.status === 'warn' && (
              <div className="bg-white rounded-lg border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">💾 High memory usage</p>
                <code className="block text-xs font-mono text-slate-700 bg-slate-50 rounded p-2">
                  pm2 restart 0
                </code>
              </div>
            )}
            {checks.disk?.status !== 'ok' && (
              <div className="bg-white rounded-lg border border-amber-200 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">💿 Disk space low</p>
                <code className="block text-xs font-mono text-slate-700 bg-slate-50 rounded p-2 whitespace-pre">{`# Check what's using space:
du -sh /var/www/courierx/*
# Clear PM2 logs:
pm2 flush
# Clear old node_modules (then reinstall):
cd /var/www/courierx && rm -rf node_modules && npm install`}</code>
              </div>
            )}
            {checks.uploads?.status === 'warn' && (
              <div className="bg-white rounded-lg border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">📁 Upload directory missing</p>
                <code className="block text-xs font-mono text-slate-700 bg-slate-50 rounded p-2">
                  mkdir -p /var/www/courierx/api/uploads/kyc && pm2 restart 0
                </code>
              </div>
            )}
            {error && (
              <div className="bg-white rounded-lg border border-red-200 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">🔴 API not responding</p>
                <code className="block text-xs font-mono text-slate-700 bg-slate-50 rounded p-2 whitespace-pre">{`# Check PM2 status:
pm2 status
# Restart API:
pm2 restart 0
# If that fails, check logs:
pm2 logs 0 --lines 50
# Full rebuild:
cd /var/www/courierx && git pull && npm run build && pm2 restart 0`}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Auto-repair cron setup ── */}
      <div className="bg-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={15} className="text-sky-400" />
          <h3 className="font-semibold text-sm">Auto-Repair Cron (one-time server setup)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">Run this once on the VPS to install the watchdog script. It checks every 5 minutes and restarts PM2 automatically if the API goes down.</p>
        <code className="block text-xs font-mono text-green-300 bg-slate-800 rounded-lg p-3 whitespace-pre leading-relaxed">{`# 1. Create the watchdog script:
cat > /var/www/courierx/scripts/watchdog.sh << 'EOF'
#!/bin/bash
LOG=/var/log/courierx-watchdog.log
URL=http://localhost:3001/api/health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $URL)
if [ "$STATUS" != "200" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') API DOWN ($STATUS) — restarting PM2" >> $LOG
  pm2 restart 0
  sleep 10
  STATUS2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $URL)
  if [ "$STATUS2" != "200" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') STILL DOWN after restart — rebuilding" >> $LOG
    cd /var/www/courierx && npm run build && pm2 restart 0
  fi
  echo "$(date '+%Y-%m-%d %H:%M:%S') Repair complete. Status: $STATUS2" >> $LOG
fi
EOF

# 2. Make it executable:
chmod +x /var/www/courierx/scripts/watchdog.sh

# 3. Add to crontab (runs every 5 minutes):
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/courierx/scripts/watchdog.sh") | crontab -

# 4. Verify it's installed:
crontab -l`}</code>
      </div>

      {/* ── Check history ── */}
      <div className="bg-white rounded-xl border">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 rounded-xl"
        >
          <Clock size={15} className="text-slate-400" />
          <span className="font-medium text-slate-700 text-sm flex-1">Check History ({history.length})</span>
          {showHistory ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>
        {showHistory && (
          <div className="border-t divide-y max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No history yet.</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <StatusIcon status={h.status} size={14} />
                  <span className={`text-xs font-semibold w-20 ${statusColor(h.status)}`}>
                    {h.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 flex-1">
                    {h.responseMs != null ? `${h.responseMs}ms` : '—'}
                    {h.uptimeFormatted ? ` · up ${h.uptimeFormatted}` : ''}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(h.fetchedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
