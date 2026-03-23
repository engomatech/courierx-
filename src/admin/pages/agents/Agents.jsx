/**
 * Agent Management — /admin/agents
 * Agents are companies or individuals who book shipments on behalf of customers.
 * Each agent gets a unique agent code and can have sub-users.
 */

import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { Search, Plus, Users, Edit2, Trash2, Building, Phone, Mail, MapPin, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { Modal } from '../../../components/Modal'

const STATUS_BADGE = {
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-red-100 text-red-600',
  suspended:'bg-amber-100 text-amber-700',
}

const AGENT_TYPES = ['General Agent', 'Corporate Account', 'Retail Partner', 'Franchise', 'Sub-Agent']
const COMMISSION_TYPES = ['Percentage', 'Flat Rate', 'Slab-based']

function AgentModal({ agent, onClose, onSave }) {
  const [form, setForm] = useState(agent || {
    name: '', code: '', type: 'General Agent', contactPerson: '',
    phone: '', email: '', city: '', country: 'Zambia', address: '',
    creditLimit: '', commissionType: 'Percentage', commissionRate: '',
    bankName: '', bankAccount: '', taxNumber: '',
    status: 'active', notes: '',
  })
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const inp = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Modal open onClose={onClose} title={agent ? 'Edit Agent' : 'Add New Agent'} size="xl">
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-5">

        {/* Basic Info */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent Name *</label>
              <input required className={inp} value={form.name} onChange={s('name')} placeholder="e.g. Lusaka Freight Solutions" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent Code *</label>
              <input required className={inp} value={form.code} onChange={s('code')} placeholder="e.g. AGT-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agent Type</label>
              <select className={inp} value={form.type} onChange={s('type')}>
                {AGENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label>
              <input className={inp} value={form.contactPerson} onChange={s('contactPerson')} placeholder="Primary contact name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input className={inp} value={form.phone} onChange={s('phone')} placeholder="+260 ..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" className={inp} value={form.email} onChange={s('email')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input className={inp} value={form.city} onChange={s('city')} placeholder="Lusaka" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
              <input className={inp} value={form.country} onChange={s('country')} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <input className={inp} value={form.address} onChange={s('address')} placeholder="Full physical address" />
            </div>
          </div>
        </div>

        {/* Commercial */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Commercial Terms</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Credit Limit (ZMW)</label>
              <input type="number" min="0" className={inp} value={form.creditLimit} onChange={s('creditLimit')} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Commission Type</label>
              <select className={inp} value={form.commissionType} onChange={s('commissionType')}>
                {COMMISSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Commission Rate {form.commissionType === 'Percentage' ? '(%)' : '(ZMW)'}
              </label>
              <input type="number" min="0" step="0.01" className={inp} value={form.commissionRate} onChange={s('commissionRate')} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tax/TPIN Number</label>
              <input className={inp} value={form.taxNumber} onChange={s('taxNumber')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name</label>
              <input className={inp} value={form.bankName} onChange={s('bankName')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bank Account No.</label>
              <input className={inp} value={form.bankAccount} onChange={s('bankAccount')} />
            </div>
          </div>
        </div>

        {/* Status & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select className={inp} value={form.status} onChange={s('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input className={inp} value={form.notes} onChange={s('notes')} placeholder="Internal notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium">
            {agent ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AgentRow({ agent, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-slate-50">
        <td className="px-4 py-3">
          <div className="font-semibold text-slate-800">{agent.name}</div>
          <div className="text-xs text-slate-400">{agent.type}</div>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-violet-600">{agent.code}</td>
        <td className="px-4 py-3">
          <div className="text-slate-700 text-sm">{agent.contactPerson || '—'}</div>
          {agent.phone && <div className="text-xs text-slate-400">{agent.phone}</div>}
        </td>
        <td className="px-4 py-3">
          <div className="text-xs text-slate-600">{agent.city}{agent.city && agent.country ? ', ' : ''}{agent.country}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-slate-700">
            {agent.commissionRate
              ? `${agent.commissionRate}${agent.commissionType === 'Percentage' ? '%' : ' ZMW'}`
              : '—'}
          </div>
          <div className="text-xs text-slate-400">{agent.commissionType}</div>
        </td>
        <td className="px-4 py-3">
          {agent.creditLimit
            ? <span className="text-sm font-medium text-slate-700">ZMW {Number(agent.creditLimit).toLocaleString()}</span>
            : <span className="text-slate-400 text-sm">—</span>}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[agent.status] || 'bg-slate-100 text-slate-600'}`}>
            {agent.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={() => onEdit(agent)}
              className="p-1.5 rounded hover:bg-violet-50 text-slate-400 hover:text-violet-600">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(agent.id)}
              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-b">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact Details</p>
                {agent.email && <p className="text-slate-700"><span className="text-slate-400">Email: </span>{agent.email}</p>}
                {agent.address && <p className="text-slate-700 mt-1"><span className="text-slate-400">Address: </span>{agent.address}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Banking</p>
                {agent.bankName && <p className="text-slate-700"><span className="text-slate-400">Bank: </span>{agent.bankName}</p>}
                {agent.bankAccount && <p className="text-slate-700 mt-1"><span className="text-slate-400">Account: </span>{agent.bankAccount}</p>}
                {agent.taxNumber && <p className="text-slate-700 mt-1"><span className="text-slate-400">TPIN: </span>{agent.taxNumber}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-slate-600">{agent.notes || 'No notes.'}</p>
                <p className="text-xs text-slate-400 mt-2">Added: {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Agents() {
  const agents      = useAdminStore(s => s.agents || [])
  const addAgent    = useAdminStore(s => s.addAgent)
  const updateAgent = useAdminStore(s => s.updateAgent)
  const deleteAgent = useAdminStore(s => s.deleteAgent)

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [modal,      setModal]      = useState(null)   // null | 'add' | agent object
  const [delConfirm, setDelConfirm] = useState(null)

  const filtered = agents.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(q) ||
      a.code?.toLowerCase().includes(q) ||
      a.contactPerson?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    const matchType = typeFilter === 'All' || a.type === typeFilter
    return matchSearch && matchType
  })

  function handleSave(form) {
    if (modal === 'add') {
      addAgent && addAgent(form)
    } else {
      updateAgent && updateAgent(modal.id, form)
    }
    setModal(null)
  }

  const stats = [
    { label: 'Total Agents',     value: agents.length,                                     color: 'bg-violet-500' },
    { label: 'Active Agents',    value: agents.filter(a => a.status === 'active').length,   color: 'bg-emerald-500' },
    { label: 'Suspended',        value: agents.filter(a => a.status === 'suspended').length,color: 'bg-amber-500' },
    { label: 'Inactive',         value: agents.filter(a => a.status === 'inactive').length, color: 'bg-red-400' },
  ]

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="All">All Types</option>
          {AGENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium ml-auto">
          <Plus size={16} /> Add Agent
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No agents yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first agent to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                {['Agent', 'Code', 'Contact', 'Location', 'Commission', 'Credit Limit', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(agent => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  onEdit={setModal}
                  onDelete={setDelConfirm}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <p className="font-semibold text-slate-800 mb-2">Delete this agent?</p>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the agent account. Existing shipments will retain the agent reference as text.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelConfirm(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
              <button onClick={() => { deleteAgent && deleteAgent(delConfirm); setDelConfirm(null) }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <AgentModal agent={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  )
}
