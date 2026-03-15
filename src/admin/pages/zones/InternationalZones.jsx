import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'
import { Plus, Edit2, Trash2, Globe, ChevronDown, ChevronUp, ToggleRight, ToggleLeft } from 'lucide-react'

function ZoneForm({ onSubmit, onCancel, initial, countries }) {
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '',
    description: initial.description || '', status: initial.status || 'Active',
    countries: initial.countries || [],
  })
  const toggle = (id) => setForm((f) => ({
    ...f,
    countries: f.countries.includes(id) ? f.countries.filter((c) => c !== id) : [...f.countries, id],
  }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Zone Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Zone A — Tier 1"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Zone Code</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. INT-A"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Brief zone description"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Assign Countries</label>
        <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
          {countries.map((c) => (
            <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0">
              <input type="checkbox" checked={form.countries.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
              <Globe size={14} className="text-slate-400" />
              <span className="text-sm">{c.name}</span>
              <span className="ml-auto font-mono text-xs text-slate-400">{c.code}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">{form.countries.length} countries selected</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
          <option>Active</option><option>Inactive</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">Save Zone</button>
      </div>
    </form>
  )
}

const TEMPLATE_ROWS = [
  { 'Zone Name': 'Zone A — Tier 1', 'Zone Code': 'INT-A', Description: 'Premium international destinations', 'Country ISO Codes': 'US|GB|DE|FR|AU', Status: 'Active' },
  { 'Zone Name': 'Zone B — Tier 2', 'Zone Code': 'INT-B', Description: 'Standard international destinations', 'Country ISO Codes': 'ZA|KE|TZ|EG|NG', Status: 'Active' },
  { 'Zone Name': 'Zone C — Africa', 'Zone Code': 'INT-C', Description: 'African regional destinations',       'Country ISO Codes': 'ZM|MZ|ZW|BW|MW', Status: 'Active' },
]

export default function InternationalZones() {
  const intZones           = useAdminStore((s) => s.intZones)
  const countries          = useAdminStore((s) => s.countries)
  const addIntZone         = useAdminStore((s) => s.addIntZone)
  const updateIntZone      = useAdminStore((s) => s.updateIntZone)
  const deleteIntZone      = useAdminStore((s) => s.deleteIntZone)
  const bulkImportIntZones = useAdminStore((s) => s.bulkImportIntZones)

  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [delItem, setDelItem]   = useState(null)
  const [expanded, setExpanded] = useState({})

  const countryMap = Object.fromEntries(countries.map((c) => [c.id, c]))
  const toggle     = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const exportRows = intZones.map((z) => ({
    'Zone Name':         z.name,
    'Zone Code':         z.code,
    Description:         z.description,
    'Country ISO Codes': z.countries.map((id) => countryMap[id]?.code || id).join('|'),
    Status:              z.status,
  }))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="int-zones-template.csv"
          exportRows={exportRows}
          exportFilename="int-zones-export.csv"
          onImport={(rows) => bulkImportIntZones(rows)}
        />
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Add International Zone
        </button>
      </div>

      {/* Zone Cards */}
      <div className="space-y-3">
        {intZones.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm px-5 py-10 text-center text-slate-400 text-sm">
            No international zones yet. Add one or import from CSV.
          </div>
        )}
        {intZones.map((zone) => {
          const zoneCountries = zone.countries.map((id) => countryMap[id]).filter(Boolean)
          return (
            <div key={zone.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{zone.name}</span>
                    {zone.code && <span className="font-mono text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{zone.code}</span>}
                    <StatusBadge status={zone.status} />
                  </div>
                  {zone.description && <p className="text-xs text-slate-500 mt-0.5">{zone.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{zone.countries.length} countries assigned</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateIntZone(zone.id, { status: zone.status === 'Active' ? 'Inactive' : 'Active' })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    {zone.status === 'Active' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => setEditItem(zone)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 size={15} /></button>
                  <button onClick={() => setDelItem(zone)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                  <button onClick={() => toggle(zone.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    {expanded[zone.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
              {expanded[zone.id] && (
                <div className="border-t bg-slate-50 px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 mb-3">ASSIGNED COUNTRIES</p>
                  {zoneCountries.length === 0 ? (
                    <p className="text-sm text-slate-400">No countries assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {zoneCountries.map((c) => (
                        <span key={c.id} className="flex items-center gap-1.5 bg-white border px-3 py-1 rounded-lg text-sm">
                          <Globe size={13} className="text-slate-400" />
                          {c.name}
                          <span className="font-mono text-xs text-slate-400">({c.code})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add International Zone" size="lg">
        <ZoneForm onSubmit={(d) => { addIntZone(d); setAddOpen(false) }} onCancel={() => setAddOpen(false)} initial={{}} countries={countries} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit International Zone" size="lg">
        {editItem && <ZoneForm onSubmit={(d) => { updateIntZone(editItem.id, d); setEditItem(null) }} onCancel={() => setEditItem(null)} initial={editItem} countries={countries} />}
      </Modal>
      <Modal open={!!delItem} onClose={() => setDelItem(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600">Delete zone <strong>{delItem?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDelItem(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={() => { deleteIntZone(delItem.id); setDelItem(null) }} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
