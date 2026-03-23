/**
 * Hub Management — /admin/hubs
 * Create, edit and manage delivery hubs (warehouses/branches).
 * Hubs are used in PRS, DRS, Manifests and Hub Inbound.
 */

import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { Search, Plus, MapPin, Building2, Edit2, Trash2, CheckCircle2, X } from 'lucide-react'
import { Modal } from '../../../components/Modal'

const STATUS_BADGE = {
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-red-100 text-red-600',
}

function HubModal({ hub, onClose, onSave }) {
  const [form, setForm] = useState(hub || {
    name: '', code: '', city: '', region: '', country: 'Zambia',
    address: '', phone: '', email: '', manager: '', status: 'active',
  })
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const inp = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Modal open onClose={onClose} title={hub ? 'Edit Hub' : 'Add New Hub'} size="lg">
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hub Name *</label>
            <input required className={inp} value={form.name} onChange={s('name')} placeholder="e.g. Lusaka Main Hub" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hub Code *</label>
            <input required className={inp} value={form.code} onChange={s('code')} placeholder="e.g. LSK-01" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
            <input className={inp} value={form.city} onChange={s('city')} placeholder="Lusaka" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Region / Province</label>
            <input className={inp} value={form.region} onChange={s('region')} placeholder="Lusaka Province" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
            <input className={inp} value={form.country} onChange={s('country')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input className={inp} value={form.phone} onChange={s('phone')} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
            <input className={inp} value={form.address} onChange={s('address')} placeholder="Full physical address" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" className={inp} value={form.email} onChange={s('email')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hub Manager</label>
            <input className={inp} value={form.manager} onChange={s('manager')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select className={inp} value={form.status} onChange={s('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium">
            {hub ? 'Update Hub' : 'Create Hub'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Hubs() {
  const hubs      = useAdminStore(s => s.hubs || [])
  const addHub    = useAdminStore(s => s.addHub)
  const updateHub = useAdminStore(s => s.updateHub)
  const deleteHub = useAdminStore(s => s.deleteHub)

  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(null) // null | 'add' | hub object
  const [delConfirm, setDelConfirm] = useState(null)

  const filtered = hubs.filter(h => {
    if (!search) return true
    const q = search.toLowerCase()
    return h.name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q) || h.code?.toLowerCase().includes(q)
  })

  function handleSave(form) {
    if (modal === 'add') {
      addHub && addHub(form)
    } else {
      updateHub && updateHub(modal.id, form)
    }
    setModal(null)
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Hubs',    value: hubs.length,                              color: 'bg-violet-500' },
          { label: 'Active Hubs',   value: hubs.filter(h => h.status === 'active').length,   color: 'bg-emerald-500' },
          { label: 'Inactive Hubs', value: hubs.filter(h => h.status === 'inactive').length, color: 'bg-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search hubs…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Add Hub
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hubs yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first hub to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                {['Hub Name', 'Code', 'Location', 'Contact', 'Manager', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(hub => (
                <tr key={hub.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{hub.name}</div>
                    {hub.address && <div className="text-xs text-slate-400">{hub.address}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-violet-600">{hub.code}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{hub.city}</div>
                    <div className="text-slate-400 text-xs">{hub.country}</div>
                  </td>
                  <td className="px-4 py-3">
                    {hub.phone && <div className="text-xs text-slate-600">{hub.phone}</div>}
                    {hub.email && <div className="text-xs text-slate-400">{hub.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{hub.manager || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[hub.status] || 'bg-slate-100 text-slate-600'}`}>
                      {hub.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setModal(hub)}
                        className="p-1.5 rounded hover:bg-violet-50 text-slate-400 hover:text-violet-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDelConfirm(hub.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <p className="font-semibold text-slate-800 mb-2">Delete this hub?</p>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the hub. PRS and DRS records that reference it will retain the hub name as text.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelConfirm(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
              <button onClick={() => { deleteHub && deleteHub(delConfirm); setDelConfirm(null) }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <HubModal hub={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  )
}
