import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { CRUDTable, TextInput, SelectInput, FormActions } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'

function CityForm({ onSubmit, onCancel, initial, countries, states }) {
  const [form, setForm] = useState({
    name: initial.name || '', countryId: initial.countryId || '',
    stateId: initial.stateId || '', status: initial.status || 'Active',
  })
  const s = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const filteredStates = states.filter((st) => st.countryId === form.countryId)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <SelectInput label="Country" required value={form.countryId}
        onChange={(e) => { s('countryId')(e.target.value); s('stateId')('') }}
        options={countries.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} />
      <SelectInput label="Province / State" required value={form.stateId}
        onChange={(e) => s('stateId')(e.target.value)}
        options={filteredStates.map((st) => ({ value: st.id, label: `${st.name} (${st.code})` }))} />
      <TextInput label="City Name" required placeholder="e.g. Lusaka"
        value={form.name} onChange={(e) => s('name')(e.target.value)} />
      <SelectInput label="Status" value={form.status} onChange={(e) => s('status')(e.target.value)}
        options={['Active', 'Inactive']} />
      <FormActions onCancel={onCancel} />
    </form>
  )
}

const TEMPLATE_ROWS = [
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'LS', 'City Name': 'Lusaka',      Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Kitwe',       Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Ndola',       Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CE', 'City Name': 'Kabwe',       Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Chingola',    Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'SP', 'City Name': 'Livingstone', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'EA', 'City Name': 'Chipata',     Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'NR', 'City Name': 'Kasama',      Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'NW', 'City Name': 'Solwezi',     Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'LU', 'City Name': 'Mansa',       Status: 'Active' },
]

export default function Cities() {
  const cities           = useAdminStore((s) => s.cities)
  const states           = useAdminStore((s) => s.states)
  const countries        = useAdminStore((s) => s.countries)
  const addCity          = useAdminStore((s) => s.addCity)
  const updateCity       = useAdminStore((s) => s.updateCity)
  const deleteCity       = useAdminStore((s) => s.deleteCity)
  const bulkImportCities = useAdminStore((s) => s.bulkImportCities)

  const [filterCountry, setFilterCountry] = useState('')
  const [filterState,   setFilterState]   = useState('')

  const countryMap     = Object.fromEntries(countries.map((c) => [c.id, c]))
  const stateMap       = Object.fromEntries(states.map((s) => [s.id, s]))
  const filteredStates = filterCountry ? states.filter((s) => s.countryId === filterCountry) : states

  const displayed = cities.filter((c) => {
    if (filterCountry && c.countryId !== filterCountry) return false
    if (filterState   && c.stateId   !== filterState)   return false
    return true
  })

  const COLUMNS = [
    { key: 'id',        label: '#' },
    { key: 'name',      label: 'City' },
    { key: 'stateId',   label: 'Province / State', render: (r) => stateMap[r.stateId]?.name    || '—' },
    { key: 'countryId', label: 'Country',           render: (r) => countryMap[r.countryId]?.name || '—' },
    { key: 'status',    label: 'Status' },
  ]

  const exportRows = displayed.map((c) => ({
    'Country ISO Code':    countryMap[c.countryId]?.code || '',
    'Province/State Code': stateMap[c.stateId]?.code     || '',
    'City Name': c.name,
    Status: c.status,
  }))

  return (
    <CRUDTable
      title="City"
      data={displayed}
      columns={COLUMNS}
      searchFields={['name']}
      addLabel="Add City"
      onAdd={addCity}
      onEdit={updateCity}
      onDelete={deleteCity}
      onToggleStatus={(id, status) => updateCity(id, { status })}
      renderForm={(props) => <CityForm {...props} countries={countries} states={states} />}
      filterBar={
        <div className="flex gap-2 flex-wrap">
          <select value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setFilterState('') }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="">All Countries</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="">All Provinces</option>
            {filteredStates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      }
      extraActions={
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="cities-template.csv"
          exportRows={exportRows}
          exportFilename="cities-export.csv"
          onImport={(rows) => bulkImportCities(rows)}
        />
      }
    />
  )
}
