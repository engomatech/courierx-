import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Package, LayoutDashboard, MapPin, User, Settings,
  LogOut, ChevronLeft, ChevronRight, Bell,
} from 'lucide-react'
import { useAuthStore } from '../authStore'
import { NotificationBell } from '../components/ui'
import { useNotifications, scopeForUser } from '../hooks/useNotifications'
import ProfileCompletionWizard from '../components/ProfileCompletionWizard'

const NAV = [
  { to: '/portal',           end: true,  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/shipments', end: false, icon: Package,         label: 'My Parcels' },
  { to: '/portal/hubs',      end: false, icon: MapPin,          label: 'Hub Addresses' },
  { to: '/portal/profile',   end: false, icon: User,            label: 'My Profile' },
  { to: '/portal/settings',  end: false, icon: Settings,        label: 'Settings' },
]

export default function CustomerPortal({ children }) {
  const user    = useAuthStore((s) => s.user)
  const logout  = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const {
    notifications, unread, connected, markRead, markAllRead,
  } = useNotifications(scopeForUser(user))

  const handleLogout = () => { logout(); window.location.href = 'https://www.onlineexpress.co.zm/' }

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
          ${collapsed ? 'w-16' : 'w-60'}`}
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
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">{activeLabel}</h1>
            <div className="flex items-center gap-3">
              <NotificationBell
                notifications={notifications}
                unreadCount={unread}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                connected={connected}
              />
              {user && (
                <div className="flex items-center gap-2.5">
                  {user.customerId && (
                    <div className="hidden sm:block bg-slate-100 rounded-lg px-3 py-1">
                      <span className="text-xs font-mono font-bold text-slate-600">{user.customerId}</span>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => navigate('/portal/profile')}
                    title="My Profile"
                  >
                    <div className="hidden sm:block text-right leading-tight">
                      <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                      <div className="text-[11px] text-slate-400">Customer</div>
                    </div>
                    <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-soft-sm group-hover:ring-2 group-hover:ring-brand-300 transition-all">
                      {user.initials}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Profile completion wizard — blocks portal until profile is complete */}
      <ProfileCompletionWizard />
    </div>
  )
}
