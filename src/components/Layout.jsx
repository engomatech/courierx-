import { useState } from 'react'
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackagePlus, Truck, ScanLine, Archive,
  FileStack, MapPin, ClipboardList, CheckSquare, BarChart3,
  ChevronLeft, ChevronRight, Package, RefreshCw, Settings, LogOut,
  Globe, AlertTriangle, AlertOctagon, Users, DollarSign, CalendarClock,
  Banknote, FileCheck,
} from 'lucide-react'
import { useStore } from '../store'
import { useAuthStore } from '../authStore'

const NAV = [
  { to: '/ops',                    icon: LayoutDashboard, label: 'Dashboard',         step: null },
  { to: '/ops/partner-orders',     icon: Globe,           label: 'Partner Orders',    step: null },
  { to: '/ops/booking',            icon: PackagePlus,     label: 'Shipment Booking',  step: 1,    badge: 'booked' },
  { to: '/ops/prs',                icon: Truck,           label: 'Pickup (PRS)',      step: 2,    badge: 'confirmed' },
  { to: '/ops/inbound-scan',       icon: ScanLine,        label: 'Origin Inbound',    step: 3,    badge: 'pickedUp' },
  { to: '/ops/bags',               icon: Archive,         label: 'Bag Management',    step: 4,    badge: 'unbagged' },
  { to: '/ops/manifests',          icon: FileStack,       label: 'Manifest',          step: 5,    badge: 'closedBags' },
  { to: '/ops/hub-inbound',        icon: MapPin,          label: 'Hub Inbound',       step: 6,    badge: 'dispatched' },
  { to: '/ops/discrepancies',      icon: AlertTriangle,   label: 'Discrepancies',     step: null, badge: 'disc' },
  { to: '/ops/drs',                icon: ClipboardList,   label: 'Delivery (DRS)',    step: 7,    badge: 'hubInbound' },
  { to: '/ops/delivery',           icon: CheckSquare,     label: 'POD / NDR',         step: 8,    badge: 'inProgress' },
  { to: '/ops/exceptions',         icon: AlertOctagon,    label: 'Exceptions',        step: null, badge: 'exc' },
  { to: '/ops/reports',             icon: BarChart3,    label: 'Reports',           step: null },
  { to: '/ops/finance',             icon: DollarSign,   label: 'Finance',           step: null },
  { to: '/ops/shipment-manifests',  icon: FileCheck,    label: 'Shipment Manifests',step: null },
  { to: '/ops/customs',             icon: Globe,        label: 'Customs',           step: null },
  { to: '/ops/cod',                 icon: Banknote,     label: 'COD',               step: null },
  { to: '/ops/scheduled-pickups',   icon: CalendarClock,label: 'Sched. Pickups',    step: null },
  { to: '/ops/customers',           icon: Users,        label: 'Customers',         step: null },
]

// Badge color by type: red=alert, orange=exception, amber=pipeline action needed
const BADGE_COLOR = {
  disc:       'bg-red-500',
  exc:        'bg-orange-500',
  booked:     'bg-amber-500',
  confirmed:  'bg-amber-500',
  pickedUp:   'bg-amber-500',
  unbagged:   'bg-amber-500',
  closedBags: 'bg-amber-500',
  dispatched: 'bg-amber-500',
  hubInbound: 'bg-amber-500',
  inProgress: 'bg-green-500',
}

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
  const reset         = useStore((s) => s.resetToDemo)
  const shipments     = useStore((s) => s.shipments)
  const bags          = useStore((s) => s.bags)
  const manifests     = useStore((s) => s.manifests)
  const drs           = useStore((s) => s.drs)
  const openDiscCount = useStore((s) => s.discrepancies.filter((d) => d.status === 'open').length)
  const openExcCount  = useStore((s) => s.exceptions.filter((e) => e.status !== 'resolved').length)
  const user          = useAuthStore((s) => s.user)

  // Pipeline counts for sidebar badges
  const badgeCounts = {
    disc:       openDiscCount,
    exc:        openExcCount,
    booked:     shipments.filter((s) => s.status === 'Booked').length,
    confirmed:  shipments.filter((s) => s.status === 'Confirmed').length,
    pickedUp:   shipments.filter((s) => s.status === 'Picked Up').length,
    unbagged:   shipments.filter((s) => s.status === 'Origin Scanned' && !s.bagId).length,
    closedBags: bags.filter((b) => b.status === 'Closed').length,
    dispatched: manifests.filter((m) => m.status === 'Dispatched').length,
    hubInbound: shipments.filter((s) => s.status === 'Hub Inbound' && !s.drsId).length,
    inProgress: drs.filter((d) => d.status === 'In Progress').length,
  }
  const logout        = useAuthStore((s) => s.logout)
  const location      = useLocation()
  const navigate      = useNavigate()

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
              <span className="font-bold text-lg tracking-tight">Online Express</span>
              <div className="text-xs text-slate-400">Shipping Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {NAV.map(({ to, icon: Icon, label, step, badge }) => {
            const badgeCount = badge ? (badgeCounts[badge] || 0) : 0
            const badgeColor = badge ? (BADGE_COLOR[badge] || 'bg-slate-500') : 'bg-slate-500'
            return (
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
                <div className="relative shrink-0">
                  <Icon size={18} />
                  {badgeCount > 0 && collapsed && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none ${badgeColor}`}>
                      {badgeCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 whitespace-nowrap">
                    {step && <span className="text-slate-500 text-xs mr-1.5">{step}.</span>}
                    {label}
                  </span>
                )}
                {!collapsed && badgeCount > 0 && (
                  <span className={`ml-auto min-w-[20px] text-center text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${badgeColor}`}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            )
          })}
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
    '/ops':                  'Overview of all shipments and operations',
    '/ops/partner-orders':   'Incoming shipments submitted by partners via the API',
    '/ops/booking':          'Create new shipment bookings and generate AWB numbers',
    '/ops/prs':          'Manage Pickup Run Sheets and assign drivers',
    '/ops/inbound-scan': 'Scan shipments received at origin warehouse',
    '/ops/bags':         'Group shipments into bags by destination',
    '/ops/manifests':    'Create and dispatch manifests between hubs',
    '/ops/hub-inbound':     'Scan bags and shipments arriving at destination hub',
    '/ops/discrepancies':   'Review and resolve manifest discrepancies flagged during hub inbound',
    '/ops/exceptions':      'Manage damage and exception reports across the pipeline',
    '/ops/drs':             'Manage Delivery Run Sheets for last-mile delivery',
    '/ops/delivery':     'Record Proof of Delivery or Non-Delivery Reasons',
    '/ops/reports':            'View operational reports and analytics',
    '/ops/finance':            'Revenue analytics, payment breakdown, and financial reports',
    '/ops/shipment-manifests': 'Direct-shipment manifests for individual AWBs',
    '/ops/customs':            'Process customs clearance for international shipments',
    '/ops/cod':                'Cash on Delivery collections and remittance tracking',
    '/ops/scheduled-pickups':  'Customer-requested scheduled pickup appointments',
    '/ops/customers':          'Manage and verify API customer accounts',
  }
  return subtitles[path] || ''
}
