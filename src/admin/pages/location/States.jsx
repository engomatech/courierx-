import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { CRUDTable, TextInput, SelectInput, FormActions } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'

function StateForm({ onSubmit, onCancel, initial, countries }) {
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '',
    countryId: initial.countryId || '', status: initial.status || 'Active',
  })
  const s = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <SelectInput label="Country" required value={form.countryId}
        onChange={(e) => s('countryId')(e.target.value)}
        options={countries.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} />
      <TextInput label="Province / State Name" required placeholder="e.g. Lusaka Province"
        value={form.name} onChange={(e) => s('name')(e.target.value)} />
      <TextInput label="State Code (ISO 3166-2)" required placeholder="e.g. LS"
        value={form.code} onChange={(e) => s('code')(e.target.value.toUpperCase())} />
      <SelectInput label="Status" value={form.status} onChange={(e) => s('status')(e.target.value)}
        options={['Active', 'Inactive']} />
      <FormActions onCancel={onCancel} />
    </form>
  )
}

const TEMPLATE_ROWS = [
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Lusaka Province',        'State Code': 'LS', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Copperbelt Province',    'State Code': 'CB', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Central Province',       'State Code': 'CE', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Eastern Province',       'State Code': 'EA', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Southern Province',      'State Code': 'SP', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'North-Western Province', 'State Code': 'NW', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Northern Province',      'State Code': 'NR', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Luapula Province',       'State Code': 'LU', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Muchinga Province',      'State Code': 'MU', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Name': 'Western Province',       'State Code': 'WE', Status: 'Active' },
]

export default function States() {
  const states            = useAdminStore((s) => s.states)
  const countries         = useAdminStore((s) => s.countries)
  const addState          = useAdminStore((s) => s.addState)
  const updateState       = useAdminStore((s) => s.updateState)
  const deleteState       = useAdminStore((s) => s.deleteState)
  const bulkImportStates  = useAdminStore((s) => s.bulkImportStates)

  const [filterCountry, setFilterCountry] = useState('')

  const countryMap = Object.fromEntries(countries.map((c) => [c.id, c]))
  const displayed  = filterCountry ? states.filter((s) => s.countryId === filterCountry) : states

  const COLUMNS = [
    { key: 'id',        label: '#' },
    { key: 'name',      label: 'Province / State' },
    { key: 'code',      label: 'Code', render: (r) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'countryId', label: 'Country', render: (r) => countryMap[r.countryId]?.name || '—' },
    { key: 'status',    label: 'Status' },
  ]

  const exportRows = displayed.map((s) => ({
    'Country ISO Code': countryMap[s.countryId]?.code || '',
    'Province/State Name': s.name,
    'State Code': s.code,
    'Status': s.status,
  }))

  return (
    <CRUDTable
      title="State / Province"
      data={displayed}
      columns={COLUMNS}
      searchFields={['name', 'code']}
      addLabel="Add State"
      onAdd={addState}
      onEdit={updateState}
      onDelete={deleteState}
      onToggleStatus={(id, status) => updateState(id, { status })}
      renderForm={(props) => <StateForm {...props} countries={countries} />}
      filterBar={
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      }
      extraActions={
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="states-template.csv"
          exportRows={exportRows}
          exportFilename="states-export.csv"
          onImport={(rows) => bulkImportStates(rows)}
        />
      }
    />
  )
}
