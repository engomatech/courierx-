import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Package, LayoutDashboard, Calculator, Wallet, MapPin, User,
  LogOut, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight,
  Bell, CheckCheck, Truck, BadgeCheck, Building2, X,
  Navigation, PackageCheck, PackageX,
} from 'lucide-react'
import { useAuthStore } from '../authStore'
import { useCustomerStore } from '../customerStore'
import { useStore } from '../store'

const NAV = [
  { to: '/portal',                 end: true,  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/shipments',       end: false, icon: Package,         label: 'Shipments' },
  { to: '/portal/rate-calculator', end: false, icon: Calculator,      label: 'Rate Calculator' },
  { to: '/portal/wallet',          end: false, icon: Wallet,          label: 'Wallet' },
  { to: '/portal/hubs',            end: false, icon: MapPin,          label: 'Hub Locations' },
  { to: '/portal/profile',         end: false, icon: User,            label: 'My Profile' },
]

// ── Notification type icons & colours ────────────────────────────────────────
const NOTIF_STYLES = {
  confirmed:      { icon: BadgeCheck,       color: 'text-violet-600 bg-violet-100' },
  collected:      { icon: Truck,            color: 'text-orange-600 bg-orange-100' },
  in_transit:     { icon: Package,          color: 'text-blue-600 bg-blue-100'     },
  hub_arrived:    { icon: Building2,        color: 'text-cyan-600 bg-cyan-100'     },
  out_for_delivery: { icon: Navigation,        color: 'text-emerald-600 bg-emerald-100' },
  delivered:      { icon: PackageCheck,     color: 'text-emerald-700 bg-emerald-100' },
  ndr:            { icon: PackageX,         color: 'text-red-600 bg-red-100'       },
}

function fmtTimeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CustomerPortal({ children }) {
  const user                     = useAuthStore((s) => s.user)
  const logout                   = useAuthStore((s) => s.logout)
  const getWallet                = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion     = useCustomerStore((s) => s.getProfileCompletion)
  const notifications            = useStore((s) => s.notifications)
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead)
  const markNotificationRead     = useStore((s) => s.markNotificationRead)
  const navigate                 = useNavigate()
  const location                 = useLocation()
  const [collapsed,   setCollapsed]   = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const bellRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const unreadCount = notifications.filter((n) => !n.read).length

  const wallet     = getWallet(user?.id)
  const completion = getProfileCompletion(user?.id)
  const isIncomplete = completion.overall < 100

  const handleLogout = () => { logout(); navigate('/') }

  const fmtBalance = (n) =>
    `ZK ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const barColor =
    completion.overall < 40  ? 'bg-red-500'     :
    completion.overall < 75  ? 'bg-amber-500'   : 'bg-emerald-500'

  const activeLabel = NAV.find((n) =>
    n.end
      ? location.pathname === n.to
      : location.pathname.startsWith(n.to)
  )?.label || 'Customer Portal'

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300 flex-shrink-0
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package size={17} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm leading-tight">Online Express</div>
              <div className="text-xs text-slate-400 leading-tight">Customer Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Wallet + completion */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-700 space-y-3">
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Wallet Balance</div>
              <div className="text-base font-bold text-emerald-400">{fmtBalance(wallet.balance)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Profile</span>
                <span className={completion.overall === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                  {completion.overall}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${completion.overall}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className={`px-2 py-3 border-t border-slate-700 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors
              ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={17} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{activeLabel}</p>
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => { setNotifOpen((v) => !v) }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell size={18} className="text-slate-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
                      <span className="font-semibold text-sm text-slate-800">Notifications</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllNotificationsRead()}
                            className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                          >
                            <CheckCheck size={12} /> Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">No notifications yet</p>
                        </div>
                      ) : notifications.slice(0, 20).map((n) => {
                        const style = NOTIF_STYLES[n.type] || { icon: Bell, color: 'text-slate-600 bg-slate-100' }
                        const Icon  = style.icon
                        return (
                          <button
                            key={n.id}
                            onClick={() => { markNotificationRead(n.id) }}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.color}`}>
                              <Icon size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                                <span className="text-[10px] text-slate-400 shrink-0">{fmtTimeAgo(n.timestamp)}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                              {!n.read && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.initials}
              </div>
              <div className="text-sm leading-tight hidden sm:block">
                <div className="font-medium text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Incomplete profile banner */}
        {isIncomplete && location.pathname !== '/portal/profile' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <span>Your profile is incomplete ({completion.overall}% done). Complete it to book shipments &amp; use your wallet.</span>
            <NavLink
              to="/portal/profile"
              className="ml-auto flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-900 flex-shrink-0"
            >
              Complete Now <ArrowRight size={13} />
            </NavLink>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
