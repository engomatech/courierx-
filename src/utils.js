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

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
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
  'Booked':            'bg-blue-100 text-blue-800 border-blue-200',
  'Confirmed':         'bg-sky-100 text-sky-800 border-sky-200',
  'PRS Assigned':      'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Out for Pickup':    'bg-orange-100 text-orange-800 border-orange-200',
  'Picked Up':         'bg-amber-100 text-amber-800 border-amber-200',
  'Origin Scanned':    'bg-purple-100 text-purple-800 border-purple-200',
  'Bagged':            'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Manifested':        'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Hub Inbound':       'bg-teal-100 text-teal-800 border-teal-200',
  'DRS Assigned':      'bg-lime-100 text-lime-800 border-lime-200',
  'Out for Delivery':  'bg-green-100 text-green-800 border-green-200',
  'Delivered':         'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Non-Delivery':      'bg-red-100 text-red-800 border-red-200',
}

export const PRS_STATUS_COLORS = {
  Pending:   'bg-slate-100 text-slate-700',
  Proceed:   'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
}

export const SERVICE_TYPES = ['Standard', 'Express', 'International']
export const PAYMENT_TYPES = ['Prepaid', 'Cash', 'Credit', 'COD']
export const BILL_TO_OPTIONS = ['Sender', 'Receiver', 'Third Party']

export const CITIES = [
  'Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Livingstone',
  'Chipata', 'Solwezi', 'Kasama', 'Mongu', 'Mansa',
  'Chingola', 'Mufulira', 'Luanshya', 'Choma', 'Mazabuka',
]
export const COUNTRIES = ['Zambia', 'Zimbabwe', 'South Africa', 'Tanzania', 'Kenya', 'China', 'UAE', 'UK', 'India', 'USA']
export const HUBS = [
  'Lusaka Hub', 'Ndola Hub', 'Kitwe Hub', 'Livingstone Hub',
  'Chipata Hub', 'Solwezi Hub', 'Kasama Hub',
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
