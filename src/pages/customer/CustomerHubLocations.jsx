import { MapPin, Clock, Phone, Package, Globe, ExternalLink, CheckCircle } from 'lucide-react'

const HUBS = [
  {
    id: 'H001',
    name: 'Lusaka Main Hub',
    code: 'LUS-MAIN',
    address: 'Plot 1234, Cairo Road',
    city: 'Lusaka',
    province: 'Lusaka Province',
    country: 'Zambia',
    postal: '10101',
    phone: '+260 211 234 567',
    email: 'lusaka@courierx.com',
    hours: 'Mon–Fri: 07:30–18:00 · Sat: 08:00–13:00',
    services: ['Domestic Drop-off', 'International Drop-off', 'Parcel Collection', 'Returns'],
    status: 'Open',
    lat: -15.4167,
    lng: 28.2833,
    isMain: true,
  },
  {
    id: 'H002',
    name: 'Kitwe Hub',
    code: 'KIT-HUB',
    address: 'Stand 567, Obote Avenue',
    city: 'Kitwe',
    province: 'Copperbelt Province',
    country: 'Zambia',
    postal: '20100',
    phone: '+260 212 345 678',
    email: 'kitwe@courierx.com',
    hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00',
    services: ['Domestic Drop-off', 'Parcel Collection'],
    status: 'Open',
    lat: -12.8027,
    lng: 28.2132,
    isMain: false,
  },
  {
    id: 'H003',
    name: 'Ndola Hub',
    code: 'NDO-HUB',
    address: '89 Broadway Street',
    city: 'Ndola',
    province: 'Copperbelt Province',
    country: 'Zambia',
    postal: '10001',
    phone: '+260 212 456 789',
    email: 'ndola@courierx.com',
    hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00',
    services: ['Domestic Drop-off', 'Parcel Collection', 'International Drop-off'],
    status: 'Open',
    lat: -12.9587,
    lng: 28.6366,
    isMain: false,
  },
  {
    id: 'H004',
    name: 'Livingstone Hub',
    code: 'LIV-HUB',
    address: '23 Mosi-oa-Tunya Road',
    city: 'Livingstone',
    province: 'Southern Province',
    country: 'Zambia',
    postal: '90100',
    phone: '+260 213 567 890',
    email: 'livingstone@courierx.com',
    hours: 'Mon–Fri: 08:00–16:30 · Sat: 09:00–12:00',
    services: ['Domestic Drop-off', 'Parcel Collection'],
    status: 'Open',
    lat: -17.8419,
    lng: 25.8543,
    isMain: false,
  },
  {
    id: 'H005',
    name: 'Chipata Hub',
    code: 'CHP-HUB',
    address: 'Stand 12, Independence Avenue',
    city: 'Chipata',
    province: 'Eastern Province',
    country: 'Zambia',
    postal: '40100',
    phone: '+260 216 678 901',
    email: 'chipata@courierx.com',
    hours: 'Mon–Fri: 08:00–17:00 · Sat: 08:00–12:00',
    services: ['Domestic Drop-off', 'Parcel Collection'],
    status: 'Open',
    lat: -13.6317,
    lng: 32.6442,
    isMain: false,
  },
  {
    id: 'H006',
    name: 'Solwezi Hub',
    code: 'SOL-HUB',
    address: 'Stand 5, Kansanshi Road',
    city: 'Solwezi',
    province: 'North-Western Province',
    country: 'Zambia',
    postal: '80100',
    phone: '+260 218 789 012',
    email: 'solwezi@courierx.com',
    hours: 'Mon–Fri: 08:00–17:00 · Closed Sat',
    services: ['Domestic Drop-off', 'Parcel Collection'],
    status: 'Closed',
    lat: -12.1744,
    lng: 26.3897,
    isMain: false,
  },
]

const SERVICE_COLOR = {
  'Domestic Drop-off':      'bg-blue-100 text-blue-700',
  'International Drop-off': 'bg-violet-100 text-violet-700',
  'Parcel Collection':      'bg-emerald-100 text-emerald-700',
  'Returns':                'bg-orange-100 text-orange-700',
}

export default function CustomerHubLocations() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Hub &amp; Warehouse Locations</h2>
        <p className="text-sm text-slate-400 mt-1">
          Drop off your parcels at any of our locations. We will handle the rest.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Package size={16} className="text-violet-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-violet-900">How to ship with us</div>
          <div className="text-xs text-violet-700 mt-0.5 leading-relaxed">
            Book your shipment online, then drop your parcel at any hub below. Bring your AWB number or the booking confirmation.
            Our team will process and dispatch your shipment within 1 business day.
          </div>
        </div>
      </div>

      {/* Hub grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {HUBS.map((hub) => (
          <div
            key={hub.id}
            className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-shadow hover:shadow-md
              ${hub.isMain ? 'ring-2 ring-violet-300' : ''}`}
          >
            {/* Card header */}
            <div className={`px-5 py-4 flex items-start justify-between ${hub.isMain ? 'bg-violet-600 text-white' : 'bg-slate-50 border-b'}`}>
              <div>
                <div className={`font-bold text-sm ${hub.isMain ? 'text-white' : 'text-slate-900'}`}>{hub.name}</div>
                <div className={`text-xs mt-0.5 font-mono ${hub.isMain ? 'text-violet-200' : 'text-slate-400'}`}>{hub.code}</div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0
                ${hub.status === 'Open'
                  ? hub.isMain ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'}`}
              >
                {hub.status === 'Open' && <CheckCircle size={11} />}
                {hub.status}
              </span>
            </div>

            {/* Card body */}
            <div className="px-5 py-4 flex-1 space-y-3">
              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className={`mt-0.5 flex-shrink-0 ${hub.isMain ? 'text-violet-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm text-slate-800">{hub.address}</div>
                  <div className="text-xs text-slate-500">{hub.city}, {hub.province}</div>
                  <div className="text-xs text-slate-500">{hub.country} · {hub.postal}</div>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-600 leading-relaxed">{hub.hours}</div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 flex-shrink-0" />
                <a href={`tel:${hub.phone}`} className="text-xs text-violet-700 hover:underline">{hub.phone}</a>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hub.services.map((svc) => (
                  <span key={svc} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SERVICE_COLOR[svc] || 'bg-slate-100 text-slate-600'}`}>
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Card footer */}
            <div className="px-5 py-3 border-t bg-slate-50 flex items-center gap-2">
              <Globe size={13} className="text-slate-400" />
              <a
                href={`https://maps.google.com/?q=${hub.lat},${hub.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-700 hover:underline font-medium flex items-center gap-1"
              >
                Get Directions <ExternalLink size={11} />
              </a>
              <span className="mx-1 text-slate-300">·</span>
              <a href={`mailto:${hub.email}`} className="text-xs text-slate-500 hover:text-violet-700 transition-colors">
                {hub.email}
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Opening hours may vary on public holidays. Please call ahead to confirm.
      </p>
    </div>
  )
}
