import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { CRUDTable, TextInput, SelectInput, FormActions } from '../../components/CRUDTable'
import { ImportExportBar } from '../../components/ImportExportBar'

function CountryForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '', status: initial.status || 'Active',
  })
  const s = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <TextInput label="Country Name" required placeholder="e.g. Zambia"
        value={form.name} onChange={(e) => s('name')(e.target.value)} />
      <TextInput label="ISO 3166-1 Alpha-2 Code" required placeholder="e.g. ZM" maxLength={2}
        value={form.code} onChange={(e) => s('code')(e.target.value.toUpperCase())} />
      <SelectInput label="Status" value={form.status} onChange={(e) => s('status')(e.target.value)}
        options={['Active', 'Inactive']} />
      <FormActions onCancel={onCancel} />
    </form>
  )
}

const TEMPLATE_ROWS = [
  { 'Country Name': 'Zambia',       'ISO Code (Alpha-2)': 'ZM', Status: 'Active' },
  { 'Country Name': 'Zimbabwe',     'ISO Code (Alpha-2)': 'ZW', Status: 'Active' },
  { 'Country Name': 'Botswana',     'ISO Code (Alpha-2)': 'BW', Status: 'Active' },
  { 'Country Name': 'Mozambique',   'ISO Code (Alpha-2)': 'MZ', Status: 'Active' },
  { 'Country Name': 'Malawi',       'ISO Code (Alpha-2)': 'MW', Status: 'Active' },
]

export default function Countries() {
  const countries           = useAdminStore((s) => s.countries)
  const addCountry          = useAdminStore((s) => s.addCountry)
  const updateCountry       = useAdminStore((s) => s.updateCountry)
  const deleteCountry       = useAdminStore((s) => s.deleteCountry)
  const bulkImportCountries = useAdminStore((s) => s.bulkImportCountries)

  const COLUMNS = [
    { key: 'id',     label: '#' },
    { key: 'name',   label: 'Country Name' },
    { key: 'code',   label: 'ISO Code', render: (r) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'status', label: 'Status' },
  ]

  const exportRows = countries.map((c) => ({
    'Country Name': c.name, 'ISO Code (Alpha-2)': c.code, Status: c.status,
  }))

  return (
    <CRUDTable
      title="Country"
      data={countries}
      columns={COLUMNS}
      searchFields={['name', 'code']}
      addLabel="Add Country"
      onAdd={addCountry}
      onEdit={updateCountry}
      onDelete={deleteCountry}
      onToggleStatus={(id, status) => updateCountry(id, { status })}
      renderForm={(props) => <CountryForm {...props} />}
      extraActions={
        <ImportExportBar
          templateRows={TEMPLATE_ROWS}
          templateFilename="countries-template.csv"
          exportRows={exportRows}
          exportFilename="countries-export.csv"
          onImport={(rows) => bulkImportCountries(rows)}
        />
      }
    />
  )
}
