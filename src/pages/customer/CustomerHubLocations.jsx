/*
 * CustomerHubLocations.jsx
 *
 * GO-LIVE: Shows international forwarding hub addresses only.
 * Local Zambia collection hubs are hidden until local hub data is confirmed
 * and local delivery operations are ready for customer-facing display.
 *
 * To restore local hubs: uncomment the LOCAL_HUBS section below and add a
 * tab switcher between "International" and "Local Collection" views.
 */

import { useState } from 'react'
import { MapPin, Package, Copy, CheckCircle, Info, Globe, Phone, Clock } from 'lucide-react'
import { useAuthStore } from '../../authStore'

/* ── International forwarding hub addresses ──────────────────────────────────
   These are the addresses customers use when shopping online overseas.
   Parcels sent here are consolidated and forwarded to Zambia.
─────────────────────────────────────────────────────────────────────────────── */
const INTL_HUBS = [
  {
    id: 'HK',
    flag: '🇭🇰',
    country: 'Hong Kong',
    label: 'China / Asia (via Hong Kong)',
    color: { ring: 'ring-amber-300', header: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800', note: 'bg-amber-50 border-amber-200 text-amber-800' },
    note: 'Use this address for orders from China, Hong Kong, and most Asian websites that cannot deliver directly to mainland China.',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'DPEX Worldwide (HK) Ltd',
      'Flat B1, 12F Block B',
      'Yee Lim Industrial Centre',
      '2-28 Kwai Lok Street',
      'Kwai Chung, New Territories',
      'Hong Kong',
      'Tel: +852 8106 3232',
    ],
  },
  {
    id: 'CN',
    flag: '🇨🇳',
    country: 'China Mainland',
    label: 'China Mainland',
    color: { ring: 'ring-rose-300', header: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800', note: 'bg-rose-50 border-rose-200 text-rose-800' },
    note: 'Use this address for orders from Taobao, 1688, Alibaba, and other mainland Chinese platforms that deliver within China only.',
    lines: [
      '[YOUR NAME] / [CUSTOMER ID]',
      'No.133 Liangbai Road',
      'Pinghu Street, Longgang District',
      'Shenzhen City, China 518111',
      'TEL: 18998992874',
    ],
  },
]

const LOCAL_HUBS = [
  { id: 'H001', name: 'Lusaka Main Hub',   city: 'Lusaka',      phone: '+260 211 234 567', hours: 'Mon–Fri: 07:30–18:00 · Sat: 08:00–13:00', isMain: true  },
  { id: 'H002', name: 'Kitwe Hub',         city: 'Kitwe',       phone: '+260 212 345 678', hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00', isMain: false },
  { id: 'H003', name: 'Ndola Hub',         city: 'Ndola',       phone: '+260 212 456 789', hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00', isMain: false },
  { id: 'H004', name: 'Livingstone Hub',   city: 'Livingstone', phone: '+260 213 567 890', hours: 'Mon–Fri: 08:00–16:30 · Sat: 09:00–12:00', isMain: false },
  { id: 'H005', name: 'Chipata Hub',       city: 'Chipata',     phone: '+260 216 678 901', hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00', isMain: false },
  { id: 'H006', name: 'Solwezi Hub',       city: 'Solwezi',     phone: '+260 218 789 012', hours: 'Mon–Fri: 08:00–17:00 · Closed Sat',       isMain: false },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0
        ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white/70 text-slate-700 border border-slate-200 hover:bg-white'}`}
    >
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function CustomerHubLocations() {
  const user         = useAuthStore((s) => s.user)
  const customerId   = user?.customerId || 'CXXXXXNN'
  const customerName = [user?.firstName, user?.surname].filter(Boolean).join(' ') || user?.name || 'YOUR NAME'

  const [tab, setTab] = useState('international')

  return (
    <div className="p-6 space-y-6">

      {/* Header + account number banner */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hub Addresses</h2>
          <p className="text-sm text-slate-400 mt-1">
            International forwarding hubs and local collection points.
          </p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
          <Package size={16} className="text-violet-500" />
          <div>
            <p className="text-[10px] text-violet-500 uppercase tracking-wider font-semibold">Your Account No.</p>
            <p className="font-mono font-bold text-violet-800 text-lg leading-tight">{customerId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'international', label: '🌍 International Hubs' },
          { key: 'local',         label: '📦 Local Collection' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── International Hubs ─────────────────────────────────────────────── */}
      {tab === 'international' && (
        <>
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info size={15} className="text-violet-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-violet-900 mb-1">How to use your international hub address</div>
              <ol className="text-xs text-violet-700 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Choose the hub address for the country you're ordering from.</li>
                <li>
                  The first address line is pre-filled with your name and account number{' '}
                  <span className="font-mono font-bold text-violet-900">{customerId}</span> — copy as-is.
                </li>
                <li>Enter this address at checkout as your delivery address.</li>
                <li>We'll receive your parcel, consolidate it, and ship it to you in Zambia.</li>
              </ol>
            </div>
          </div>

          <div className="space-y-5">
            {INTL_HUBS.map((hub) => {
              const addressText = hub.lines
                .map((l) => l.replace('[YOUR NAME]', customerName).replace('[CUSTOMER ID]', customerId))
                .join('\n')

              return (
                <div key={hub.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ring-2 ${hub.color.ring}`}>
                  <div className={`${hub.color.header} px-5 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{hub.flag}</span>
                      <div>
                        <div className="font-bold text-white text-sm">{hub.label}</div>
                        <div className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                          <Globe size={10} /> International Forwarding Hub
                        </div>
                      </div>
                    </div>
                    <CopyButton text={addressText} />
                  </div>

                  <div className="px-5 py-4">
                    <div className="bg-slate-50 rounded-xl px-4 py-3 font-mono text-xs space-y-0.5 mb-4">
                      {hub.lines.map((line, i) => (
                        <p key={i} className={i === 0 ? 'font-bold text-violet-700' : 'text-slate-700'}>
                          {line.replace('[YOUR NAME]', customerName).replace('[CUSTOMER ID]', customerId)}
                        </p>
                      ))}
                    </div>
                    <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 border ${hub.color.note}`}>
                      <Info size={13} className="shrink-0 mt-0.5" />
                      <span>{hub.note}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t bg-slate-50 flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{hub.country}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    <span className="text-xs text-slate-400">International consolidation hub</span>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-slate-400">
            Additional hub locations (UK, USA) are coming soon. Contact us if you need to ship from a country not listed above.
          </p>
        </>
      )}

      {/* ── Local Collection Hubs ──────────────────────────────────────────── */}
      {tab === 'local' && (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info size={15} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-900 mb-1">Collecting or dropping off a parcel?</div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Visit any hub below. Always quote your account number{' '}
                <span className="font-mono font-bold text-emerald-900">{customerId}</span>{' '}
                and bring a valid ID. Hub staff will use your account number to locate your shipment.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {LOCAL_HUBS.map((hub) => (
              <div
                key={hub.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${hub.isMain ? 'ring-2 ring-violet-300 border-violet-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      {hub.isMain && (
                        <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Main
                        </span>
                      )}
                      {hub.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {hub.city}, Zambia
                    </div>
                  </div>
                  <CopyButton text={`Online Express — ${hub.name}\n${hub.city}, Zambia\nTel: ${hub.phone}\nRef: ${customerId}`} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={11} className="text-slate-400 shrink-0" />
                    <span>{hub.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <Clock size={11} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{hub.hours}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Package size={11} className="text-violet-400" />
                  <span className="text-[11px] text-slate-500">Quote account no: </span>
                  <span className="font-mono font-bold text-violet-700 text-[11px]">{customerId}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
