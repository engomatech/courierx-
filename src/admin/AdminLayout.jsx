import { useState } from 'react'
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Settings, Globe, Map, Package, ChevronDown, ChevronRight,
  ChevronLeft, MapPin, Building2, Layers, Truck, CreditCard, Mail,
  MessageSquare, Database, Share2, FileText, Shield, RefreshCw, ExternalLink, LogOut, Key, Users, Bell, BookOpen, LayoutDashboard, Activity,
} from 'lucide-react'
import { useAdminStore } from './adminStore'
import { useAuthStore } from '../authStore'
import { NotificationBell } from '../components/ui'
import { useNotifications, scopeForUser } from '../hooks/useNotifications'

const NAV = [
  { to: '/admin',        label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/health', label: 'Health Monitor', icon: Activity },
  {
    label: 'Users',
    icon: Users,
    children: [
      { to: '/admin/users', label: 'User Management', icon: Users },
    ],
  },
  {
    label: 'Master Setup',
    icon: Settings,
    children: [
      {
        label: 'Location Management',
        icon: Globe,
        children: [
          { to: '/admin/locations/countries', label: 'Countries',          icon: Globe },
          { to: '/admin/locations/states',    label: 'States',             icon: MapPin },
          { to: '/admin/locations/cities',    label: 'Cities',             icon: Building2 },
          { to: '/admin/locations/pincodes',  label: 'Pin / Postal Codes', icon: MapPin },
        ],
      },
      {
        label: 'Zone Management',
        icon: Map,
        children: [
          { to: '/admin/zones/international', label: 'International Zones', icon: Globe },
          { to: '/admin/zones/domestic',      label: 'Domestic Zones',      icon: Map },
        ],
      },
      {
        label: 'Shipping Services',
        icon: Truck,
        children: [
          { to: '/admin/services',         label: 'Services List', icon: Truck },
          { to: '/admin/services/pricing', label: 'Pricing Setup', icon: Layers },
        ],
      },
      { to: '/admin/hubs',   label: 'Hub Management',   icon: Building2 },
      { to: '/admin/agents', label: 'Agent Management', icon: Users },
      { to: '/admin/cms',    label: 'CMS Pages',        icon: BookOpen },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { to: '/admin/settings/general',         label: 'General Settings',     icon: Settings },
      { to: '/admin/settings/system',          label: 'System Settings',      icon: Globe },
      { to: '/admin/settings/shipment',        label: 'Shipment Settings',    icon: Package },
      { to: '/admin/settings/account',         label: 'Account Settings',     icon: Shield },
      { to: '/admin/settings/carriers',        label: 'Third Party Carriers', icon: Truck },
      { to: '/admin/settings/payment',         label: 'Payment Gateway',      icon: CreditCard },
      { to: '/admin/settings/smtp',            label: 'SMTP Email',           icon: Mail },
      { to: '/admin/settings/notifications',   label: 'Notifications',        icon: Bell },
      { to: '/admin/settings/social',          label: 'Social Settings',      icon: Share2 },
      { to: '/admin/settings/email-templates', label: 'Email Templates',      icon: FileText },
      { to: '/admin/settings/sms-templates',   label: 'SMS Templates',        icon: MessageSquare },
      { to: '/admin/settings/backup',          label: 'Database Backup',      icon: Database },
    { to: '/admin/settings/api-keys',        label: 'Partner API Keys',     icon: Key },
    ],
  },
]

function NavGroup({ item, depth = 0 }) {
  const location = useLocation()
  const isChildActive = item.children?.some((c) =>
    c.to ? location.pathname.startsWith(c.to) : c.children?.some((cc) => location.pathname.startsWith(cc.to))
  )
  const [open, setOpen] = useState(isChildActive || depth === 0)

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors mx-1 ${
            depth > 0 ? 'pl-7' : ''
          } ${isActive
            ? 'bg-brand-600 text-white shadow-soft-sm'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`
        }
      >
        {item.icon && <item.icon size={15} className="shrink-0" />}
        <span>{item.label}</span>
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mx-1 transition-colors ${
          depth === 0
            ? 'text-slate-400 hover:text-slate-200 font-semibold text-[11px] tracking-wider uppercase mt-3'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        }`}
      >
        {item.icon && depth > 0 && <item.icon size={15} className="shrink-0 text-slate-500" />}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className={depth === 0 ? 'mb-2' : 'ml-2 border-l border-slate-800/80 ml-4 pl-1 mb-1'}>
          {item.children.map((child) => (
            <NavGroup key={child.label || child.to} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const resetAdmin = useAdminStore((s) => s.resetAdmin)
  const user       = useAuthStore((s) => s.user)
  const logout     = useAuthStore((s) => s.logout)
  const location   = useLocation()
  const navigate   = useNavigate()

  // Server-backed notification inbox
  const {
    notifications, unread, connected, markRead, markAllRead,
  } = useNotifications(scopeForUser(user))

  const pageTitle = (() => {
    const flat = NAV.flatMap((g) =>
      g.to ? [g] : (g.children || []).flatMap((c) =>
        c.children ? c.children.flatMap((cc) => cc.children || [cc]) : [c]
      )
    )
    return flat.find((p) => p.to && location.pathname.startsWith(p.to))?.label || 'Admin'
  })()

  const handleLogout = () => { logout(); window.location.href = 'https://www.onlineexpress.co.zm/' }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/80">
          <div className="flex items-center justify-center w-9 h-9 bg-brand-600 rounded-xl shrink-0 shadow-soft">
            <Shield size={17} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-semibold text-[15px] tracking-tight block truncate">Online Express</span>
              <div className="text-[11px] text-slate-400 truncate">Master configuration</div>
            </div>
          )}
        </div>

        {/* Back to Operations */}
        {!collapsed && (
          <Link
            to="/ops"
            className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <ExternalLink size={13} />
            <span>Back to operations</span>
          </Link>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          {!collapsed && NAV.map((group) => (
            <NavGroup key={group.label} item={group} depth={0} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800/80 p-3 space-y-1">
          {!collapsed && (
            <button
              onClick={resetAdmin}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <RefreshCw size={13} /> Reset admin data
            </button>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-800/80 hover:text-white transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">{pageTitle}</h1>
            <nav className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Link to="/admin" className="hover:text-brand-600 transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-slate-500">{pageTitle}</span>
            </nav>
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
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-soft-sm">
                  {user.initials || 'A'}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
