import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'
import { Plus, Edit2, Trash2, Building2, ChevronDown, ChevronUp, ToggleRight, ToggleLeft } from 'lucide-react'

function DomZoneForm({ onSubmit, onCancel, initial, cities, states, countries }) {
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '',
    description: initial.description || '', status: initial.status || 'Active',
    cities: initial.cities || [],
  })
  const [filterCountry, setFilterCountry] = useState('')
  const [filterState, setFilterState]     = useState('')

  const filteredCities = cities.filter((c) => {
    if (filterCountry && c.countryId !== filterCountry) return false
    if (filterState   && c.stateId   !== filterState)   return false
    return true
  })

  const toggle = (id) => setForm((f) => ({
    ...f,
    cities: f.cities.includes(id) ? f.cities.filter((c) => c !== id) : [...f.cities, id],
  }))

  const stateMap       = Object.fromEntries(states.map((s) => [s.id, s.name]))
  const filteredStates = filterCountry ? states.filter((s) => s.countryId === filterCountry) : states

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Zone Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Zone 1 — East Coast"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Zone Code</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. DOM-1"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Assign Cities</label>
        <div className="flex gap-2 mb-2">
          <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setFilterState('') }}
            className="border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white flex-1">
            <option value="">All Countries</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white flex-1">
            <option value="">All States</option>
            {filteredStates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
          {filteredCities.map((c) => (
            <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0">
              <input type="checkbox" checked={form.cities.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
              <Building2 size={13} className="text-slate-400" />
              <span className="text-sm">{c.name}</span>
              <span className="text-xs text-slate-400 ml-auto">{stateMap[c.stateId]}</span>
            </label>
          ))}
          {filteredCities.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No cities match filter.</p>}
        </div>
        <p className="text-xs text-slate-400 mt-1">{form.cities.length} cities selected</p>
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
  { 'Zone Name': 'Lusaka Metro',   'Zone Code': 'DOM-LUS', Description: 'Greater Lusaka metropolitan area', 'City Names': 'Lusaka|Kafue|Chongwe',        Status: 'Active' },
  { 'Zone Name': 'Copperbelt',     'Zone Code': 'DOM-CB',  Description: 'Copperbelt urban corridor',       'City Names': 'Kitwe|Ndola|Chingola|Mufulira', Status: 'Active' },
  { 'Zone Name': 'Southern Zone',  'Zone Code': 'DOM-SP',  Description: 'Southern Province cities',        'City Names': 'Livingstone|Mazabuka|Choma',    Status: 'Active' },
  { 'Zone Name': 'Eastern Zone',   'Zone Code': 'DOM-EA',  Description: 'Eastern Province cities',         'City Names': 'Chipata|Petauke|Lundazi',       Status: 'Active' },
]

export default function DomesticZones() {
  const domZones           = useAdminStore((s) => s.domZones)
  const cities             = useAdminStore((s) => s.cities)
  const states             = useAdminStore((s) => s.states)
  const countries          = useAdminStore((s) => s.countries)
  const addDomZone         = useAdminStore((s) => s.addDomZone)
  const updateDomZone      = useAdminStore((s) => s.updateDomZone)
  const deleteDomZone      = useAdminStore((s) => s.deleteDomZone)
  const bulkImportDomZones = useAdminStore((s) => s.bulkImportDomZones)

  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [delItem, setDelItem]   = useState(null)
  const [expanded, setExpanded] = useState({})

  const cityMap  = Object.fromEntries(cities.map((c) => [c.id, c]))
  const stateMap = Object.fromEntries(states.map((s) => [s.id, s.name]))
  const toggle   = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const exportRows = domZones.map((z) => ({
    'Zone Name':  z.name,
    'Zone Code':  z.code,
    Description:  z.description,
    'City Names': z.cities.map((id) => cityMap[id]?.name || id).join('|'),
    Status:       z.status,
  }))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="dom-zones-template.csv"
          exportRows={exportRows}
          exportFilename="dom-zones-export.csv"
          onImport={(rows) => bulkImportDomZones(rows)}
        />
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Add Domestic Zone
        </button>
      </div>

      {/* Zone Cards */}
      <div className="space-y-3">
        {domZones.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm px-5 py-10 text-center text-slate-400 text-sm">
            No domestic zones yet. Add one or import from CSV.
          </div>
        )}
        {domZones.map((zone) => {
          const zoneCities = zone.cities.map((id) => cityMap[id]).filter(Boolean)
          return (
            <div key={zone.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{zone.name}</span>
                    {zone.code && <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{zone.code}</span>}
                    <StatusBadge status={zone.status} />
                  </div>
                  {zone.description && <p className="text-xs text-slate-500 mt-0.5">{zone.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{zone.cities.length} cities assigned</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateDomZone(zone.id, { status: zone.status === 'Active' ? 'Inactive' : 'Active' })}
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
                  <p className="text-xs font-medium text-slate-500 mb-3">ASSIGNED CITIES</p>
                  {zoneCities.length === 0 ? (
                    <p className="text-sm text-slate-400">No cities assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {zoneCities.map((c) => (
                        <span key={c.id} className="flex items-center gap-1.5 bg-white border px-3 py-1 rounded-lg text-sm">
                          <Building2 size={12} className="text-slate-400" />
                          {c.name}
                          <span className="text-xs text-slate-400">({stateMap[c.stateId]})</span>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Domestic Zone" size="lg">
        <DomZoneForm onSubmit={(d) => { addDomZone(d); setAddOpen(false) }} onCancel={() => setAddOpen(false)} initial={{}} cities={cities} states={states} countries={countries} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Domestic Zone" size="lg">
        {editItem && <DomZoneForm onSubmit={(d) => { updateDomZone(editItem.id, d); setEditItem(null) }} onCancel={() => setEditItem(null)} initial={editItem} cities={cities} states={states} countries={countries} />}
      </Modal>
      <Modal open={!!delItem} onClose={() => setDelItem(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600">Delete zone <strong>{delItem?.name}</strong>?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDelItem(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={() => { deleteDomZone(delItem.id); setDelItem(null) }} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
