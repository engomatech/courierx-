export const generateAWB = () => {
  const year = new Date().getFullYear()
  const num  = Math.floor(Math.random() * 90000) + 10000
  return `OEX-${year}-${num}`
}

export const generateHAWB = () => {
  const year = new Date().getFullYear()
  const num  = Math.floor(Math.random() * 900000) + 100000
  return `HWB-${year}-${num}`
}

export const generateId = (prefix) => {
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${num}`
}

// All timestamps stored as UTC — display in CAT (Africa/Lusaka = UTC+2)
const CAT = 'Africa/Lusaka'

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: CAT,
  })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: CAT,
  })
}

export const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: CAT,
  })
}

export const SHIPMENT_STATUS = {
  BOOKED: 'Booked',
  PRS_ASSIGNED: 'PRS Assigned',
  OUT_FOR_PICKUP: 'Out for Pickup',
  PICKED_UP: 'Picked Up',
  ORIGIN_SCANNED: 'Origin Scanned',
  BAGGED: 'Bagged',
  MANIFESTED: 'Manifested',
  HUB_INBOUND: 'Hub Inbound',
  DRS_ASSIGNED: 'DRS Assigned',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  NDR: 'Non-Delivery',
}

export const STATUS_COLORS = {
  // ── Origin pipeline ──────────────────────────────────────────────────────
  'Booked':                    'bg-blue-100 text-blue-800 border-blue-200',
  'Confirmed':                 'bg-sky-100 text-sky-800 border-sky-200',
  'PRS Assigned':              'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Out for Pickup':            'bg-orange-100 text-orange-800 border-orange-200',
  'Picked Up':                 'bg-amber-100 text-amber-800 border-amber-200',
  'Origin Scanned':            'bg-purple-100 text-purple-800 border-purple-200',
  'Bagged':                    'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Manifested':                'bg-cyan-100 text-cyan-800 border-cyan-200',
  // ── Hub process (origin) ─────────────────────────────────────────────────
  'Received at Hub':           'bg-violet-100 text-violet-800 border-violet-200',
  'Hub Inspection':            'bg-violet-100 text-violet-700 border-violet-200',
  'Parcel Weighed':            'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Processed at Warehouse':    'bg-purple-100 text-purple-700 border-purple-200',
  'Dispatched from Hub':       'bg-blue-100 text-blue-700 border-blue-200',
  'In Transit':                'bg-blue-100 text-blue-800 border-blue-300',
  // ── Zambia arrival ───────────────────────────────────────────────────────
  'Received in Zambia':        'bg-teal-100 text-teal-800 border-teal-200',
  'Under Customs Clearance':   'bg-amber-100 text-amber-800 border-amber-200',
  'Customs Hold':              'bg-red-100 text-red-700 border-red-300',
  'Customs Cleared':           'bg-lime-100 text-lime-800 border-lime-200',
  'Arrived at Sorting':        'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Ready for Collection':      'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Collected':                 'bg-emerald-100 text-emerald-800 border-emerald-200',
  // ── Outstation extra stages ──────────────────────────────────────────────
  'At Distribution Centre':    'bg-teal-100 text-teal-700 border-teal-200',
  'Inland Transfer':           'bg-sky-100 text-sky-700 border-sky-200',
  'Arrived at Local Branch':   'bg-cyan-100 text-cyan-700 border-cyan-200',
  // ── Delivery ─────────────────────────────────────────────────────────────
  'Hub Inbound':               'bg-teal-100 text-teal-800 border-teal-200',
  'DRS Assigned':              'bg-lime-100 text-lime-800 border-lime-200',
  'Out for Delivery':          'bg-green-100 text-green-800 border-green-200',
  'Delivered':                 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Non-Delivery':              'bg-red-100 text-red-800 border-red-200',
  'On Hold':                   'bg-orange-100 text-orange-800 border-orange-200',
}

export const PRS_STATUS_COLORS = {
  Pending:   'bg-slate-100 text-slate-700',
  Proceed:   'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
}

export const SERVICE_TYPES = ['Standard', 'Express', 'International']
export const PAYMENT_TYPES = ['Prepaid', 'Cash', 'Credit', 'COD']
export const BILL_TO_OPTIONS = ['Sender', 'Receiver', 'Third Party']

export const CITIES_BY_COUNTRY = {
  'Zambia':       ['Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Livingstone', 'Chipata', 'Solwezi', 'Kasama', 'Mongu', 'Mansa', 'Chingola', 'Mufulira', 'Luanshya', 'Choma', 'Mazabuka'],
  'Zimbabwe':     ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Hwange', 'Bindura'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley'],
  'Tanzania':     ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Mbeya', 'Morogoro', 'Tanga', 'Zanzibar', 'Kigoma', 'Tabora'],
  'Kenya':        ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Malindi', 'Kitale'],
  'China':        ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Nanjing', "Xi'an", 'Chongqing', 'Tianjin', 'Dongguan', 'Foshan', 'Ningbo', 'Hong Kong'],
  'UAE':          ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'UK':           ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh', 'Glasgow', 'Cardiff'],
  'India':        ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'],
  'USA':          ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'Dallas', 'San Antonio', 'San Diego', 'Austin'],
}
export const CITIES = CITIES_BY_COUNTRY['Zambia']
export const COUNTRIES = Object.keys(CITIES_BY_COUNTRY)
export const HUBS = [
  'Lusaka Hub', 'Ndola Hub', 'Kitwe Hub', 'Livingstone Hub',
  'Chipata Hub', 'Solwezi Hub', 'Kasama Hub',
]
export const INTL_DESTINATIONS = [
  'Hong Kong', 'Shenzhen', 'Guangzhou', 'Beijing', 'Shanghai',
  'Dubai', 'Abu Dhabi',
  'Johannesburg', 'Cape Town', 'Nairobi', 'Dar es Salaam',
  'London', 'Manchester',
  'New York', 'Los Angeles', 'Chicago',
  'Mumbai', 'Delhi',
]
export const ROUTE_CODES = ['RT-LSK-01', 'RT-LSK-02', 'RT-CBE-01', 'RT-NDL-01', 'RT-KWE-01', 'RT-LVI-01']
export const DRIVERS = ['Mulenga Phiri', 'Chanda Mutale', 'Bwalya Tembo', 'Mumba Banda', 'Kaputa Mwansa', 'Sikaile Mwila']
export const TRANSPORTERS = ['Zampost Logistics', 'Trans-Zambezi Freight', 'Eagle Express Zambia', 'Speed Wings Cargo', 'DPEX Zambia']
export const NDR_REASONS = [
  'Recipient not available',
  'Wrong address',
  'Refused delivery',
  'Access denied / gated community',
  'Address not found',
  'Customer requested reschedule',
  'Damaged package — not accepted',
]
