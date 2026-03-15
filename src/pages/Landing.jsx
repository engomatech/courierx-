import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package, Truck, BarChart3, Globe, Shield, Zap,
  ArrowRight, Search, CheckCircle,
} from 'lucide-react'

const FEATURES = [
  { icon: Package,   title: 'End-to-End Tracking',          desc: 'Real-time visibility across every stage — from booking to proof of delivery.' },
  { icon: Truck,     title: 'Optimised Last-Mile Delivery',  desc: 'Automated DRS creation and smart route assignments for faster delivery.' },
  { icon: Globe,     title: 'International & Domestic Zones',desc: 'Manage multi-zone pricing and coverage for local and cross-border shipping.' },
  { icon: BarChart3, title: 'Operational Analytics',         desc: 'Live dashboards and reports to monitor performance across hubs and routes.' },
  { icon: Shield,    title: 'Compliance Built-In',           desc: 'Prohibited-items checks, IATA/ICAO regulation popups, and full audit trails.' },
  { icon: Zap,       title: 'Scan-Based Hub Operations',     desc: 'High-speed bag and manifest scanning that eliminates manual data entry.' },
]

const STATS = [
  { value: '50K+',  label: 'Shipments Managed' },
  { value: '99.5%', label: 'On-Time Delivery' },
  { value: '120+',  label: 'Cities Covered' },
  { value: '24/7',  label: 'Operations Support' },
]

const PIPELINE = [
  'Booking', 'Pickup (PRS)', 'Origin Inbound', 'Bagging',
  'Manifest', 'Hub Inbound', 'Delivery (DRS)', 'POD / NDR',
]

export default function Landing() {
  const [awb, setAwb] = useState('')
  const navigate      = useNavigate()

  const handleTrack = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow">
              <Package size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">CourierX</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              Get Started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-800/40 border border-violet-700/40 text-violet-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-8 uppercase">
            <Zap size={12} />
            Courier & Logistics Management Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Smarter Shipping,
            <br />
            <span className="text-violet-400">Every Step of the Way</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            CourierX gives you complete control over your logistics pipeline — from booking to
            last-mile delivery — with real-time tracking and powerful analytics.
          </p>

          {/* AWB tracking input */}
          <form onSubmit={handleTrack} className="flex gap-2 max-w-lg mx-auto mb-8">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="Enter AWB / tracking number…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Track
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Operations Login <ArrowRight size={14} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border border-slate-600 text-slate-200 hover:bg-slate-800/60 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Customer Portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <section className="bg-violet-600 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-white text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold">{value}</div>
              <div className="text-violet-200 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline strip ─────────────────────────────────── */}
      <section className="py-12 px-6 bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Full shipment pipeline — managed in one place
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <span className="w-5 h-5 bg-violet-100 text-violet-600 rounded-full text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Everything your courier operation needs
            </h2>
            <p className="text-slate-500 text-lg">
              A fully integrated platform built for modern logistics teams.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-2xl border p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={21} className="text-violet-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role callout ───────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { role: 'Admin',      color: 'violet', desc: 'Full system access — configure locations, zones, pricing, and all settings.',  badge: 'bg-violet-100 text-violet-700' },
            { role: 'Operations', color: 'blue',   desc: 'Run the daily pipeline — bookings, scans, bags, manifests, and deliveries.',   badge: 'bg-blue-100 text-blue-700' },
            { role: 'Customer',   color: 'emerald',desc: 'Track shipments, view delivery status, and book new shipments with ease.',     badge: 'bg-emerald-100 text-emerald-700' },
          ].map(({ role, desc, badge }) => (
            <div key={role} className="bg-white rounded-2xl border p-6 text-center">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${badge}`}>{role}</span>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              <Link to="/login" className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-violet-600 hover:text-violet-700">
                Sign in as {role} <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Package size={30} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold mb-4">Ready to streamline your logistics?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Sign in to access the full CourierX operations platform.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors"
          >
            Sign In Now <ArrowRight size={16} />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-5 text-slate-500 text-sm">
            {['No setup required', 'Demo data included', '3 role levels'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-violet-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center">
            <Package size={11} className="text-white" />
          </div>
          <span className="font-semibold text-slate-300">CourierX</span>
        </div>
        <p>© 2026 CourierX · Shipping Management Platform</p>
      </footer>
    </div>
  )
}
