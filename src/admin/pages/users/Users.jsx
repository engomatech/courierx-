import { useState } from 'react'
import { useAuthStore } from '../../../authStore'
import { useCustomerStore } from '../../../customerStore'
import {
  Search, Plus, UserCheck, UserX, Eye, EyeOff,
  Mail, Phone, Calendar, Shield, User, AlertCircle, CheckCircle2, X
} from 'lucide-react'

const ROLE_BADGE = {
  admin:      'bg-violet-100 text-violet-700',
  operations: 'bg-blue-100 text-blue-700',
  customer:   'bg-emerald-100 text-emerald-700',
}

function StatusBadge({ status }) {
  if (status === 'active')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
  if (status === 'pending_verification')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Inactive</span>
}

const EMPTY = { name: '', email: '', phone: '', role: 'customer', password: '' }

function CreateUserModal({ onClose, onCreated }) {
  const createUser = useAuthStore((s) => s.createUser)
  const [form,    setForm]    = useState(EMPTY)
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim())  { setError('Name is required.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    if (!form.password)     { setError('Password is required.'); return }
    const result = createUser(form)
    if (result.error) { setError(result.error); return }
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Create New User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Full Name',     field: 'name',  type: 'text',  placeholder: 'Jane Banda',         required: true },
            { label: 'Email Address', field: 'email', type: 'email', placeholder: 'jane@example.com',   required: true },
            { label: 'Phone Number',  field: 'phone', type: 'tel',   placeholder: '0971234567',         required: false },
          ].map(({ label, field, type, placeholder, required }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input type={type} value={form[field]} onChange={set(field)} placeholder={placeholder}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Role<span className="text-red-500 ml-0.5">*</span></label>
            <select value={form.role} onChange={set('role')}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="customer">Customer</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Password<span className="text-red-500 ml-0.5">*</span></label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Temporary password"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">The user should change this on first login.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Create User
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }) {
  const updateUser = useAuthStore((s) => s.updateUser)
  const [form,    setForm]    = useState({ name: user.name, email: user.email, phone: user.phone || '', role: user.role })
  const [error,   setError]   = useState('')

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim())  { setError('Name is required.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    updateUser(user.id, form)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Full Name',     field: 'name',  type: 'text',  placeholder: 'Jane Banda' },
            { label: 'Email Address', field: 'email', type: 'email', placeholder: 'jane@example.com' },
            { label: 'Phone Number',  field: 'phone', type: 'tel',   placeholder: '0971234567' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
              <input type={type} value={form[field]} onChange={set(field)} placeholder={placeholder}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
            <select value={form.role} onChange={set('role')}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="customer">Customer</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const users         = useAuthStore((s) => s.users)
  const setUserStatus = useAuthStore((s) => s.setUserStatus)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const getWallet            = useCustomerStore((s) => s.getWallet)

  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser,   setEditUser]   = useState(null)
  const [toast,      setToast]      = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const counts = { all: users.length, customer: 0, operations: 0, admin: 0 }
  users.forEach((u) => { if (counts[u.role] !== undefined) counts[u.role]++ })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} total accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users',   value: counts.all,        color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Customers',     value: counts.customer,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Operations',    value: counts.operations, color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Admin',         value: counts.admin,      color: 'text-amber-600',  bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex rounded-xl border overflow-hidden bg-white text-sm">
          {['all', 'customer', 'operations', 'admin'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 capitalize font-medium transition-colors ${roleFilter === r ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {r === 'all' ? `All (${counts.all})` : `${r.charAt(0).toUpperCase() + r.slice(1)} (${counts[r]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wallet</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found.</td></tr>
            )}
            {filtered.map((u) => {
              const completion = u.role === 'customer' ? getProfileCompletion(u.id) : null
              const wallet     = u.role === 'customer' ? getWallet(u.id) : null
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                        {u.initials}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />{u.email}
                        </div>
                        {u.phone && (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone size={11} />{u.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4"><StatusBadge status={u.status || 'active'} /></td>
                  {/* Profile completion (customers only) */}
                  <td className="px-5 py-4">
                    {completion ? (
                      <div className="space-y-1 w-24">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Profile</span>
                          <span className={`font-semibold ${completion.overall === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {completion.overall}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${completion.overall === 100 ? 'bg-emerald-500' : completion.overall < 50 ? 'bg-red-400' : 'bg-amber-400'}`}
                            style={{ width: `${completion.overall}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  {/* Wallet */}
                  <td className="px-5 py-4">
                    {wallet ? (
                      <span className="text-sm font-semibold text-slate-700">
                        ZK {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  {/* Created */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />{u.createdAt || '—'}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="text-xs px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      {u.status === 'pending_verification' ? (
                        <>
                          <button
                            onClick={() => { setUserStatus(u.id, 'active'); showToast(`${u.name} verified and activated.`) }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors font-medium flex items-center gap-1"
                          >
                            <UserCheck size={12} /> Verify
                          </button>
                          <button
                            onClick={() => { setUserStatus(u.id, 'inactive'); showToast(`${u.name} rejected.`) }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                          >
                            <UserX size={12} /> Reject
                          </button>
                        </>
                      ) : (u.status || 'active') === 'active' ? (
                        <button
                          onClick={() => { setUserStatus(u.id, 'inactive'); showToast(`${u.name} deactivated.`) }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                        >
                          <UserX size={12} /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => { setUserStatus(u.id, 'active'); showToast(`${u.name} reactivated.`) }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors font-medium flex items-center gap-1"
                        >
                          <UserCheck size={12} /> Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); showToast('User created successfully.') }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); showToast('User updated.') }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400" />{toast}
        </div>
      )}
    </div>
  )
}
