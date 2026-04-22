import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, X, BadgeCheck, Truck, Package, Building2, Navigation,
  PackageCheck, PackageX, CreditCard, ClipboardList, Inbox,
} from 'lucide-react'

/**
 * NotificationBell — the bell icon + unread badge + dropdown used across
 * every authenticated shell (ops, admin, portal).
 *
 * Fully controlled: caller supplies notifications data + mark-read handlers.
 * Data shape (from useNotifications hook):
 *   { id, type, title, message, awb, read, created_at }
 *
 * The dropdown closes on outside click, Esc, and item click. Items link to
 * the AWB detail view by default; override with onItemClick.
 */

const TYPE_STYLES = {
  parcel_created : { icon: Package,      colour: 'text-brand-600 bg-brand-100'    },
  confirmed      : { icon: BadgeCheck,   colour: 'text-brand-600 bg-brand-100'    },
  status_change  : { icon: Truck,        colour: 'text-orange-600 bg-orange-100'  },
  assignment     : { icon: ClipboardList,colour: 'text-indigo-600 bg-indigo-100'  },
  collected      : { icon: Truck,        colour: 'text-orange-600 bg-orange-100'  },
  in_transit     : { icon: Package,      colour: 'text-blue-600 bg-blue-100'      },
  hub_arrived    : { icon: Building2,    colour: 'text-cyan-600 bg-cyan-100'      },
  out_for_delivery:{ icon: Navigation,   colour: 'text-emerald-600 bg-emerald-100'},
  delivered      : { icon: PackageCheck, colour: 'text-emerald-700 bg-emerald-100'},
  ndr            : { icon: PackageX,     colour: 'text-red-600 bg-red-100'        },
  payment        : { icon: CreditCard,   colour: 'text-emerald-700 bg-emerald-100'},
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 0) return 'just now'
  const s = Math.floor(diff / 1000)
  if (s < 30)   return 'just now'
  if (s < 60)   return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)    return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function NotificationBell({
  notifications = [],
  unreadCount   = 0,
  onMarkRead,
  onMarkAllRead,
  onItemClick,   // (notification) => void — override default behaviour
  connected     = true,
  iconColour    = 'text-slate-500',
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Esc
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleItemClick = (n) => {
    if (!n.read && onMarkRead) onMarkRead(n.id)
    if (onItemClick) {
      onItemClick(n)
    } else if (n.awb) {
      navigate(`/track/${n.awb}`)
    }
    setOpen(false)
  }

  const recent = notifications.slice(0, 20)

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors ${iconColour}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* subtle dot when disconnected so we don't silently lie about realtime */}
        {!connected && (
          <span
            title="Reconnecting\u2026"
            className="absolute bottom-1 right-1 w-2 h-2 bg-slate-300 rounded-full"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[22rem] max-w-[95vw] bg-white rounded-2xl shadow-soft-xl border border-slate-200/80 z-50 overflow-hidden animate-fade-in"
        >
          <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-slate-800">Notifications</p>
              <p className="text-xs text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : notifications.length === 0 ? 'You\u2019re all caught up' : 'All read'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brand-50"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Inbox size={18} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  You\u2019ll see updates here when parcels move through the pipeline.
                </p>
              </div>
            ) : (
              recent.map((n) => {
                const style = TYPE_STYLES[n.type] || { icon: Bell, colour: 'text-slate-600 bg-slate-100' }
                const Icon  = style.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${!n.read ? 'bg-brand-50/30' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.colour}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.message && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      )}
                      {n.awb && (
                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                          {n.awb}
                        </p>
                      )}
                    </div>
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
