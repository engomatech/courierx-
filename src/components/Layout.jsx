import { useState } from 'react'
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackagePlus, Truck, ScanLine, Archive,
  FileStack, MapPin, ClipboardList, CheckSquare, BarChart3,
  ChevronLeft, ChevronRight, Package, RefreshCw, Settings, LogOut,
} from 'lucide-react'
import { useStore } from '../store'
import { useAuthStore } from '../authStore'

const NAV = [
  { to: '/ops',               icon: LayoutDashboard, label: 'Dashboard',         step: null },
  { to: '/ops/booking',       icon: PackagePlus,     label: 'Shipment Booking',  step: 1 },
  { to: '/ops/prs',           icon: Truck,           label: 'Pickup (PRS)',      step: 2 },
  { to: '/ops/inbound-scan',  icon: ScanLine,        label: 'Origin Inbound',    step: 3 },
  { to: '/ops/bags',          icon: Archive,         label: 'Bag Management',    step: 4 },
  { to: '/ops/manifests',     icon: FileStack,       label: 'Manifest',          step: 5 },
  { to: '/ops/hub-inbound',   icon: MapPin,          label: 'Hub Inbound',       step: 6 },
  { to: '/ops/drs',           icon: ClipboardList,   label: 'Delivery (DRS)',    step: 7 },
  { to: '/ops/delivery',      icon: CheckSquare,     label: 'POD / NDR',         step: 8 },
  { to: '/ops/reports',       icon: BarChart3,       label: 'Reports',           step: null },
]

function findCurrentNav(pathname) {
  // Find most specific (longest) matching nav entry
  return NAV.reduce((best, n) => {
    const isOpsRoot = n.to === '/ops'
    const matches = isOpsRoot
      ? pathname === '/ops' || pathname === '/ops/'
      : pathname.startsWith(n.to)
    if (matches && (!best || n.to.length > best.to.length)) return n
    return best
  }, null)
}

export function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const reset    = useStore((s) => s.resetToDemo)
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const location = useLocation()
  const navigate = useNavigate()

  const currentNav = findCurrentNav(location.pathname)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg shrink-0">
            <Package size={18} />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-lg tracking-tight">CourierX</span>
              <div className="text-xs text-slate-400">Shipping Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {NAV.map(({ to, icon: Icon, label, step }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ops'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 whitespace-nowrap">
                  {step && <span className="text-slate-500 text-xs mr-1.5">{step}.</span>}
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-slate-700 p-3 space-y-1">
          {!collapsed && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-violet-400 hover:bg-slate-800 hover:text-violet-300 transition-colors"
            >
              <Settings size={14} />
              Admin Panel
            </Link>
          )}
          {!collapsed && (
            <button
              onClick={reset}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Reset Demo Data
            </button>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            {currentNav && (
              <>
                <h1 className="text-xl font-semibold text-slate-900">{currentNav.label}</h1>
                <p className="text-sm text-slate-500">{getSubtitle(location.pathname)}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">{user.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                  {user.role}
                </span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.initials || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

function getSubtitle(path) {
  const subtitles = {
    '/ops':              'Overview of all shipments and operations',
    '/ops/booking':      'Create new shipment bookings and generate AWB numbers',
    '/ops/prs':          'Manage Pickup Run Sheets and assign drivers',
    '/ops/inbound-scan': 'Scan shipments received at origin warehouse',
    '/ops/bags':         'Group shipments into bags by destination',
    '/ops/manifests':    'Create and dispatch manifests between hubs',
    '/ops/hub-inbound':  'Scan bags and shipments arriving at destination hub',
    '/ops/drs':          'Manage Delivery Run Sheets for last-mile delivery',
    '/ops/delivery':     'Record Proof of Delivery or Non-Delivery Reasons',
    '/ops/reports':      'View operational reports and analytics',
  }
  return subtitles[path] || ''
}
