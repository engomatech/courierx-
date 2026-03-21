/**
 * Online Express API — SQLite Database
 *
 * Opens (or creates) onlineexpress.db in the api/ directory.
 * Tables are created on first run; existing tables are never dropped.
 * Pricing data is seeded once from the same values used in the React adminStore.
 */

const Database = require('better-sqlite3')
const path     = require('path')

const DB_PATH = path.join(__dirname, 'onlineexpress.db')
const db      = new Database(DB_PATH)

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/* ─────────────────────────────────────────────────────────────────────────────
   SCHEMA
───────────────────────────────────────────────────────────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id           TEXT PRIMARY KEY,
    partner_name TEXT    NOT NULL,
    api_key      TEXT    UNIQUE NOT NULL,
    status       TEXT    DEFAULT 'active',
    created_at   TEXT    DEFAULT (datetime('now')),
    last_used_at TEXT,
    total_calls  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS shipments (
    awb                TEXT PRIMARY KEY,
    partner_id         TEXT,
    partner_reference  TEXT,
    status             TEXT    DEFAULT 'Booked',
    service_type       TEXT,
    sender_name        TEXT, sender_phone    TEXT, sender_address TEXT,
    sender_city        TEXT, sender_country  TEXT,
    receiver_name    TEXT, receiver_phone  TEXT, receiver_address TEXT,
    receiver_city    TEXT, receiver_country TEXT,
    weight           REAL,
    length           REAL,
    width            REAL,
    height           REAL,
    quantity         INTEGER DEFAULT 1,
    description      TEXT,
    value            REAL,
    currency         TEXT    DEFAULT 'ZMW',
    created_at       TEXT    DEFAULT (datetime('now')),
    updated_at       TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tracking_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    awb         TEXT    NOT NULL,
    activity    TEXT    NOT NULL,
    details     TEXT,
    status      TEXT,
    city        TEXT,
    date        TEXT,
    time        TEXT,
    new_status  TEXT,
    source      TEXT    DEFAULT 'system',
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (awb) REFERENCES shipments(awb)
  );

  CREATE TABLE IF NOT EXISTS pricing_zones (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    code    TEXT NOT NULL,
    mode    TEXT NOT NULL,     -- 'Domestic' | 'International'
    members TEXT NOT NULL      -- JSON array of cityIds or countryIds
  );

  CREATE TABLE IF NOT EXISTS pricing_services (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    code          TEXT NOT NULL,
    mode          TEXT NOT NULL,
    product_type  TEXT,
    delivery_type TEXT,
    delivery_days TEXT,
    min_weight    REAL,
    max_weight    REAL,
    status        TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS pricing_slabs (
    id          TEXT PRIMARY KEY,
    service_id  TEXT NOT NULL,
    min_weight  REAL NOT NULL,
    max_weight  REAL NOT NULL,
    rates_json  TEXT NOT NULL,       -- JSON { "zoneId": price }
    extra_rates TEXT DEFAULT '{}'    -- JSON { "zoneId": price/kg }
  );

  CREATE TABLE IF NOT EXISTS cities (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    country_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notification_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    awb              TEXT    NOT NULL UNIQUE,
    recipient_name   TEXT    NOT NULL,
    recipient_mobile TEXT,
    notes            TEXT,
    signature_data   TEXT,
    photo_data       TEXT,
    recorded_by      TEXT,
    recorded_at      TEXT    DEFAULT (datetime('now'))
  );
`)

/* ─────────────────────────────────────────────────────────────────────────────
   SEED PRICING DATA (only runs once — checks row count first)
   Data mirrors src/admin/adminStore.js initial values exactly.
───────────────────────────────────────────────────────────────────────────── */
function seedIfEmpty() {
  const zoneCount = db.prepare('SELECT COUNT(*) as n FROM pricing_zones').get().n
  if (zoneCount > 0) return  // already seeded

  // ── Domestic Zones ──────────────────────────────────────────────
  const insertZone = db.prepare(
    'INSERT OR IGNORE INTO pricing_zones (id,name,code,mode,members) VALUES (?,?,?,?,?)'
  )
  const domZones = [
    { id:'DZ001', name:'Zone 1 — East Coast',   code:'DOM-1', cities:['CI001','CI002','CI011','CI012'] },
    { id:'DZ002', name:'Zone 2 — West Coast',   code:'DOM-2', cities:['CI003','CI004','CI009','CI010'] },
    { id:'DZ003', name:'Zone 3 — Central',      code:'DOM-3', cities:['CI005','CI006','CI007','CI008'] },
    { id:'DZ004', name:'Zone 4 — Lusaka Metro', code:'DOM-4', cities:['CI027','CI043','CI044'] },
    { id:'DZ005', name:'Zone 5 — Copperbelt',   code:'DOM-5', cities:['CI028','CI029','CI031','CI032','CI040','CI041'] },
    { id:'DZ006', name:'Zone 6 — Regional',     code:'DOM-6', cities:['CI030','CI033','CI034','CI035','CI036','CI037','CI038','CI039','CI042'] },
  ]
  domZones.forEach(z => insertZone.run(z.id, z.name, z.code, 'Domestic', JSON.stringify(z.cities)))

  // ── International Zones ─────────────────────────────────────────
  const intZones = [
    { id:'IZ001', name:'Zone A — Tier 1',            code:'INT-A', countries:['C001','C004','C002','C005'] },
    { id:'IZ002', name:'Zone B — Europe',            code:'INT-B', countries:['C006','C007'] },
    { id:'IZ003', name:'Zone C — Middle East & Asia',code:'INT-C', countries:['C003','C008'] },
    { id:'IZ004', name:'Zone D — Africa',            code:'INT-D', countries:['C009','C010','C011','C012'] },
  ]
  intZones.forEach(z => insertZone.run(z.id, z.name, z.code, 'International', JSON.stringify(z.countries)))

  // ── Services ─────────────────────────────────────────────────────
  const insertSvc = db.prepare(
    'INSERT OR IGNORE INTO pricing_services (id,name,code,mode,product_type,delivery_type,delivery_days,min_weight,max_weight,status) VALUES (?,?,?,?,?,?,?,?,?,?)'
  )
  const services = [
    { id:'SV001', name:'Domestic Standard',     code:'DOM-STD', mode:'Domestic',      pt:'Parcel',   dt:'Standard', days:'3–5',  min:0.1,  max:30  },
    { id:'SV002', name:'Domestic Express',      code:'DOM-EXP', mode:'Domestic',      pt:'Parcel',   dt:'Express',  days:'1–2',  min:0.1,  max:20  },
    { id:'SV003', name:'Domestic Document',     code:'DOM-DOC', mode:'Domestic',      pt:'Document', dt:'Standard', days:'2–4',  min:0.01, max:2   },
    { id:'SV004', name:'International Economy', code:'INT-ECO', mode:'International', pt:'Parcel',   dt:'Standard', days:'7–14', min:0.1,  max:70  },
    { id:'SV005', name:'International Express', code:'INT-EXP', mode:'International', pt:'Parcel',   dt:'Express',  days:'2–4',  min:0.1,  max:30  },
    { id:'SV006', name:'Freight Standard',      code:'FRT-STD', mode:'Domestic',      pt:'Freight',  dt:'Standard', days:'5–10', min:30,   max:500 },
  ]
  services.forEach(s => insertSvc.run(s.id, s.name, s.code, s.mode, s.pt, s.dt, s.days, s.min, s.max, 'Active'))

  // ── Pricing Slabs ────────────────────────────────────────────────
  const insertSlab = db.prepare(
    'INSERT OR IGNORE INTO pricing_slabs (id,service_id,min_weight,max_weight,rates_json,extra_rates) VALUES (?,?,?,?,?,?)'
  )
  // SV001 — Domestic Standard
  insertSlab.run('SV001-sl1','SV001',0,    1,    JSON.stringify({'DZ001':8,  'DZ002':10, 'DZ003':9 }), JSON.stringify({'DZ001':2.5,'DZ002':3.5,'DZ003':3.0}))
  insertSlab.run('SV001-sl2','SV001',1.01, 2,    JSON.stringify({'DZ001':12, 'DZ002':15, 'DZ003':13}), JSON.stringify({'DZ001':2.5,'DZ002':3.5,'DZ003':3.0}))
  insertSlab.run('SV001-sl3','SV001',2.01, 5,    JSON.stringify({'DZ001':18, 'DZ002':22, 'DZ003':20}), JSON.stringify({'DZ001':2.5,'DZ002':3.5,'DZ003':3.0}))
  insertSlab.run('SV001-sl4','SV001',5.01, 10,   JSON.stringify({'DZ001':28, 'DZ002':35, 'DZ003':30}), JSON.stringify({'DZ001':2.5,'DZ002':3.5,'DZ003':3.0}))
  // SV001 — Domestic Standard (Zambian zones DZ004/DZ005/DZ006 — ZMW)
  insertSlab.run('SV001-zm1','SV001',0,    1,    JSON.stringify({'DZ004':25, 'DZ005':35, 'DZ006':45}), JSON.stringify({'DZ004':5, 'DZ005':6, 'DZ006':8}))
  insertSlab.run('SV001-zm2','SV001',1.01, 2,    JSON.stringify({'DZ004':35, 'DZ005':50, 'DZ006':65}), JSON.stringify({'DZ004':5, 'DZ005':6, 'DZ006':8}))
  insertSlab.run('SV001-zm3','SV001',2.01, 5,    JSON.stringify({'DZ004':55, 'DZ005':75, 'DZ006':95}), JSON.stringify({'DZ004':5, 'DZ005':6, 'DZ006':8}))
  insertSlab.run('SV001-zm4','SV001',5.01, 10,   JSON.stringify({'DZ004':90, 'DZ005':120,'DZ006':155}),JSON.stringify({'DZ004':5, 'DZ005':6, 'DZ006':8}))
  // SV002 — Domestic Express (Zambian zones)
  insertSlab.run('SV002-zm1','SV002',0,    1,    JSON.stringify({'DZ004':45, 'DZ005':60, 'DZ006':80}), JSON.stringify({'DZ004':8, 'DZ005':10,'DZ006':12}))
  insertSlab.run('SV002-zm2','SV002',1.01, 2,    JSON.stringify({'DZ004':65, 'DZ005':85, 'DZ006':110}),JSON.stringify({'DZ004':8, 'DZ005':10,'DZ006':12}))
  insertSlab.run('SV002-zm3','SV002',2.01, 5,    JSON.stringify({'DZ004':95, 'DZ005':125,'DZ006':165}),JSON.stringify({'DZ004':8, 'DZ005':10,'DZ006':12}))
  insertSlab.run('SV002-zm4','SV002',5.01, 20,   JSON.stringify({'DZ004':155,'DZ005':200,'DZ006':260}),JSON.stringify({'DZ004':8, 'DZ005':10,'DZ006':12}))
  // SV003 — Domestic Document (Zambian zones)
  insertSlab.run('SV003-zm1','SV003',0,    0.5,  JSON.stringify({'DZ004':20, 'DZ005':28, 'DZ006':38}), JSON.stringify({'DZ004':5, 'DZ005':7, 'DZ006':9}))
  insertSlab.run('SV003-zm2','SV003',0.5,  1,    JSON.stringify({'DZ004':28, 'DZ005':38, 'DZ006':50}), JSON.stringify({'DZ004':5, 'DZ005':7, 'DZ006':9}))
  insertSlab.run('SV003-zm3','SV003',1.01, 2,    JSON.stringify({'DZ004':38, 'DZ005':50, 'DZ006':65}), JSON.stringify({'DZ004':5, 'DZ005':7, 'DZ006':9}))
  // SV004 — International Economy
  insertSlab.run('SV004-sl1','SV004',0,    1,    JSON.stringify({'IZ001':25, 'IZ002':35, 'IZ003':45}), JSON.stringify({'IZ001':8, 'IZ002':12, 'IZ003':15}))
  insertSlab.run('SV004-sl2','SV004',1.01, 2,    JSON.stringify({'IZ001':35, 'IZ002':50, 'IZ003':60}), JSON.stringify({'IZ001':8, 'IZ002':12, 'IZ003':15}))
  insertSlab.run('SV004-sl3','SV004',2.01, 5,    JSON.stringify({'IZ001':60, 'IZ002':80, 'IZ003':95}), JSON.stringify({'IZ001':8, 'IZ002':12, 'IZ003':15}))

  // ── Cities (Zambian cities for zone lookup by name) ──────────────
  const insertCity = db.prepare(
    'INSERT OR IGNORE INTO cities (id,name,country_id) VALUES (?,?,?)'
  )
  const zambianCities = [
    ['CI027','Lusaka','CZ001'],   ['CI028','Kitwe','CZ001'],    ['CI029','Ndola','CZ001'],
    ['CI030','Kabwe','CZ001'],    ['CI031','Chingola','CZ001'], ['CI032','Mufulira','CZ001'],
    ['CI033','Livingstone','CZ001'], ['CI034','Chipata','CZ001'], ['CI035','Kasama','CZ001'],
    ['CI036','Solwezi','CZ001'],  ['CI037','Mansa','CZ001'],    ['CI038','Mongu','CZ001'],
    ['CI039','Chinsali','CZ001'], ['CI040','Chililabombwe','CZ001'], ['CI041','Luanshya','CZ001'],
    ['CI042','Mazabuka','CZ001'], ['CI043','Kafue','CZ001'],    ['CI044','Chilenge','CZ001'],
  ]
  zambianCities.forEach(c => insertCity.run(c[0], c[1], c[2]))

  console.log('[db] Pricing data seeded.')
}

// Schema migrations — safe to run on every startup (caught if column already exists)
const migrations = [
  'ALTER TABLE shipments ADD COLUMN partner_reference TEXT',
  'ALTER TABLE shipments ADD COLUMN sender_email TEXT',
  'ALTER TABLE shipments ADD COLUMN receiver_email TEXT',
]
migrations.forEach(sql => {
  try { db.exec(sql) } catch (_) { /* column already exists — safe to ignore */ }
})

seedIfEmpty()
seedPartnerKeys()

module.exports = db

/* ─────────────────────────────────────────────────────────────────────────────
   SEED PARTNER API KEYS
   Pre-creates API keys for known partners so they appear in the admin UI
   immediately after the first server start. Keys are only inserted if they
   don't already exist (INSERT OR IGNORE).
───────────────────────────────────────────────────────────────────────────── */
function seedPartnerKeys() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO api_keys (id, partner_name, api_key, status, created_at)
    VALUES (?, ?, ?, 'active', datetime('now'))
  `)

  const partners = [
    {
      id          : 'KEY_MAILAMERICAS_001',
      partner_name: 'MailAmericas',
      api_key     : 'cx_live_mla_' + Buffer.from('mailamericas-oe-zambia').toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 24),
    },
  ]

  partners.forEach(p => {
    insert.run(p.id, p.partner_name, p.api_key)
  })
}
