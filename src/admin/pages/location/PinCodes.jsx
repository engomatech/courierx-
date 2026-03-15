import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { CRUDTable, TextInput, SelectInput, FormActions } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'

function PinForm({ onSubmit, onCancel, initial, countries, states, cities }) {
  const [form, setForm] = useState({
    code: initial.code || '', countryId: initial.countryId || '',
    stateId: initial.stateId || '', cityId: initial.cityId || '', status: initial.status || 'Active',
  })
  const s = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const filteredStates = states.filter((st) => st.countryId === form.countryId)
  const filteredCities = cities.filter((ci) => ci.stateId === form.stateId)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <SelectInput label="Country" required value={form.countryId}
        onChange={(e) => { s('countryId')(e.target.value); s('stateId')(''); s('cityId')('') }}
        options={countries.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} />
      <SelectInput label="Province / State" required value={form.stateId}
        onChange={(e) => { s('stateId')(e.target.value); s('cityId')('') }}
        options={filteredStates.map((st) => ({ value: st.id, label: `${st.name} (${st.code})` }))} />
      <SelectInput label="City" required value={form.cityId}
        onChange={(e) => s('cityId')(e.target.value)}
        options={filteredCities.map((ci) => ({ value: ci.id, label: ci.name }))} />
      <TextInput label="Pin / Postal / ZIP Code" required placeholder="e.g. 10101"
        value={form.code} onChange={(e) => s('code')(e.target.value)} />
      <SelectInput label="Status" value={form.status} onChange={(e) => s('status')(e.target.value)}
        options={['Active', 'Inactive']} />
      <FormActions onCancel={onCancel} />
    </form>
  )
}

const TEMPLATE_ROWS = [
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'LS', 'City Name': 'Lusaka',      'Postal Code': '10101', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Kitwe',       'Postal Code': '20100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Ndola',       'Postal Code': '21100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CE', 'City Name': 'Kabwe',       'Postal Code': '50100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'CB', 'City Name': 'Chingola',    'Postal Code': '22100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'SP', 'City Name': 'Livingstone', 'Postal Code': '60100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'EA', 'City Name': 'Chipata',     'Postal Code': '40100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'NR', 'City Name': 'Kasama',      'Postal Code': '30100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'NW', 'City Name': 'Solwezi',     'Postal Code': '24100', Status: 'Active' },
  { 'Country ISO Code': 'ZM', 'Province/State Code': 'LU', 'City Name': 'Mansa',       'Postal Code': '31100', Status: 'Active' },
]

export default function PinCodes() {
  const pincodes           = useAdminStore((s) => s.pincodes)
  const cities             = useAdminStore((s) => s.cities)
  const states             = useAdminStore((s) => s.states)
  const countries          = useAdminStore((s) => s.countries)
  const addPincode         = useAdminStore((s) => s.addPincode)
  const updatePincode      = useAdminStore((s) => s.updatePincode)
  const deletePincode      = useAdminStore((s) => s.deletePincode)
  const bulkImportPincodes = useAdminStore((s) => s.bulkImportPincodes)

  const [filterCountry, setFilterCountry] = useState('')
  const [filterState,   setFilterState]   = useState('')
  const [filterCity,    setFilterCity]    = useState('')

  const countryMap     = Object.fromEntries(countries.map((c) => [c.id, c]))
  const stateMap       = Object.fromEntries(states.map((s) => [s.id, s]))
  const cityMap        = Object.fromEntries(cities.map((c) => [c.id, c]))

  const filteredStates = filterCountry ? states.filter((s) => s.countryId === filterCountry) : states
  const filteredCities = filterState
    ? cities.filter((c) => c.stateId === filterState)
    : filterCountry
    ? cities.filter((c) => c.countryId === filterCountry)
    : cities

  const displayed = pincodes.filter((p) => {
    if (filterCountry && p.countryId !== filterCountry) return false
    if (filterState   && p.stateId   !== filterState)   return false
    if (filterCity    && p.cityId    !== filterCity)     return false
    return true
  })

  const COLUMNS = [
    { key: 'code',      label: 'PIN / Postal Code', render: (r) => <span className="font-mono font-medium">{r.code}</span> },
    { key: 'cityId',    label: 'City',    render: (r) => cityMap[r.cityId]?.name       || '—' },
    { key: 'stateId',   label: 'Province / State', render: (r) => stateMap[r.stateId]?.name   || '—' },
    { key: 'countryId', label: 'Country', render: (r) => countryMap[r.countryId]?.name || '—' },
    { key: 'status',    label: 'Status' },
  ]

  const exportRows = displayed.map((p) => ({
    'Country ISO Code':    countryMap[p.countryId]?.code || '',
    'Province/State Code': stateMap[p.stateId]?.code     || '',
    'City Name':           cityMap[p.cityId]?.name       || '',
    'Postal Code': p.code,
    Status: p.status,
  }))

  return (
    <CRUDTable
      title="Pin Code"
      data={displayed}
      columns={COLUMNS}
      searchFields={['code']}
      addLabel="Add Pin Code"
      onAdd={addPincode}
      onEdit={updatePincode}
      onDelete={deletePincode}
      onToggleStatus={(id, status) => updatePincode(id, { status })}
      renderForm={(props) => <PinForm {...props} countries={countries} states={states} cities={cities} />}
      filterBar={
        <div className="flex gap-2 flex-wrap">
          <select value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setFilterState(''); setFilterCity('') }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="">All Countries</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
          <select value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setFilterCity('') }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="">All Provinces</option>
            {filteredStates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="">All Cities</option>
            {filteredCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      }
      extraActions={
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="pincodes-template.csv"
          exportRows={exportRows}
          exportFilename="pincodes-export.csv"
          onImport={(rows) => bulkImportPincodes(rows)}
        />
      }
    />
  )
}
