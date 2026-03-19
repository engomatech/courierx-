import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_COUNTRIES = [
  { id: 'C001', name: 'United States',        code: 'US', status: 'Active' },
  { id: 'C002', name: 'United Kingdom',       code: 'GB', status: 'Active' },
  { id: 'C003', name: 'United Arab Emirates', code: 'AE', status: 'Active' },
  { id: 'C004', name: 'Canada',               code: 'CA', status: 'Active' },
  { id: 'C005', name: 'Australia',            code: 'AU', status: 'Active' },
  { id: 'C006', name: 'Germany',              code: 'DE', status: 'Active' },
  { id: 'C007', name: 'France',               code: 'FR', status: 'Active' },
  { id: 'C008', name: 'India',                code: 'IN', status: 'Active' },
  { id: 'C009', name: 'Zambia',               code: 'ZM', status: 'Active' },
  { id: 'C010', name: 'South Africa',         code: 'ZA', status: 'Active' },
  { id: 'C011', name: 'Kenya',                code: 'KE', status: 'Active' },
  { id: 'C012', name: 'Tanzania',             code: 'TZ', status: 'Active' },
]

const SEED_STATES = [
  { id: 'S001', name: 'New York',       countryId: 'C001', code: 'NY', status: 'Active' },
  { id: 'S002', name: 'California',     countryId: 'C001', code: 'CA', status: 'Active' },
  { id: 'S003', name: 'Illinois',       countryId: 'C001', code: 'IL', status: 'Active' },
  { id: 'S004', name: 'Texas',          countryId: 'C001', code: 'TX', status: 'Active' },
  { id: 'S005', name: 'Arizona',        countryId: 'C001', code: 'AZ', status: 'Active' },
  { id: 'S006', name: 'Pennsylvania',   countryId: 'C001', code: 'PA', status: 'Active' },
  { id: 'S007', name: 'England',        countryId: 'C002', code: 'ENG', status: 'Active' },
  { id: 'S008', name: 'Scotland',       countryId: 'C002', code: 'SCT', status: 'Active' },
  { id: 'S009', name: 'Dubai',          countryId: 'C003', code: 'DXB', status: 'Active' },
  { id: 'S010', name: 'Abu Dhabi',      countryId: 'C003', code: 'AUH', status: 'Active' },
  { id: 'S011', name: 'Ontario',        countryId: 'C004', code: 'ON', status: 'Active' },
  { id: 'S012', name: 'British Columbia', countryId: 'C004', code: 'BC', status: 'Active' },
  { id: 'S013', name: 'New South Wales', countryId: 'C005', code: 'NSW', status: 'Active' },
  { id: 'S014', name: 'Victoria',       countryId: 'C005', code: 'VIC', status: 'Active' },
  { id: 'S015', name: 'Bavaria',        countryId: 'C006', code: 'BAV', status: 'Active' },
  { id: 'S016', name: 'Île-de-France',  countryId: 'C007', code: 'IDF', status: 'Active' },
  { id: 'S017', name: 'Maharashtra',           countryId: 'C008', code: 'MH',  status: 'Active' },
  { id: 'S018', name: 'Karnataka',             countryId: 'C008', code: 'KA',  status: 'Active' },
  // Zambia — 10 Provinces (ISO 3166-2:ZM)
  { id: 'S019', name: 'Lusaka Province',       countryId: 'C009', code: 'LS',  status: 'Active' },
  { id: 'S020', name: 'Copperbelt Province',   countryId: 'C009', code: 'CB',  status: 'Active' },
  { id: 'S021', name: 'Central Province',      countryId: 'C009', code: 'CE',  status: 'Active' },
  { id: 'S022', name: 'Eastern Province',      countryId: 'C009', code: 'EA',  status: 'Active' },
  { id: 'S023', name: 'Luapula Province',      countryId: 'C009', code: 'LU',  status: 'Active' },
  { id: 'S024', name: 'Muchinga Province',     countryId: 'C009', code: 'MU',  status: 'Active' },
  { id: 'S025', name: 'North-Western Province',countryId: 'C009', code: 'NW',  status: 'Active' },
  { id: 'S026', name: 'Northern Province',     countryId: 'C009', code: 'NR',  status: 'Active' },
  { id: 'S027', name: 'Southern Province',     countryId: 'C009', code: 'SP',  status: 'Active' },
  { id: 'S028', name: 'Western Province',      countryId: 'C009', code: 'WE',  status: 'Active' },
  // Other African countries
  { id: 'S029', name: 'Gauteng',               countryId: 'C010', code: 'GP',  status: 'Active' },
  { id: 'S030', name: 'Western Cape',          countryId: 'C010', code: 'WC',  status: 'Active' },
  { id: 'S031', name: 'Nairobi County',        countryId: 'C011', code: 'NBI', status: 'Active' },
  { id: 'S032', name: 'Dar es Salaam',         countryId: 'C012', code: 'DSM', status: 'Active' },
]

const SEED_CITIES = [
  { id: 'CI001', name: 'New York City',   stateId: 'S001', countryId: 'C001', status: 'Active' },
  { id: 'CI002', name: 'Buffalo',         stateId: 'S001', countryId: 'C001', status: 'Active' },
  { id: 'CI003', name: 'Los Angeles',     stateId: 'S002', countryId: 'C001', status: 'Active' },
  { id: 'CI004', name: 'San Francisco',   stateId: 'S002', countryId: 'C001', status: 'Active' },
  { id: 'CI005', name: 'Chicago',         stateId: 'S003', countryId: 'C001', status: 'Active' },
  { id: 'CI006', name: 'Naperville',      stateId: 'S003', countryId: 'C001', status: 'Active' },
  { id: 'CI007', name: 'Houston',         stateId: 'S004', countryId: 'C001', status: 'Active' },
  { id: 'CI008', name: 'Dallas',          stateId: 'S004', countryId: 'C001', status: 'Active' },
  { id: 'CI009', name: 'Phoenix',         stateId: 'S005', countryId: 'C001', status: 'Active' },
  { id: 'CI010', name: 'Tucson',          stateId: 'S005', countryId: 'C001', status: 'Active' },
  { id: 'CI011', name: 'Philadelphia',    stateId: 'S006', countryId: 'C001', status: 'Active' },
  { id: 'CI012', name: 'Pittsburgh',      stateId: 'S006', countryId: 'C001', status: 'Active' },
  { id: 'CI013', name: 'London',          stateId: 'S007', countryId: 'C002', status: 'Active' },
  { id: 'CI014', name: 'Manchester',      stateId: 'S007', countryId: 'C002', status: 'Active' },
  { id: 'CI015', name: 'Edinburgh',       stateId: 'S008', countryId: 'C002', status: 'Active' },
  { id: 'CI016', name: 'Dubai City',      stateId: 'S009', countryId: 'C003', status: 'Active' },
  { id: 'CI017', name: 'Abu Dhabi City',  stateId: 'S010', countryId: 'C003', status: 'Active' },
  { id: 'CI018', name: 'Toronto',         stateId: 'S011', countryId: 'C004', status: 'Active' },
  { id: 'CI019', name: 'Ottawa',          stateId: 'S011', countryId: 'C004', status: 'Active' },
  { id: 'CI020', name: 'Vancouver',       stateId: 'S012', countryId: 'C004', status: 'Active' },
  { id: 'CI021', name: 'Sydney',          stateId: 'S013', countryId: 'C005', status: 'Active' },
  { id: 'CI022', name: 'Melbourne',       stateId: 'S014', countryId: 'C005', status: 'Active' },
  { id: 'CI023', name: 'Munich',          stateId: 'S015', countryId: 'C006', status: 'Active' },
  { id: 'CI024', name: 'Paris',           stateId: 'S016', countryId: 'C007', status: 'Active' },
  { id: 'CI025', name: 'Mumbai',          stateId: 'S017', countryId: 'C008', status: 'Active' },
  { id: 'CI026', name: 'Bengaluru',       stateId: 'S018', countryId: 'C008', status: 'Active' },
  // Zambia cities
  { id: 'CI027', name: 'Lusaka',          stateId: 'S019', countryId: 'C009', status: 'Active' },
  { id: 'CI028', name: 'Kitwe',           stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI029', name: 'Ndola',           stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI030', name: 'Kabwe',           stateId: 'S021', countryId: 'C009', status: 'Active' },
  { id: 'CI031', name: 'Chingola',        stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI032', name: 'Mufulira',        stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI033', name: 'Livingstone',     stateId: 'S027', countryId: 'C009', status: 'Active' },
  { id: 'CI034', name: 'Chipata',         stateId: 'S022', countryId: 'C009', status: 'Active' },
  { id: 'CI035', name: 'Kasama',          stateId: 'S026', countryId: 'C009', status: 'Active' },
  { id: 'CI036', name: 'Solwezi',         stateId: 'S025', countryId: 'C009', status: 'Active' },
  { id: 'CI037', name: 'Mansa',           stateId: 'S023', countryId: 'C009', status: 'Active' },
  { id: 'CI038', name: 'Mongu',           stateId: 'S028', countryId: 'C009', status: 'Active' },
  { id: 'CI039', name: 'Chinsali',        stateId: 'S024', countryId: 'C009', status: 'Active' },
  { id: 'CI040', name: 'Chililabombwe',   stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI041', name: 'Luanshya',        stateId: 'S020', countryId: 'C009', status: 'Active' },
  { id: 'CI042', name: 'Mazabuka',        stateId: 'S027', countryId: 'C009', status: 'Active' },
  { id: 'CI043', name: 'Kafue',           stateId: 'S019', countryId: 'C009', status: 'Active' },
  { id: 'CI044', name: 'Chilenge',        stateId: 'S019', countryId: 'C009', status: 'Active' },
  // African cities
  { id: 'CI045', name: 'Johannesburg',    stateId: 'S029', countryId: 'C010', status: 'Active' },
  { id: 'CI046', name: 'Cape Town',       stateId: 'S030', countryId: 'C010', status: 'Active' },
  { id: 'CI047', name: 'Nairobi',         stateId: 'S031', countryId: 'C011', status: 'Active' },
  { id: 'CI048', name: 'Dar es Salaam',   stateId: 'S032', countryId: 'C012', status: 'Active' },
]

const SEED_PINCODES = [
  { id: 'P001', code: '10001', cityId: 'CI001', stateId: 'S001', countryId: 'C001', status: 'Active' },
  { id: 'P002', code: '10002', cityId: 'CI001', stateId: 'S001', countryId: 'C001', status: 'Active' },
  { id: 'P003', code: '90001', cityId: 'CI003', stateId: 'S002', countryId: 'C001', status: 'Active' },
  { id: 'P004', code: '90002', cityId: 'CI003', stateId: 'S002', countryId: 'C001', status: 'Active' },
  { id: 'P005', code: '60601', cityId: 'CI005', stateId: 'S003', countryId: 'C001', status: 'Active' },
  { id: 'P006', code: '77001', cityId: 'CI007', stateId: 'S004', countryId: 'C001', status: 'Active' },
  { id: 'P007', code: '85001', cityId: 'CI009', stateId: 'S005', countryId: 'C001', status: 'Active' },
  { id: 'P008', code: '19101', cityId: 'CI011', stateId: 'S006', countryId: 'C001', status: 'Active' },
  { id: 'P009', code: 'SW1A 1AA', cityId: 'CI013', stateId: 'S007', countryId: 'C002', status: 'Active' },
  { id: 'P010', code: 'M1 1AE',   cityId: 'CI014', stateId: 'S007', countryId: 'C002', status: 'Active' },
  { id: 'P011', code: '00000',    cityId: 'CI016', stateId: 'S009', countryId: 'C003', status: 'Active' },
  { id: 'P012', code: 'M5V 2T6',  cityId: 'CI018', stateId: 'S011', countryId: 'C004', status: 'Active' },
]

const SEED_INT_ZONES = [
  {
    id: 'IZ001', name: 'Zone A — Tier 1', code: 'INT-A',
    countries: ['C001', 'C004', 'C002', 'C005'], status: 'Active',
    description: 'North America, UK, Australia',
  },
  {
    id: 'IZ002', name: 'Zone B — Europe', code: 'INT-B',
    countries: ['C006', 'C007'], status: 'Active',
    description: 'Central Europe',
  },
  {
    id: 'IZ003', name: 'Zone C — Middle East & Asia', code: 'INT-C',
    countries: ['C003', 'C008'], status: 'Active',
    description: 'UAE, India',
  },
  {
    id: 'IZ004', name: 'Zone D — Africa', code: 'INT-D',
    countries: ['C009', 'C010', 'C011', 'C012'], status: 'Active',
    description: 'Zambia, South Africa, Kenya, Tanzania',
  },
]

const SEED_DOM_ZONES = [
  {
    id: 'DZ001', name: 'Zone 1 — East Coast', code: 'DOM-1',
    cities: ['CI001', 'CI002', 'CI011', 'CI012'], status: 'Active',
    description: 'New York, Philadelphia area',
  },
  {
    id: 'DZ002', name: 'Zone 2 — West Coast', code: 'DOM-2',
    cities: ['CI003', 'CI004', 'CI009', 'CI010'], status: 'Active',
    description: 'LA, San Francisco, Phoenix area',
  },
  {
    id: 'DZ003', name: 'Zone 3 — Central', code: 'DOM-3',
    cities: ['CI005', 'CI006', 'CI007', 'CI008'], status: 'Active',
    description: 'Chicago, Houston, Dallas area',
  },
  {
    id: 'DZ004', name: 'Zone 4 — Lusaka Metro', code: 'DOM-4',
    cities: ['CI027', 'CI043', 'CI044'], status: 'Active',
    description: 'Lusaka, Kafue, Chilenge',
  },
  {
    id: 'DZ005', name: 'Zone 5 — Copperbelt', code: 'DOM-5',
    cities: ['CI028', 'CI029', 'CI031', 'CI032', 'CI040', 'CI041'], status: 'Active',
    description: 'Kitwe, Ndola, Chingola, Mufulira, Chililabombwe, Luanshya',
  },
  {
    id: 'DZ006', name: 'Zone 6 — Regional', code: 'DOM-6',
    cities: ['CI030', 'CI033', 'CI034', 'CI035', 'CI036', 'CI037', 'CI038', 'CI039', 'CI042'], status: 'Active',
    description: 'Kabwe, Livingstone, Chipata, Kasama, Solwezi, Mansa, Mongu, Chinsali, Mazabuka',
  },
]

const SEED_SERVICES = [
  {
    id: 'SV001', name: 'Domestic Standard', code: 'DOM-STD',
    mode: 'Domestic', productType: 'Parcel', deliveryType: 'Standard',
    deliveryDays: '3–5', codSupport: true,
    minWeight: 0.1, maxWeight: 30, status: 'Active',
  },
  {
    id: 'SV002', name: 'Domestic Express', code: 'DOM-EXP',
    mode: 'Domestic', productType: 'Parcel', deliveryType: 'Express',
    deliveryDays: '1–2', codSupport: true,
    minWeight: 0.1, maxWeight: 20, status: 'Active',
  },
  {
    id: 'SV003', name: 'Domestic Document', code: 'DOM-DOC',
    mode: 'Domestic', productType: 'Document', deliveryType: 'Standard',
    deliveryDays: '2–4', codSupport: false,
    minWeight: 0.01, maxWeight: 2, status: 'Active',
  },
  {
    id: 'SV004', name: 'International Economy', code: 'INT-ECO',
    mode: 'International', productType: 'Parcel', deliveryType: 'Standard',
    deliveryDays: '7–14', codSupport: false,
    minWeight: 0.1, maxWeight: 70, status: 'Active',
  },
  {
    id: 'SV005', name: 'International Express', code: 'INT-EXP',
    mode: 'International', productType: 'Parcel', deliveryType: 'Express',
    deliveryDays: '2–4', codSupport: false,
    minWeight: 0.1, maxWeight: 30, status: 'Active',
  },
  {
    id: 'SV006', name: 'Freight Standard', code: 'FRT-STD',
    mode: 'Domestic', productType: 'Freight', deliveryType: 'Standard',
    deliveryDays: '5–10', codSupport: false,
    minWeight: 30, maxWeight: 500, status: 'Active',
  },
]

// Pricing: serviceId → { slabs: [{min,max,rates:{zoneId:price}}], extraKgRates:{zoneId:price} }
const SEED_PRICING = {
  'SV001': {
    slabs: [
      { id: 'sl1', min: 0, max: 1, rates: { 'DZ001': 8, 'DZ002': 10, 'DZ003': 9 } },
      { id: 'sl2', min: 1.01, max: 2, rates: { 'DZ001': 12, 'DZ002': 15, 'DZ003': 13 } },
      { id: 'sl3', min: 2.01, max: 5, rates: { 'DZ001': 18, 'DZ002': 22, 'DZ003': 20 } },
      { id: 'sl4', min: 5.01, max: 10, rates: { 'DZ001': 28, 'DZ002': 35, 'DZ003': 30 } },
    ],
    extraKgRates: { 'DZ001': 2.5, 'DZ002': 3.5, 'DZ003': 3.0 },
  },
  'SV004': {
    slabs: [
      { id: 'sl1', min: 0, max: 1, rates: { 'IZ001': 25, 'IZ002': 35, 'IZ003': 45 } },
      { id: 'sl2', min: 1.01, max: 2, rates: { 'IZ001': 35, 'IZ002': 50, 'IZ003': 60 } },
      { id: 'sl3', min: 2.01, max: 5, rates: { 'IZ001': 60, 'IZ002': 80, 'IZ003': 95 } },
    ],
    extraKgRates: { 'IZ001': 8, 'IZ002': 12, 'IZ003': 15 },
  },
}

const SEED_SETTINGS = {
  general: {
    companyName: 'Online Express Logistics', companyAddress: '100 Logistics Blvd, New York, NY 10001',
    phone: '+1-212-555-0100', fax: '+1-212-555-0101', email: 'info@onlineexpress.com',
    lat: '40.7128', lng: '-74.0060', logo: '', printLogo: '',
  },
  system: {
    defaultCountry: 'C001', defaultCurrency: 'USD', currencySymbol: '$',
    timezone: 'America/New_York', rowsPerPage: '15', supportBy: 'Postal / PIN / Zip Code',
  },
  shipment: {
    awbPrefix: 'CX', volumetricDivisor: '5000', defaultWeight: '0.5',
    trackingEnabled: true, codEnabled: true, insuranceEnabled: false, signatureRequired: false,
  },
  account: {
    taxName: 'VAT', taxNumber: 'US-123456789', taxRate: '0',
    registrationNumber: 'REG-2024-001', bankName: '', bankAccount: '', bankRoutingNo: '',
  },
  carriers: [
    { id: 'CR001', name: 'DHL Express',         apiKey: '', trackUrl: 'https://dhl.com/track',  createShipmentUrl: '', status: 'Inactive', accountNo: '', entityId: '', entityPin: '', username: '', password: '' },
    { id: 'CR002', name: 'Track17',             apiKey: '', trackUrl: 'https://17track.net',     createShipmentUrl: '', status: 'Inactive', accountNo: '', entityId: '', entityPin: '', username: '', password: '' },
    { id: 'CR003', name: 'FedEx',               apiKey: '', trackUrl: 'https://fedex.com/track', createShipmentUrl: '', status: 'Inactive', accountNo: '', entityId: '', entityPin: '', username: '', password: '' },
    { id: 'CR004', name: 'DPEX / Online Express', apiKey: '', trackUrl: 'https://api.dpex.com', createShipmentUrl: 'https://onlineexpressdev.shop/api/developer/V1/CreateShipment', status: 'Active', accountNo: '', entityId: '', entityPin: '', username: '', password: '' },
    { id: 'CR005', name: 'MailAmericas', apiKey: '', trackUrl: 'https://api.mailamericas.com', createShipmentUrl: 'https://shipping.mailamericas.com/api/v1/admission', eventsUrl: 'https://api.mailamericas.com/api/v1/provider/events', status: 'Active', accountNo: '', entityId: '', entityPin: '', username: '', password: '' },
  ],
  smtp: {
    host: 'smtp.mailgun.org', port: '587', username: 'postmaster@onlineexpress.com',
    password: '••••••••', encryption: 'TLS', fromName: 'Online Express', fromEmail: 'noreply@onlineexpress.com',
  },
  payment: {
    stripeEnabled: false, stripePublicKey: '', stripeSecretKey: '',
    paypalEnabled: false, paypalClientId: '', paypalSecret: '',
  },
  social: {
    facebook: 'https://facebook.com/onlineexpress', twitter: '', instagram: 'https://instagram.com/onlineexpress',
    linkedin: 'https://linkedin.com/company/onlineexpress', youtube: '',
  },
  emailTemplates: [
    { id: 'ET001', name: 'Shipment Booked', subject: 'Your shipment {{AWB}} has been booked', body: 'Dear {{Customer}},\n\nYour shipment with AWB {{AWB}} has been successfully booked.\n\nThank you for using Online Express.', status: 'Active' },
    { id: 'ET002', name: 'Out for Delivery', subject: 'Your shipment {{AWB}} is out for delivery', body: 'Dear {{Customer}},\n\nYour shipment is on its way! Expected delivery today.\n\nTracking: {{AWB}}', status: 'Active' },
    { id: 'ET003', name: 'Delivered', subject: 'Shipment {{AWB}} delivered successfully', body: 'Dear {{Customer}},\n\nYour shipment {{AWB}} has been delivered.\n\nThank you for using Online Express!', status: 'Active' },
    { id: 'ET004', name: 'NDR Alert', subject: 'Delivery attempt failed for {{AWB}}', body: 'Dear {{Customer}},\n\nWe attempted to deliver your shipment {{AWB}} but were unsuccessful.\n\nReason: {{NDR_Reason}}', status: 'Active' },
  ],
  smsTemplates: [
    { id: 'SM001', name: 'Shipment Booked SMS', body: 'Online Express: Your shipment AWB {{AWB}} is booked. Track at onlineexpress.com', status: 'Active' },
    { id: 'SM002', name: 'Out for Delivery SMS', body: 'Online Express: Your parcel {{AWB}} is out for delivery today. Driver: {{Driver}}', status: 'Active' },
    { id: 'SM003', name: 'Delivered SMS', body: 'Online Express: AWB {{AWB}} delivered. Thank you for shipping with us!', status: 'Active' },
    { id: 'SM004', name: 'NDR SMS', body: 'Online Express: Delivery failed for {{AWB}}. Reason: {{Reason}}. We will retry.', status: 'Active' },
  ],
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAdminStore = create(
  persist(
    (set, get) => ({
      countries:   SEED_COUNTRIES,
      states:      SEED_STATES,
      cities:      SEED_CITIES,
      pincodes:    SEED_PINCODES,
      intZones:    SEED_INT_ZONES,
      domZones:    SEED_DOM_ZONES,
      services:    SEED_SERVICES,
      pricing:     SEED_PRICING,
      settings:    SEED_SETTINGS,

      // ── Countries ─────────────────────────────────────────────────
      addCountry:    (d) => set((s) => ({ countries: [...s.countries, { id: uid('C'), status: 'Active', ...d }] })),
      updateCountry: (id, d) => set((s) => ({ countries: s.countries.map((c) => c.id === id ? { ...c, ...d } : c) })),
      deleteCountry: (id) => set((s) => ({ countries: s.countries.filter((c) => c.id !== id) })),
      bulkImportCountries: (rows) => {
        const existing = get().countries; let imported = 0, skipped = 0; const toAdd = []
        for (const r of rows) {
          const name = r['Country Name'] || r['name'] || ''
          const code = (r['ISO Code (Alpha-2)'] || r['ISO Code'] || r['code'] || '').toUpperCase().trim()
          if (!name || !code) { skipped++; continue }
          if (existing.find((c) => c.code === code) || toAdd.find((c) => c.code === code)) { skipped++; continue }
          toAdd.push({ id: uid('C'), name, code, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ countries: [...s.countries, ...toAdd] }))
        return { imported, skipped }
      },

      // ── States ────────────────────────────────────────────────────
      addState:    (d) => set((s) => ({ states: [...s.states, { id: uid('S'), status: 'Active', ...d }] })),
      updateState: (id, d) => set((s) => ({ states: s.states.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteState: (id) => set((s) => ({ states: s.states.filter((x) => x.id !== id) })),
      bulkImportStates: (rows) => {
        const { countries, states } = get(); let imported = 0, skipped = 0; const toAdd = []
        for (const r of rows) {
          const countryCode = (r['Country ISO Code'] || r['countryCode'] || '').toUpperCase().trim()
          const name  = r['Province/State Name'] || r['State Name'] || r['name'] || ''
          const code  = (r['State Code'] || r['code'] || '').toUpperCase().trim()
          const country = countries.find((c) => c.code === countryCode)
          if (!country || !name) { skipped++; continue }
          if (states.find((s) => s.countryId === country.id && s.code === code) || toAdd.find((s) => s.countryId === country.id && s.code === code)) { skipped++; continue }
          toAdd.push({ id: uid('S'), name, code, countryId: country.id, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ states: [...s.states, ...toAdd] }))
        return { imported, skipped }
      },

      // ── Cities ────────────────────────────────────────────────────
      addCity:    (d) => set((s) => ({ cities: [...s.cities, { id: uid('CI'), status: 'Active', ...d }] })),
      updateCity: (id, d) => set((s) => ({ cities: s.cities.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteCity: (id) => set((s) => ({ cities: s.cities.filter((x) => x.id !== id) })),
      bulkImportCities: (rows) => {
        const { countries, states, cities } = get(); let imported = 0, skipped = 0; const toAdd = []
        for (const r of rows) {
          const countryCode = (r['Country ISO Code'] || r['countryCode'] || '').toUpperCase().trim()
          const stateCode   = (r['Province/State Code'] || r['State Code'] || r['stateCode'] || '').toUpperCase().trim()
          const name        = r['City Name'] || r['name'] || ''
          const country = countries.find((c) => c.code === countryCode)
          if (!country || !name) { skipped++; continue }
          const state = states.find((s) => s.countryId === country.id && s.code === stateCode)
          if (!state) { skipped++; continue }
          if (cities.find((c) => c.stateId === state.id && c.name.toLowerCase() === name.toLowerCase()) || toAdd.find((c) => c.stateId === state.id && c.name.toLowerCase() === name.toLowerCase())) { skipped++; continue }
          toAdd.push({ id: uid('CI'), name, stateId: state.id, countryId: country.id, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ cities: [...s.cities, ...toAdd] }))
        return { imported, skipped }
      },

      // ── Pincodes ──────────────────────────────────────────────────
      addPincode:    (d) => set((s) => ({ pincodes: [...s.pincodes, { id: uid('P'), status: 'Active', ...d }] })),
      updatePincode: (id, d) => set((s) => ({ pincodes: s.pincodes.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deletePincode: (id) => set((s) => ({ pincodes: s.pincodes.filter((x) => x.id !== id) })),
      bulkImportPincodes: (rows) => {
        const { countries, states, cities, pincodes } = get(); let imported = 0, skipped = 0; const toAdd = []
        for (const r of rows) {
          const countryCode = (r['Country ISO Code'] || '').toUpperCase().trim()
          const stateCode   = (r['Province/State Code'] || r['State Code'] || '').toUpperCase().trim()
          const cityName    = r['City Name'] || ''
          const code        = r['Postal Code'] || r['Pincode'] || r['code'] || ''
          const country = countries.find((c) => c.code === countryCode)
          if (!country || !code) { skipped++; continue }
          const state = states.find((s) => s.countryId === country.id && s.code === stateCode)
          const city  = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase() && c.countryId === country.id)
          if (!state || !city) { skipped++; continue }
          if (pincodes.find((p) => p.code === code && p.cityId === city.id) || toAdd.find((p) => p.code === code && p.cityId === city.id)) { skipped++; continue }
          toAdd.push({ id: uid('P'), code, cityId: city.id, stateId: state.id, countryId: country.id, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ pincodes: [...s.pincodes, ...toAdd] }))
        return { imported, skipped }
      },

      // ── Int Zones ─────────────────────────────────────────────────
      addIntZone:    (d) => set((s) => ({ intZones: [...s.intZones, { id: uid('IZ'), status: 'Active', countries: [], ...d }] })),
      updateIntZone: (id, d) => set((s) => ({ intZones: s.intZones.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteIntZone: (id) => set((s) => ({ intZones: s.intZones.filter((x) => x.id !== id) })),
      bulkImportIntZones: (rows) => {
        const { countries } = get(); let imported = 0, skipped = 0
        const toAdd = []
        for (const r of rows) {
          const name  = r['Zone Name'] || r['name'] || ''
          const code  = (r['Zone Code'] || r['code'] || '').toUpperCase().trim()
          const desc  = r['Description'] || r['description'] || ''
          const isoCodes = (r['Country ISO Codes'] || r['countries'] || '').split('|').map((s) => s.trim().toUpperCase()).filter(Boolean)
          if (!name) { skipped++; continue }
          const countryIds = isoCodes.map((iso) => countries.find((c) => c.code === iso)?.id).filter(Boolean)
          toAdd.push({ id: uid('IZ'), name, code, description: desc, countries: countryIds, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ intZones: [...s.intZones, ...toAdd] }))
        return { imported, skipped }
      },

      // ── Dom Zones ─────────────────────────────────────────────────
      addDomZone:    (d) => set((s) => ({ domZones: [...s.domZones, { id: uid('DZ'), status: 'Active', cities: [], ...d }] })),
      updateDomZone: (id, d) => set((s) => ({ domZones: s.domZones.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteDomZone: (id) => set((s) => ({ domZones: s.domZones.filter((x) => x.id !== id) })),
      bulkImportDomZones: (rows) => {
        const { cities } = get(); let imported = 0, skipped = 0
        const toAdd = []
        for (const r of rows) {
          const name      = r['Zone Name'] || r['name'] || ''
          const code      = (r['Zone Code'] || r['code'] || '').toUpperCase().trim()
          const desc      = r['Description'] || r['description'] || ''
          const cityNames = (r['City Names'] || r['cities'] || '').split('|').map((s) => s.trim()).filter(Boolean)
          if (!name) { skipped++; continue }
          const cityIds = cityNames.map((cn) => cities.find((c) => c.name.toLowerCase() === cn.toLowerCase())?.id).filter(Boolean)
          toAdd.push({ id: uid('DZ'), name, code, description: desc, cities: cityIds, status: r['Status'] || 'Active' }); imported++
        }
        set((s) => ({ domZones: [...s.domZones, ...toAdd] }))
        return { imported, skipped }
      },

      // ── Services ──────────────────────────────────────────────────
      addService:    (d) => set((s) => ({ services: [...s.services, { id: uid('SV'), status: 'Active', ...d }] })),
      updateService: (id, d) => set((s) => ({ services: s.services.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteService: (id) => set((s) => ({ services: s.services.filter((x) => x.id !== id) })),

      // ── Pricing ───────────────────────────────────────────────────
      setPricing: (serviceId, pricingData) =>
        set((s) => ({ pricing: { ...s.pricing, [serviceId]: pricingData } })),
      addPricingSlab: (serviceId, slab) =>
        set((s) => {
          const cur = s.pricing[serviceId] || { slabs: [], extraKgRates: {} }
          return { pricing: { ...s.pricing, [serviceId]: { ...cur, slabs: [...cur.slabs, { id: uid('sl'), ...slab }] } } }
        }),
      updatePricingSlab: (serviceId, slabId, data) =>
        set((s) => {
          const cur = s.pricing[serviceId] || { slabs: [], extraKgRates: {} }
          return {
            pricing: {
              ...s.pricing,
              [serviceId]: { ...cur, slabs: cur.slabs.map((sl) => sl.id === slabId ? { ...sl, ...data } : sl) },
            },
          }
        }),
      deletePricingSlab: (serviceId, slabId) =>
        set((s) => {
          const cur = s.pricing[serviceId] || { slabs: [], extraKgRates: {} }
          return { pricing: { ...s.pricing, [serviceId]: { ...cur, slabs: cur.slabs.filter((sl) => sl.id !== slabId) } } }
        }),
      updateExtraKgRates: (serviceId, rates) =>
        set((s) => {
          const cur = s.pricing[serviceId] || { slabs: [], extraKgRates: {} }
          return { pricing: { ...s.pricing, [serviceId]: { ...cur, extraKgRates: rates } } }
        }),

      // ── Settings ──────────────────────────────────────────────────
      updateSettings: (section, data) =>
        set((s) => ({ settings: { ...s.settings, [section]: { ...s.settings[section], ...data } } })),
      addCarrier: (d) =>
        set((s) => ({ settings: { ...s.settings, carriers: [...s.settings.carriers, { id: uid('CR'), status: 'Active', ...d }] } })),
      updateCarrier: (id, d) =>
        set((s) => ({ settings: { ...s.settings, carriers: s.settings.carriers.map((c) => c.id === id ? { ...c, ...d } : c) } })),
      deleteCarrier: (id) =>
        set((s) => ({ settings: { ...s.settings, carriers: s.settings.carriers.filter((c) => c.id !== id) } })),
      addEmailTemplate: (d) =>
        set((s) => ({ settings: { ...s.settings, emailTemplates: [...s.settings.emailTemplates, { id: uid('ET'), status: 'Active', ...d }] } })),
      updateEmailTemplate: (id, d) =>
        set((s) => ({ settings: { ...s.settings, emailTemplates: s.settings.emailTemplates.map((t) => t.id === id ? { ...t, ...d } : t) } })),
      addSmsTemplate: (d) =>
        set((s) => ({ settings: { ...s.settings, smsTemplates: [...s.settings.smsTemplates, { id: uid('SM'), status: 'Active', ...d }] } })),
      updateSmsTemplate: (id, d) =>
        set((s) => ({ settings: { ...s.settings, smsTemplates: s.settings.smsTemplates.map((t) => t.id === id ? { ...t, ...d } : t) } })),

      resetAdmin: () => set({
        countries: SEED_COUNTRIES, states: SEED_STATES, cities: SEED_CITIES, pincodes: SEED_PINCODES,
        intZones: SEED_INT_ZONES, domZones: SEED_DOM_ZONES, services: SEED_SERVICES,
        pricing: SEED_PRICING, settings: SEED_SETTINGS,
      }),
    }),
    { name: 'online-express-admin-store' }
  )
)
