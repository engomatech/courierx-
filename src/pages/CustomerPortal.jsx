import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Package, LayoutDashboard, Calculator, Wallet, MapPin, User,
  LogOut, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../authStore'
import { useCustomerStore } from '../customerStore'
import { NotificationBell } from '../components/ui'
import { useNotifications, scopeForUser } from '../hooks/useNotifications'

const NAV = [
  { to: '/portal',                 end: true,  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/shipments',       end: false, icon: Package,         label: 'My Parcels' },
  { to: '/portal/rate-calculator', end: false, icon: Calculator,      label: 'Rate Calculator' },
  { to: '/portal/wallet',          end: false, icon: Wallet,          label: 'Wallet' },
  { to: '/portal/hubs',            end: false, icon: MapPin,          label: 'Hub Locations' },
  { to: '/portal/profile',         end: false, icon: User,            label: 'My Profile' },
]

export default function CustomerPortal({ children }) {
  const user                     = useAuthStore((s) => s.user)
  const logout                   = useAuthStore((s) => s.logout)
  const getWallet                = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion     = useCustomerStore((s) => s.getProfileCompletion)
  const navigate                 = useNavigate()
  const location                 = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Server-backed notifications — replaces the old client-only zustand bell.
  const {
    notifications, unread, connected, markRead, markAllRead,
  } = useNotifications(scopeForUser(user))

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
        className={`relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 flex-shrink-0
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/80 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft">
            <Package size={17} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-semibold text-[15px] tracking-tight block truncate">Online Express</span>
              <div className="text-[11px] text-slate-400 truncate">Customer portal</div>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-brand-600 text-white shadow-soft-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Wallet + completion */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-slate-800/80 space-y-3">
            <div className="bg-slate-800/80 rounded-xl p-3 shadow-soft-sm">
              <div className="text-[11px] text-slate-400 mb-0.5">Wallet balance</div>
              <div className="text-base font-bold text-emerald-400">{fmtBalance(wallet.balance)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Profile</span>
                <span className={completion.overall === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                  {completion.overall}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${completion.overall}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className={`px-2 py-3 border-t border-slate-800/80 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors
              ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors z-10 shadow-soft-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">{activeLabel}</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell
                notifications={notifications}
                unreadCount={unread}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                connected={connected}
              />
              {user && (
                <div className="hidden sm:flex items-center gap-2.5 pl-2">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{user.role}</div>
                  </div>
                  <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-soft-sm">
                    {user.initials}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Incomplete profile banner */}
        {isIncomplete && location.pathname !== '/portal/profile' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <span>Your profile is incomplete ({completion.overall}% done). Complete it to book shipments and use your wallet.</span>
            <NavLink
              to="/portal/profile"
              className="ml-auto flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-900 flex-shrink-0"
            >
              Complete now <ArrowRight size={13} />
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
