import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Package, LayoutDashboard, Calculator, Wallet, MapPin, User,
  LogOut, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../authStore'
import { useCustomerStore } from '../customerStore'

const NAV = [
  { to: '/portal',                 end: true,  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/shipments',       end: false, icon: Package,         label: 'Shipments' },
  { to: '/portal/rate-calculator', end: false, icon: Calculator,      label: 'Rate Calculator' },
  { to: '/portal/wallet',          end: false, icon: Wallet,          label: 'Wallet' },
  { to: '/portal/hubs',            end: false, icon: MapPin,          label: 'Hub Locations' },
  { to: '/portal/profile',         end: false, icon: User,            label: 'My Profile' },
]

export default function CustomerPortal({ children }) {
  const user                 = useAuthStore((s) => s.user)
  const logout               = useAuthStore((s) => s.logout)
  const getWallet            = useCustomerStore((s) => s.getWallet)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const navigate             = useNavigate()
  const location             = useLocation()
  const [collapsed, setCollapsed] = useState(false)

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
