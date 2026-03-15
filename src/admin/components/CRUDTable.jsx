import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Modal } from '../../components/Modal'

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
    }`}>{status}</span>
  )
}

export function CRUDTable({
  title, data, columns, onAdd, onEdit, onDelete, onToggleStatus,
  searchFields = [], addLabel = 'Add New', renderForm,
  filterBar, extraActions,
}) {
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  const filtered = data.filter((row) => {
    if (!search) return true
    return searchFields.some((f) => String(row[f] || '').toLowerCase().includes(search.toLowerCase()))
  })

  const handleAdd = (formData) => { onAdd(formData); setAddOpen(false) }
  const handleEdit = (formData) => { onEdit(editItem.id, formData); setEditItem(null) }
  const handleDelete = () => { onDelete(deleteItem.id); setDeleteItem(null) }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {filterBar}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {extraActions}
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={15} /> {addLabel}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-10 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(row) : (
                          col.key === 'status'
                            ? <StatusBadge status={row.status} />
                            : <span className="text-slate-700">{row[col.key]}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {onToggleStatus && (
                          <button
                            onClick={() => onToggleStatus(row.id, row.status === 'Active' ? 'Inactive' : 'Active')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {row.status === 'Active'
                              ? <ToggleRight size={16} className="text-green-500" />
                              : <ToggleLeft size={16} />
                            }
                          </button>
                        )}
                        <button
                          onClick={() => setEditItem(row)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteItem(row)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add ${title}`} size="md">
        {renderForm && renderForm({ onSubmit: handleAdd, onCancel: () => setAddOpen(false), initial: {} })}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit ${title}`} size="md">
        {editItem && renderForm && renderForm({ onSubmit: handleEdit, onCancel: () => setEditItem(null), initial: editItem })}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to delete <strong>{deleteItem?.name || deleteItem?.code}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export function TextInput({ label, required, hint, ...props }) {
  return (
    <FormField label={label} required={required} hint={hint}>
      <input
        {...props}
        required={required}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </FormField>
  )
}

export function SelectInput({ label, required, hint, options, ...props }) {
  return (
    <FormField label={label} required={required} hint={hint}>
      <select
        {...props}
        required={required}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

export function FormActions({ onCancel, submitLabel = 'Save' }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
      <button type="submit" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">{submitLabel}</button>
    </div>
  )
}
