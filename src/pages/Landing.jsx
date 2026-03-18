import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Phone, Mail, Clock, Package, Truck, Globe, Shield, Zap, Headphones,
  ArrowRight, Search, CheckCircle, MapPin, Star, ChevronDown, Menu, X,
  TrendingUp, Award, Users, BarChart3,
} from 'lucide-react'

/* ── Brand colour ─────────────────────────────────── */
const ORANGE = '#f59e0b'   // amber-500

/* ── Navigation ───────────────────────────────────── */
const NAV_LINKS = ['Home', 'About', 'Services', 'Why Us', 'Contact']

/* ── Stats ────────────────────────────────────────── */
const STATS = [
  { value: '1,435', label: 'Satisfied Customers', icon: Users },
  { value: '2,082', label: 'Successful Deliveries', icon: Package },
  { value: '145',   label: 'Industry Awards',       icon: Award },
  { value: '250',   label: 'Dedicated Staff',        icon: TrendingUp },
]

/* ── Services ─────────────────────────────────────── */
const SERVICES = [
  { icon: Globe,     title: 'Global Shipping',      desc: 'Secure and fast delivery worldwide. We connect you to over 120 countries with full tracking.' },
  { icon: Truck,     title: 'Door-to-Door Cargo',   desc: 'Convenient pickup and delivery directly to your door — domestic and cross-border.' },
  { icon: Zap,       title: 'Express Delivery',     desc: 'Same-day and next-day delivery options for time-critical parcels within Zambia.' },
  { icon: Shield,    title: 'Secure Delivery',      desc: 'Fully insured shipments with real-time tracking so your goods arrive safely, every time.' },
  { icon: BarChart3, title: 'Affordable Pricing',   desc: 'Transparent, competitive rates with no hidden fees — ideal for businesses of all sizes.' },
  { icon: Headphones,title: 'Customer Support',     desc: '24/7 dedicated support team ready to assist with bookings, tracking, and queries.' },
]

/* ── Why Choose ───────────────────────────────────── */
const WHY = [
  { icon: Search,    title: 'Reliable Tracking',    desc: 'Track your shipment in real-time from pickup to proof of delivery.' },
  { icon: Globe,     title: 'Global Coverage',      desc: 'Air, sea, and road freight solutions connecting Zambia to the world.' },
  { icon: Zap,       title: 'Speedy Deliveries',    desc: 'Optimised routes and dedicated riders ensure on-time delivery every time.' },
  { icon: Shield,    title: 'Affordable Rates',     desc: 'Cost-effective shipping solutions tailored to your business needs.' },
]

/* ── Pipeline ─────────────────────────────────────── */
const PIPELINE = [
  'Booking', 'Pickup (PRS)', 'Origin Inbound', 'Bagging',
  'Manifest', 'Hub Inbound', 'Delivery (DRS)', 'POD / NDR',
]

/* ─────────────────────────────────────────────────── */
export default function Landing() {
  const [awb,         setAwb]         = useState('')
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const navigate = useNavigate()

  const handleTrack = (e) => {
    e.preventDefault()
    if (awb.trim()) navigate(`/track?awb=${encodeURIComponent(awb.trim())}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Top contact bar ──────────────────────────────── */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-5">
            <a href="tel:+260975525181" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Phone size={11} /> +260 975 525 181
            </a>
            <a href="mailto:zamaccounts@onlineexpress.co.zm" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Mail size={11} /> zamaccounts@onlineexpress.co.zm
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} /> Mon – Sat: 9:00 AM – 6:00 PM
          </div>
        </div>
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {/* Try image logo first, fallback to styled */}
            <img
              src="/logo.png"
              alt="Online Express"
              className="h-10 w-auto"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ORANGE }}>
                <Package size={18} className="text-white" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 leading-none">
                Online<span style={{ color: ORANGE }}>Express</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-colors"
              style={{ background: ORANGE }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = ORANGE}
            >
              Register
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-slate-700 font-medium py-2 border-b border-slate-100"
              >
                {link}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg border border-slate-300 text-slate-700">Sign In</Link>
              <Link to="/register" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg text-white" style={{ background: ORANGE }}>Register</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-[88vh] flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
        }}
      >
        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.92) 50%, rgba(15,23,42,0.5) 100%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 border"
              style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Trusted by 1,400+ businesses
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-2">
              Fast &amp; Reliable
            </h1>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6" style={{ color: ORANGE }}>
              Courier Services
            </h1>

            {/* Subtext */}
            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl">
              Deliver your parcels on time, every time. Trusted domestic and
              international shipping solutions with real-time tracking.
            </p>

            {/* Track AWB */}
            <form onSubmit={handleTrack} className="flex gap-2 mb-8 max-w-lg">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  placeholder="Enter AWB / tracking number…"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 text-sm backdrop-blur"
                  style={{ '--tw-ring-color': ORANGE }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-colors"
                style={{ background: ORANGE }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = ORANGE}
              >
                Track
              </button>
            </form>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
                style={{ background: ORANGE }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = ORANGE}
              >
                Get Started <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
              >
                Operations Login <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: ORANGE }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-white text-center">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon size={22} className="text-white/70" />
              <div className="text-4xl font-extrabold">{value}</div>
              <div className="text-sm text-white/80 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────── */}
      <section id="services" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>What We Offer</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-4">Our Services</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              From local pickups to global freight — we handle every shipment with care, speed, and transparency.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-100 p-7 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-default"
              >
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5 w-14 h-14"
                  style={{ background: 'rgba(245,158,11,0.1)' }}
                >
                  <Icon size={24} style={{ color: ORANGE }} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                <div
                  className="mt-5 flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
                  style={{ color: ORANGE }}
                >
                  Learn more <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline strip ───────────────────────────────── */}
      <section className="py-12 px-6 bg-white border-y">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-7">
            Full shipment pipeline — managed in one place
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
                    style={{ background: ORANGE }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight size={13} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────── */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Text */}
          <div>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>About Us</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-5 leading-tight">
              Delivering Excellence<br />in Logistics for 10+ Years
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Online Express Limited is Zambia's trusted courier and logistics partner. With over a decade of experience,
              we provide reliable domestic and international shipping solutions with a focus on speed, safety, and transparency.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              From our main office in Lusaka to our international hubs in the UK and USA, we connect businesses and
              individuals to the world. <strong className="text-slate-700">Your trust is our priority.</strong>
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Fast Delivery', desc: 'Same & next-day options' },
                { label: 'Affordable Rates', desc: 'Competitive pricing' },
                { label: 'Timely Pickups', desc: 'Scheduled collections' },
                { label: 'Seamless Tracking', desc: 'Real-time visibility' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle size={18} style={{ color: ORANGE }} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div
              className="rounded-3xl overflow-hidden h-80 bg-cover bg-center relative"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80')" }}
            >
              <div className="absolute inset-0 bg-slate-900/40" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur rounded-2xl px-5 py-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: ORANGE }}>
                      <Package size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">10 Years of Trust</div>
                      <div className="text-xs text-slate-500">Serving Zambia & beyond since 2014</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full flex flex-col items-center justify-center text-white shadow-xl"
              style={{ background: ORANGE }}
            >
              <div className="text-2xl font-extrabold leading-none">10+</div>
              <div className="text-xs font-semibold text-white/80 leading-tight text-center">Years Exp.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────── */}
      <section id="why-us" className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Why Choose Us</span>
            <h2 className="text-4xl font-extrabold text-white mt-2 mb-4">Why Online Express?</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We go beyond delivery — we deliver peace of mind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-700 p-7 hover:border-amber-500/50 transition-colors text-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto"
                  style={{ background: 'rgba(245,158,11,0.15)' }}
                >
                  <Icon size={24} style={{ color: ORANGE }} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        className="py-20 px-6 text-white text-center relative overflow-hidden"
        style={{ background: ORANGE }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Ship with Us?</h2>
          <p className="text-white/85 mb-8 text-lg">
            Join 1,400+ businesses that trust Online Express for fast, reliable courier services.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/75 text-sm">
            {['No setup required', 'Real-time tracking', '24/7 support'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-white/90" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Get In Touch</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-4">Contact Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'Lusaka (Main)',
                addr: 'Agora Village, Block 7, Thabo Mbeki, Lusaka',
                phone: '+260 975 525 181',
                flag: '🇿🇲',
              },
              {
                label: 'United Kingdom',
                addr: 'iShop Zambia Unit 49, Bolney Grange Business Park, Haywards Heath, West Sussex RH17 5PB',
                phone: '+01444 243 935',
                flag: '🇬🇧',
              },
              {
                label: 'United States',
                addr: 'C/O Online Express Zambia, 733 59th Street, Brooklyn, NY 11220',
                phone: '+(718) 838-9686',
                flag: '🇺🇸',
              },
            ].map(({ label, addr, phone, flag }) => (
              <div key={label} className="bg-slate-50 rounded-2xl border p-7">
                <div className="text-3xl mb-3">{flag}</div>
                <h3 className="font-bold text-slate-900 text-base mb-3">{label}</h3>
                <div className="flex items-start gap-2 text-sm text-slate-500 mb-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: ORANGE }} />
                  {addr}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone size={13} style={{ color: ORANGE }} /> {phone}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 pt-14 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src="/logo.png"
                  alt="Online Express"
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="hidden items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ORANGE }}>
                    <Package size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-white">Online<span style={{ color: ORANGE }}>Express</span></span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
                Zambia's trusted courier and logistics partner. Fast, reliable, and transparent shipping — domestically and worldwide.
              </p>
              <div className="mt-5 space-y-1.5 text-sm">
                <a href="tel:+260975525181" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Phone size={13} style={{ color: ORANGE }} /> +260 975 525 181
                </a>
                <a href="mailto:zamaccounts@onlineexpress.co.zm" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Mail size={13} style={{ color: ORANGE }} /> zamaccounts@onlineexpress.co.zm
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                {['About Us', 'Services', 'Track & Trace', 'Get a Quote', 'Contact Us'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      <ArrowRight size={12} /> {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                {['Privacy Policy', 'Terms & Conditions', 'Fuel Surcharge', 'Restricted Items', 'Volumetric Weight'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      <ArrowRight size={12} /> {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <p>© 2026 Online Express Limited · All rights reserved.</p>
            <p>Designed by Courier Software</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
