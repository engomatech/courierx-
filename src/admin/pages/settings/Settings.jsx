import { useState, useEffect, useCallback } from 'react'
import { useAdminStore } from '../../adminStore'
import { useParams } from 'react-router-dom'
import {
  Save, Plus, Edit2, Trash2, Eye, EyeOff, Upload, CheckCircle,
  Database, Download, RefreshCw, Key, Copy, ShieldCheck, ShieldOff,
  AlertCircle, Loader2,
} from 'lucide-react'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, hint, children, cls = '' }) {
  return (
    <div className={cls}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
const inp = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
const sel = `${inp} bg-white`

function SaveBtn({ saved }) {
  return (
    <button type="submit"
      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
      {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
    </button>
  )
}

function useSavedState() {
  const [saved, setSaved] = useState(false)
  const markSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return [saved, markSaved]
}

// ─── General Settings ─────────────────────────────────────────────────────────

function GeneralSettings() {
  const settings        = useAdminStore((s) => s.settings.general)
  const updateSettings  = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => { e.preventDefault(); updateSettings('general', form); markSaved() }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo upload area */}
      <div className="grid grid-cols-2 gap-6">
        {['logo', 'printLogo'].map((key) => (
          <div key={key} className="border-2 border-dashed rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
            <Upload size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">{key === 'logo' ? 'Admin Logo' : 'Print Logo'}</p>
            <p className="text-xs text-slate-400 mt-1">PNG/JPG, 250×60px recommended</p>
            <button type="button" className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium">Upload Image</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Company Name">
          <input className={inp} value={form.companyName} onChange={s('companyName')} placeholder="CourierX Logistics" />
        </Field>
        <Field label="Email Address">
          <input className={inp} type="email" value={form.email} onChange={s('email')} />
        </Field>
        <Field label="Phone Number">
          <input className={inp} value={form.phone} onChange={s('phone')} />
        </Field>
        <Field label="Fax Number">
          <input className={inp} value={form.fax} onChange={s('fax')} />
        </Field>
        <div className="col-span-2">
          <Field label="Company Address">
            <textarea className={`${inp} resize-none`} rows={2} value={form.companyAddress} onChange={s('companyAddress')} />
          </Field>
        </div>
        <Field label="Google Map Latitude" hint="Right-click on Google Maps → What's here?">
          <input className={inp} value={form.lat} onChange={s('lat')} placeholder="40.7128" />
        </Field>
        <Field label="Google Map Longitude">
          <input className={inp} value={form.lng} onChange={s('lng')} placeholder="-74.0060" />
        </Field>
      </div>

      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── System Settings ──────────────────────────────────────────────────────────

function SystemSettings() {
  const settings       = useAdminStore((s) => s.settings.system)
  const countries      = useAdminStore((s) => s.countries)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const CURRENCIES = ['USD - US Dollar ($)', 'GBP - British Pound (£)', 'EUR - Euro (€)', 'AED - UAE Dirham (د.إ)', 'CAD - Canadian Dollar (CA$)', 'AUD - Australian Dollar (A$)', 'INR - Indian Rupee (₹)']
  const TIMEZONES  = ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Australia/Sydney']
  const SUPPORT_BY = ['Postal / PIN / Zip Code', 'City', 'State / Province', 'Hub Zone']

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('system', form); markSaved() }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Default Country">
          <select className={sel} value={form.defaultCountry} onChange={s('defaultCountry')}>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Default Currency">
          <select className={sel} value={form.defaultCurrency} onChange={s('defaultCurrency')}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Default Timezone" hint="All timestamps will use this timezone">
          <select className={sel} value={form.timezone} onChange={s('timezone')}>
            {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Records Per Page" hint="Number of rows shown in tables">
          <input className={inp} type="number" min={5} max={100} value={form.rowsPerPage} onChange={s('rowsPerPage')} />
        </Field>
        <div className="col-span-2">
          <Field label="System Coverage Support By" hint="How serviceable areas are determined">
            <select className={sel} value={form.supportBy} onChange={s('supportBy')}>
              {SUPPORT_BY.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── Shipment Settings ────────────────────────────────────────────────────────

function ShipmentSettings() {
  const settings       = useAdminStore((s) => s.settings.shipment)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const t = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('shipment', form); markSaved() }} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Field label="AWB Prefix" hint="Prefix for auto-generated AWB numbers">
          <input className={inp} value={form.awbPrefix} onChange={s('awbPrefix')} placeholder="CX" maxLength={5} />
        </Field>
        <Field label="Volumetric Divisor" hint="Used for volumetric weight calculation (L×W×H ÷ divisor)">
          <input className={inp} type="number" value={form.volumetricDivisor} onChange={s('volumetricDivisor')} />
        </Field>
        <Field label="Default Weight (kg)" hint="Default weight if not specified">
          <input className={inp} type="number" step="0.1" value={form.defaultWeight} onChange={s('defaultWeight')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'trackingEnabled',   label: 'Enable Shipment Tracking', desc: 'Real-time tracking portal for customers' },
          { key: 'codEnabled',        label: 'Enable Cash on Delivery (COD)', desc: 'Allow COD payment option during booking' },
          { key: 'insuranceEnabled',  label: 'Enable Shipment Insurance', desc: 'Optional insurance for high-value parcels' },
          { key: 'signatureRequired', label: 'Require Signature on Delivery', desc: 'Mandatory signature for all deliveries' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={t(key)} className="rounded mt-0.5 w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── Account Settings ─────────────────────────────────────────────────────────

function AccountSettings() {
  const settings       = useAdminStore((s) => s.settings.account)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('account', form); markSaved() }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tax / VAT Name"><input className={inp} value={form.taxName} onChange={s('taxName')} placeholder="VAT" /></Field>
        <Field label="Tax Number / VAT ID"><input className={inp} value={form.taxNumber} onChange={s('taxNumber')} /></Field>
        <Field label="Tax Rate (%)"><input className={inp} type="number" step="0.01" value={form.taxRate} onChange={s('taxRate')} /></Field>
        <Field label="Company Registration No."><input className={inp} value={form.registrationNumber} onChange={s('registrationNumber')} /></Field>
        <Field label="Bank Name"><input className={inp} value={form.bankName} onChange={s('bankName')} /></Field>
        <Field label="Bank Account Number"><input className={inp} value={form.bankAccount} onChange={s('bankAccount')} /></Field>
        <Field label="Routing / Sort Code"><input className={inp} value={form.bankRoutingNo} onChange={s('bankRoutingNo')} /></Field>
      </div>
      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── Third Party Carriers ─────────────────────────────────────────────────────

function CarrierSettings() {
  const carriers      = useAdminStore((s) => s.settings.carriers)
  const addCarrier    = useAdminStore((s) => s.addCarrier)
  const updateCarrier = useAdminStore((s) => s.updateCarrier)
  const deleteCarrier = useAdminStore((s) => s.deleteCarrier)
  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const EMPTY = { name: '', apiKey: '', trackUrl: '', createShipmentUrl: '', status: 'Active', accountNo: '', entityId: '', entityPin: '', username: '', password: '' }
  const [newForm, setNewForm]   = useState(EMPTY)
  const [showKeys, setShowKeys] = useState({})
  const [showSecrets, setShowSecrets] = useState({})

  const handleAdd = (e) => { e.preventDefault(); addCarrier(newForm); setAddOpen(false); setNewForm(EMPTY) }

  const chg = (field, val) => editItem
    ? setEditItem(i => ({ ...i, [field]: val }))
    : setNewForm(f => ({ ...f, [field]: val }))
  const val = (field) => editItem ? editItem[field] ?? '' : newForm[field] ?? ''

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Add Carrier
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Carrier Name</th>
              <th className="px-4 py-3">API Key</th>
              <th className="px-4 py-3">Tracking URL</th>
              <th className="px-4 py-3">Create Shipment URL</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{showKeys[c.id] ? c.apiKey : '••••••••••••'}</span>
                    <button type="button" onClick={() => setShowKeys((k) => ({ ...k, [c.id]: !k[c.id] }))} className="text-slate-400 hover:text-slate-600">
                      {showKeys[c.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[180px]">{c.trackUrl}</td>
                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[180px]">{c.createShipmentUrl || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditItem(c)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => deleteCarrier(c.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(addOpen || editItem) && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold mb-4">{editItem ? 'Edit Carrier' : 'Add Carrier'}</h3>
          <form onSubmit={editItem
            ? (e) => { e.preventDefault(); updateCarrier(editItem.id, editItem); setEditItem(null) }
            : handleAdd}
            className="space-y-4">

            {/* Row 1 — Basic */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Carrier Name *">
                <input className={inp} required value={val('name')} onChange={e => chg('name', e.target.value)} placeholder="e.g. DPEX" />
              </Field>
              <Field label="Status">
                <select className={sel} value={val('status')} onChange={e => chg('status', e.target.value)}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </Field>
            </div>

            {/* Row 2 — URLs */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tracking API URL *">
                <input className={inp} required value={val('trackUrl')} onChange={e => chg('trackUrl', e.target.value)} placeholder="https://api.dpex.com" />
              </Field>
              <Field label="Create Shipment URL">
                <input className={inp} value={val('createShipmentUrl')} onChange={e => chg('createShipmentUrl', e.target.value)} placeholder="https://onlineexpressdev.shop/api/developer/V1/CreateShipment" />
              </Field>
            </div>

            {/* Row 3 — API Key */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="API Key">
                <div className="relative">
                  <input className={inp} type={showSecrets['apiKey'] ? 'text' : 'password'} value={val('apiKey')} onChange={e => chg('apiKey', e.target.value)} placeholder="•••••••••••••" />
                  <button type="button" onClick={() => setShowSecrets(s => ({ ...s, apiKey: !s.apiKey }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets['apiKey'] ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </Field>
            </div>

            {/* Divider */}
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Extended Credentials (DPEX / multi-auth carriers)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account Number">
                  <input className={inp} value={val('accountNo')} onChange={e => chg('accountNo', e.target.value)} placeholder="DPEX account number" />
                </Field>
                <Field label="Entity ID">
                  <input className={inp} value={val('entityId')} onChange={e => chg('entityId', e.target.value)} placeholder="Entity ID" />
                </Field>
                <Field label="Entity PIN">
                  <div className="relative">
                    <input className={inp} type={showSecrets['entityPin'] ? 'text' : 'password'} value={val('entityPin')} onChange={e => chg('entityPin', e.target.value)} placeholder="•••••••" />
                    <button type="button" onClick={() => setShowSecrets(s => ({ ...s, entityPin: !s.entityPin }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showSecrets['entityPin'] ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </Field>
                <Field label="Username">
                  <input className={inp} value={val('username')} onChange={e => chg('username', e.target.value)} placeholder="API username" />
                </Field>
                <Field label="Password" cls="col-span-2">
                  <div className="relative">
                    <input className={inp} type={showSecrets['password'] ? 'text' : 'password'} value={val('password')} onChange={e => chg('password', e.target.value)} placeholder="•••••••••••••" />
                    <button type="button" onClick={() => setShowSecrets(s => ({ ...s, password: !s.password }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showSecrets['password'] ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => { setAddOpen(false); setEditItem(null) }} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Payment Gateway ──────────────────────────────────────────────────────────

function PaymentSettings() {
  const settings       = useAdminStore((s) => s.settings.payment)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const t = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('payment', form); markSaved() }} className="space-y-6">
      {[
        { key: 'stripe', label: 'Stripe', fields: [{ k: 'stripePublicKey', l: 'Publishable Key' }, { k: 'stripeSecretKey', l: 'Secret Key' }], toggle: 'stripeEnabled' },
        { key: 'paypal', label: 'PayPal', fields: [{ k: 'paypalClientId', l: 'Client ID' }, { k: 'paypalSecret', l: 'Secret' }], toggle: 'paypalEnabled' },
      ].map(({ key, label, fields, toggle }) => (
        <div key={key} className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{label}</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600">{form[toggle] ? 'Enabled' : 'Disabled'}</span>
              <div onClick={t(toggle)} className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form[toggle] ? 'bg-violet-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[toggle] ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ k, l }) => (
              <Field key={k} label={l}>
                <input className={inp} value={form[k]} onChange={s(k)} disabled={!form[toggle]} placeholder="Enter key..." />
              </Field>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── SMTP Settings ────────────────────────────────────────────────────────────

function SmtpSettings() {
  const settings       = useAdminStore((s) => s.settings.smtp)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const [showPw, setShowPw] = useState(false)
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('smtp', form); markSaved() }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="SMTP Host"><input className={inp} value={form.host} onChange={s('host')} placeholder="smtp.mailgun.org" /></Field>
        </div>
        <Field label="Port"><input className={inp} value={form.port} onChange={s('port')} placeholder="587" /></Field>
        <Field label="Encryption">
          <select className={sel} value={form.encryption} onChange={s('encryption')}>
            <option>TLS</option><option>SSL</option><option>None</option>
          </select>
        </Field>
        <Field label="Username / Email"><input className={inp} value={form.username} onChange={s('username')} /></Field>
        <Field label="Password">
          <div className="relative">
            <input className={`${inp} pr-10`} type={showPw ? 'text' : 'password'} value={form.password} onChange={s('password')} />
            <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <Field label="From Name"><input className={inp} value={form.fromName} onChange={s('fromName')} /></Field>
        <Field label="From Email"><input className={inp} type="email" value={form.fromEmail} onChange={s('fromEmail')} /></Field>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Send Test Email</button>
        <SaveBtn saved={saved} />
      </div>
    </form>
  )
}

// ─── Social Settings ──────────────────────────────────────────────────────────

function SocialSettings() {
  const settings       = useAdminStore((s) => s.settings.social)
  const updateSettings = useAdminStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, markSaved] = useSavedState()
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const PLATFORMS = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'twitter',  label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
    { key: 'instagram',label: 'Instagram', placeholder: 'https://instagram.com/yourprofile' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
    { key: 'youtube',  label: 'YouTube', placeholder: 'https://youtube.com/yourchannel' },
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateSettings('social', form); markSaved() }} className="space-y-4">
      {PLATFORMS.map(({ key, label, placeholder }) => (
        <Field key={key} label={label}>
          <input className={inp} value={form[key] || ''} onChange={s(key)} placeholder={placeholder} />
        </Field>
      ))}
      <div className="flex justify-end"><SaveBtn saved={saved} /></div>
    </form>
  )
}

// ─── Template editor (Email + SMS) ────────────────────────────────────────────

function TemplateEditor({ type }) {
  const templates      = useAdminStore((s) => type === 'email' ? s.settings.emailTemplates : s.settings.smsTemplates)
  const updateTemplate = useAdminStore((s) => type === 'email' ? s.updateEmailTemplate : s.updateSmsTemplate)
  const addTemplate    = useAdminStore((s) => type === 'email' ? s.addEmailTemplate : s.addSmsTemplate)
  const [selected, setSelected] = useState(templates[0]?.id || null)
  const [editForm, setEditForm] = useState(templates[0] || {})
  const [saved, markSaved] = useSavedState()

  const select = (t) => { setSelected(t.id); setEditForm(t) }
  const handleSave = (e) => { e.preventDefault(); updateTemplate(selected, editForm); markSaved() }

  const VARS = type === 'email'
    ? ['{{AWB}}', '{{Customer}}', '{{Driver}}', '{{NDR_Reason}}', '{{Sender}}', '{{Receiver}}']
    : ['{{AWB}}', '{{Driver}}', '{{Reason}}', '{{OTP}}']

  return (
    <div className="grid grid-cols-3 gap-5" style={{ minHeight: 500 }}>
      {/* Template list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
          <span className="text-xs font-medium text-slate-500 uppercase">Templates</span>
          <button onClick={() => addTemplate({ name: 'New Template', subject: '', body: '' })}
            className="p-1 rounded hover:bg-slate-200 text-slate-500"><Plus size={14} /></button>
        </div>
        <div className="divide-y">
          {templates.map((t) => (
            <button key={t.id} onClick={() => select(t)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${selected === t.id ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'}`}>
              <p className="font-medium">{t.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-2 bg-white rounded-xl border shadow-sm">
        {editForm.id ? (
          <form onSubmit={handleSave} className="h-full flex flex-col">
            <div className="px-5 py-4 border-b space-y-3">
              <Field label="Template Name">
                <input className={inp} value={editForm.name || ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              {type === 'email' && (
                <Field label="Subject">
                  <input className={inp} value={editForm.subject || ''} onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))} />
                </Field>
              )}
            </div>
            <div className="flex-1 p-5 space-y-3">
              <div className="flex gap-1 flex-wrap">
                {VARS.map((v) => (
                  <button key={v} type="button"
                    onClick={() => setEditForm((f) => ({ ...f, body: (f.body || '') + v }))}
                    className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 font-mono">{v}</button>
                ))}
              </div>
              <textarea
                value={editForm.body || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))}
                className={`${inp} resize-none flex-1`}
                style={{ minHeight: type === 'email' ? 200 : 100 }}
                placeholder="Template body…" />
            </div>
            <div className="px-5 py-4 border-t flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editForm.status === 'Active'}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.checked ? 'Active' : 'Inactive' }))}
                  className="rounded w-4 h-4" />
                Active
              </label>
              <SaveBtn saved={saved} />
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">Select a template to edit</div>
        )}
      </div>
    </div>
  )
}

// ─── Database Backup ──────────────────────────────────────────────────────────

function BackupSettings() {
  const [lastBackup] = useState('2026-03-09T22:00:00Z')
  const [loading, setLoading] = useState(false)

  const simulate = (fn) => { setLoading(true); setTimeout(() => { fn(); setLoading(false) }, 1500) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Last Backup', value: new Date(lastBackup).toLocaleString(), color: 'text-green-700' },
          { label: 'Backup Size', value: '12.4 MB', color: 'text-slate-700' },
          { label: 'Auto Backup', value: 'Daily at 22:00', color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Database size={18} className="text-violet-500" /> Backup Actions</h3>
        <div className="flex gap-3">
          <button onClick={() => simulate(() => {})} disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Database size={15} />} Create Backup Now
          </button>
          <button className="flex items-center gap-2 border hover:bg-slate-50 px-5 py-2.5 rounded-lg text-sm font-medium">
            <Download size={15} /> Download Latest Backup
          </button>
        </div>
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">Recent Backups</div>
          {['2026-03-09 22:00', '2026-03-08 22:00', '2026-03-07 22:00'].map((d, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0 hover:bg-slate-50">
              <span className="text-sm text-slate-700">{d}</span>
              <span className="text-xs text-slate-400">{(12.4 - i * 0.3).toFixed(1)} MB</span>
              <button className="ml-auto flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                <Download size={13} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── API Keys Settings ────────────────────────────────────────────────────────

function APIKeysSettings() {
  const [keys,       setKeys]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [newName,    setNewName]    = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState(null)
  const [copied,     setCopied]     = useState(null)   // key id that was just copied
  const [revealed,   setRevealed]   = useState({})     // { keyId: true } for shown keys

  const inp2 = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  const loadKeys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/keys')
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadKeys() }, [loadKeys])

  async function handleGenerate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setGenerating(true)
    setGenError(null)
    try {
      const res  = await fetch('/api/v1/admin/keys', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ partner_name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to generate key')
      setNewName('')
      loadKeys()
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevoke(id, name) {
    if (!window.confirm(`Revoke API key for "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/v1/admin/keys/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      loadKeys()
    } catch (err) {
      alert(`Failed to revoke: ${err.message}`)
    }
  }

  function copyKey(key, id) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function toggleReveal(id) {
    setRevealed(r => ({ ...r, [id]: !r[id] }))
  }

  function maskKey(k) {
    return k.slice(0, 10) + '•'.repeat(Math.max(0, k.length - 14)) + k.slice(-4)
  }

  return (
    <div className="space-y-6">

      {/* Generate new key */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-600" />
          Generate Partner API Key
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Share these keys with DPEX, Online Express, or any logistics partner that
          needs to call the CourierX API. Each partner gets their own key so you can
          revoke access individually.
        </p>
        <form onSubmit={handleGenerate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Partner name (e.g. DPEX, Online Express)"
            className={inp2 + ' flex-1'}
          />
          <button
            type="submit"
            disabled={generating || !newName.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Plus className="w-4 h-4" /> Generate Key</>
            }
          </button>
        </form>
        {genError && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {genError}
          </p>
        )}
      </div>

      {/* Keys table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 text-sm">Partner API Keys</h3>
          <button onClick={loadKeys} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading keys…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not load API keys: {error}. Is the API server running? (<code>npm run dev:api</code>)</span>
          </div>
        )}

        {!loading && !error && keys.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm border border-dashed rounded-xl">
            No API keys yet. Generate one above to share with a partner.
          </div>
        )}

        {!loading && !error && keys.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Partner</th>
                  <th className="text-left px-4 py-3">API Key</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Last Used</th>
                  <th className="text-right px-4 py-3">Calls</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map(k => (
                  <tr key={k.id} className={`hover:bg-slate-50 ${k.status === 'revoked' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{k.partner_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                          {revealed[k.id] ? k.api_key : maskKey(k.api_key)}
                        </code>
                        <button onClick={() => toggleReveal(k.id)}
                          className="text-slate-400 hover:text-slate-700" title="Show/hide key">
                          {revealed[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyKey(k.api_key, k.id)}
                          className="text-slate-400 hover:text-violet-600" title="Copy key">
                          {copied === k.id
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {k.status === 'active'
                        ? <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        : <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            <ShieldOff className="w-3 h-3" /> Revoked
                          </span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {k.last_used_at ? new Date(k.last_used_at + 'Z').toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">{k.total_calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {k.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(k.id, k.partner_name)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-600" />
          API Endpoint Reference
        </h3>
        <p className="text-xs text-slate-500">Share these with your partners alongside their API key.</p>
        <div className="space-y-2 text-xs font-mono">
          {[
            ['POST',   '/api/v1/shipments',       'Create a new shipment'],
            ['GET',    '/api/v1/tracking/:awb',    'Get tracking events'],
            ['POST',   '/api/v1/tracking/:awb',    'Push a tracking update'],
            ['POST',   '/api/v1/rates',            'Get shipping rates'],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0
                ${method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {method}
              </span>
              <code className="bg-white border border-slate-200 px-2 py-0.5 rounded flex-1">{path}</code>
              <span className="text-slate-400 shrink-0">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 pt-1">
          All requests require: <code className="bg-white border border-slate-200 px-1 rounded">X-API-Key: cx_live_...</code>
        </p>
      </div>

    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

const SECTIONS = {
  general:         { title: 'General Settings',        Component: GeneralSettings },
  system:          { title: 'System Settings',          Component: SystemSettings },
  shipment:        { title: 'Shipment Settings',        Component: ShipmentSettings },
  account:         { title: 'Account Settings',         Component: AccountSettings },
  carriers:        { title: 'Third Party Carriers',     Component: CarrierSettings },
  payment:         { title: 'Payment Gateway',          Component: PaymentSettings },
  smtp:            { title: 'SMTP Email Settings',      Component: SmtpSettings },
  social:          { title: 'Social Settings',          Component: SocialSettings },
  'email-templates': { title: 'Email Templates',        Component: () => <TemplateEditor type="email" /> },
  'sms-templates': { title: 'SMS Templates',            Component: () => <TemplateEditor type="sms" /> },
  backup:          { title: 'Database Backup',          Component: BackupSettings },
  'api-keys':      { title: 'Partner API Keys',          Component: APIKeysSettings },
}

export default function Settings() {
  const { section } = useParams()
  const key = section || 'general'
  const { Component } = SECTIONS[key] || SECTIONS.general

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-6 py-5 border-b">
        <h2 className="font-semibold text-slate-900">{SECTIONS[key]?.title}</h2>
      </div>
      <div className="p-6">
        <Component />
      </div>
    </div>
  )
}
