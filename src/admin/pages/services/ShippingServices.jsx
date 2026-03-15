import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { CRUDTable, StatusBadge, TextInput, SelectInput, FormActions } from '../../components/CRUDTable'
import { Link } from 'react-router-dom'
import { DollarSign } from 'lucide-react'

function ServiceForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '',
    mode: initial.mode || 'Domestic', productType: initial.productType || 'Parcel',
    deliveryType: initial.deliveryType || 'Standard', deliveryDays: initial.deliveryDays || '',
    codSupport: initial.codSupport ?? true,
    minWeight: initial.minWeight || '', maxWeight: initial.maxWeight || '',
    status: initial.status || 'Active',
  })
  const s = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, minWeight: +form.minWeight, maxWeight: +form.maxWeight, codSupport: !!form.codSupport }) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Service Name" required placeholder="e.g. Domestic Standard" value={form.name} onChange={(e) => s('name')(e.target.value)} />
        <TextInput label="Service Code" placeholder="e.g. DOM-STD" value={form.code} onChange={(e) => s('code')(e.target.value.toUpperCase())} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SelectInput label="Mode" required value={form.mode} onChange={(e) => s('mode')(e.target.value)} options={['Domestic', 'International']} />
        <SelectInput label="Product Type" required value={form.productType} onChange={(e) => s('productType')(e.target.value)} options={['Parcel', 'Document', 'Freight']} />
        <SelectInput label="Delivery Type" required value={form.deliveryType} onChange={(e) => s('deliveryType')(e.target.value)} options={['Standard', 'Express', 'Same Day', 'Next Day']} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TextInput label="Delivery Days" placeholder="e.g. 3–5" value={form.deliveryDays} onChange={(e) => s('deliveryDays')(e.target.value)} />
        <TextInput label="Min Weight (kg)" type="number" step="0.01" placeholder="0.1" value={form.minWeight} onChange={(e) => s('minWeight')(e.target.value)} />
        <TextInput label="Max Weight (kg)" type="number" step="0.1" placeholder="30" value={form.maxWeight} onChange={(e) => s('maxWeight')(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.codSupport} onChange={(e) => s('codSupport')(e.target.checked)} className="rounded w-4 h-4" />
          <span className="text-sm text-slate-700 font-medium">Cash on Delivery (COD) Supported</span>
        </label>
      </div>
      <SelectInput label="Status" value={form.status} onChange={(e) => s('status')(e.target.value)} options={['Active', 'Inactive']} />
      <FormActions onCancel={onCancel} />
    </form>
  )
}

export default function ShippingServices() {
  const services       = useAdminStore((s) => s.services)
  const addService     = useAdminStore((s) => s.addService)
  const updateService  = useAdminStore((s) => s.updateService)
  const deleteService  = useAdminStore((s) => s.deleteService)
  const [filterMode, setFilterMode] = useState('')

  const displayed = filterMode ? services.filter((s) => s.mode === filterMode) : services

  const COLUMNS = [
    { key: 'name', label: 'Service Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'code', label: 'Code', render: (r) => r.code ? <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.code}</span> : '—' },
    { key: 'mode', label: 'Mode', render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.mode === 'International' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{r.mode}</span>
    )},
    { key: 'productType',  label: 'Product' },
    { key: 'deliveryType', label: 'Delivery', render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.deliveryType === 'Express' || r.deliveryType === 'Same Day' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{r.deliveryType}</span>
    )},
    { key: 'deliveryDays', label: 'Days' },
    { key: 'codSupport', label: 'COD', render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.codSupport ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.codSupport ? 'Yes' : 'No'}</span>
    )},
    { key: 'minWeight', label: 'Weight', render: (r) => <span className="text-xs">{r.minWeight}–{r.maxWeight} kg</span> },
    { key: 'status', label: 'Status' },
    { key: 'pricing', label: 'Pricing', render: (r) => (
      <Link to={`/admin/services/pricing?service=${r.id}`}
        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
        <DollarSign size={13} /> Setup
      </Link>
    )},
  ]

  return (
    <CRUDTable
      title="Shipping Service"
      data={displayed}
      columns={COLUMNS}
      searchFields={['name', 'code']}
      addLabel="Add Service"
      onAdd={addService}
      onEdit={updateService}
      onDelete={deleteService}
      onToggleStatus={(id, status) => updateService(id, { status })}
      renderForm={(props) => <ServiceForm {...props} />}
      filterBar={
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
          {['', 'Domestic', 'International'].map((m) => (
            <button key={m} onClick={() => setFilterMode(m)}
              className={`px-3 py-1.5 transition-colors ${filterMode === m ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {m || 'All'}
            </button>
          ))}
        </div>
      }
    />
  )
}
