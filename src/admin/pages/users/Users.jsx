import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../authStore'
import { useCustomerStore } from '../../../customerStore'
import { PERMISSIONS_TABLE, PERMISSIONS, ROLE_META } from '../../../permissions'
import {
  Search, Plus, UserCheck, UserX, Eye, EyeOff,
  Mail, Phone, Calendar, Shield, User, AlertCircle, CheckCircle2, X, Lock,
  KeyRound, Clock, Activity, LogIn, Package, RefreshCw, UserPlus,
} from 'lucide-react'

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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

function ResetPasswordModal({ user, onClose, onDone, performedBy }) {
  const adminResetPassword = useAuthStore((s) => s.adminResetPassword)
  const [pwd,     setPwd]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = () => {
    if (!pwd)              { setError('Please enter a new password.'); return }
    if (pwd.length < 6)    { setError('Password must be at least 6 characters.'); return }
    if (pwd !== confirm)   { setError('Passwords do not match.'); return }
    const res = adminResetPassword(user.id, pwd, performedBy)
    if (res.error) { setError(res.error); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">Reset Password</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
              {user.initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
          </div>
          {[
            { label: 'New Password',     val: pwd,     set: setPwd },
            { label: 'Confirm Password', val: confirm, set: setConfirm },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={val}
                  onChange={(e) => { set(e.target.value); setError('') }}
                  placeholder="Min. 6 characters"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}
          <p className="text-xs text-slate-400">The user will need to use this new password on their next login.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold">
            Reset Password
          </button>
        </div>
      </div>
    </div>
  )
}

const ACTION_LABELS = {
  login:          { label: 'Sign In',         color: 'bg-blue-100 text-blue-700'    },
  user_created:   { label: 'User Created',    color: 'bg-emerald-100 text-emerald-700' },
  user_updated:   { label: 'Profile Updated', color: 'bg-amber-100 text-amber-700'  },
  password_reset: { label: 'Password Reset',  color: 'bg-violet-100 text-violet-700' },
  status_changed: { label: 'Status Changed',  color: 'bg-orange-100 text-orange-700' },
}

function KycBadge({ status }) {
  if (status === 'verified')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} />KYC Verified</span>
  if (status === 'submitted')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />KYC Submitted</span>
  if (status === 'rejected')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600"><X size={10} />KYC Rejected</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">KYC Pending</span>
}

function CreatePortalAccountModal({ customer, onClose, onCreated }) {
  const createUser = useAuthStore((s) => s.createUser)
  const [pwd,     setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!pwd || pwd.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError('')

    // Create portal login in authStore (localStorage)
    const result = createUser({
      name    : customer.name,
      email   : customer.email,
      phone   : customer.phone || '',
      password: pwd,
      role    : 'customer',
    }, 'Admin')

    if (result.error) { setError(result.error); setLoading(false); return }

    // Link portal_user_id back to the SQLite customer record
    try {
      await fetch(`/api/v1/admin/customers/${customer.id}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'internal' },
        body   : JSON.stringify({ portal_user_id: result.user.id }),
      })
    } catch (_) {
      // PATCH failure is non-fatal — portal account was still created
    }

    setLoading(false)
    onCreated(result.user)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">Create Portal Account</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Customer info preview */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
            <div className="text-sm font-semibold text-slate-800">{customer.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} />{customer.email || <span className="italic text-slate-400">no email</span>}</div>
            {customer.phone && <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} />{customer.phone}</div>}
          </div>
          {!customer.email && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              This customer has no email address on file. Add an email to their record before creating a portal account.
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Temporary Password<span className="text-red-500 ml-0.5">*</span></label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError('') }}
                placeholder="Min. 6 characters"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Share this with the customer — they should change it on first login.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !customer.email}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PartnerCustomersTab() {
  const users      = useAuthStore((s) => s.users)
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [createFor, setCreateFor] = useState(null)  // customer to create portal account for
  const [toast,     setToast]     = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/v1/admin/customers', { headers: { 'X-API-Key': 'internal' } })
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (_) {
      setCustomers([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Annotate each customer with their portal user (if any)
  const enriched = customers.map((c) => ({
    ...c,
    portalUser: c.portal_user_id ? users.find((u) => u.id === c.portal_user_id) : null,
  }))

  const filtered = enriched.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name || '').toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q) ||
           (c.phone || '').toLowerCase().includes(q)
  })

  const kycCounts = { submitted: 0, verified: 0, not_started: 0, rejected: 0 }
  customers.forEach((c) => { const k = c.kyc_status || 'not_started'; if (kycCounts[k] !== undefined) kycCounts[k]++ })

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Customers',  value: customers.length,       color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'KYC Submitted',    value: kycCounts.submitted,    color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'KYC Verified',     value: kycCounts.verified,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending KYC',      value: kycCounts.not_started,  color: 'text-slate-500',  bg: 'bg-slate-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">KYC Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Portal Account</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">Loading customers…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">No partner customers found.</td></tr>
            )}
            {!loading && filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                {/* Customer */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                      {(c.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{c.name}</div>
                      {c.email && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={11} />{c.email}</div>}
                      {c.phone && <div className="text-xs text-slate-400 flex items-center gap-1"><Phone size={11} />{c.phone}</div>}
                    </div>
                  </div>
                </td>
                {/* Source */}
                <td className="px-5 py-4">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                    {c.created_from || 'partner'}
                  </span>
                </td>
                {/* KYC */}
                <td className="px-5 py-4"><KycBadge status={c.kyc_status || 'not_started'} /></td>
                {/* Portal account */}
                <td className="px-5 py-4">
                  {c.portalUser ? (
                    <div className="space-y-0.5">
                      <StatusBadge status={c.portalUser.status || 'active'} />
                      <div className="text-xs text-slate-400 mt-1">{c.portalUser.email}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No portal access</span>
                  )}
                </td>
                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!c.portalUser && (
                      <button
                        onClick={() => setCreateFor(c)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <UserPlus size={12} /> Create Login
                      </button>
                    )}
                    {c.portalUser && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={12} /> Portal Active
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create portal account modal */}
      {createFor && (
        <CreatePortalAccountModal
          customer={createFor}
          onClose={() => setCreateFor(null)}
          onCreated={(newUser) => {
            setCreateFor(null)
            load()
            showToast(`Portal account created for ${newUser.name} — email: ${newUser.email}`)
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400" />{toast}
        </div>
      )}
    </div>
  )
}

export default function Users() {
  const users              = useAuthStore((s) => s.users)
  const activityLog        = useAuthStore((s) => s.activityLog || [])
  const currentUser        = useAuthStore((s) => s.user)
  const setUserStatus      = useAuthStore((s) => s.setUserStatus)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  const getWallet            = useCustomerStore((s) => s.getWallet)

  const [activeTab,   setActiveTab]  = useState('portal')   // 'portal' | 'partner'
  const [search,      setSearch]     = useState('')
  const [roleFilter,  setRoleFilter] = useState('all')
  const [showCreate,  setShowCreate] = useState(false)
  const [editUser,    setEditUser]   = useState(null)
  const [resetUser,   setResetUser]  = useState(null)
  const [logFilter,   setLogFilter]  = useState('all')
  const [toast,       setToast]      = useState('')

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
          <p className="text-sm text-slate-500 mt-0.5">{users.length} portal accounts</p>
        </div>
        {activeTab === 'portal' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} /> Create User
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border overflow-hidden bg-white text-sm w-fit">
        <button onClick={() => setActiveTab('portal')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium transition-colors ${activeTab === 'portal' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          <User size={15} /> Portal Users
        </button>
        <button onClick={() => setActiveTab('partner')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium transition-colors ${activeTab === 'partner' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Package size={15} /> Partner Customers
        </button>
      </div>

      {/* Partner Customers tab */}
      {activeTab === 'partner' && <PartnerCustomersTab />}

      {/* Portal Users tab content */}
      {activeTab !== 'portal' ? null : <>

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
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
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
                  {/* Last Login */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <LogIn size={11} />
                      {u.lastLogin ? fmtDateTime(u.lastLogin) : 'Never'}
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
                      <button
                        onClick={() => setResetUser(u)}
                        title="Reset password"
                        className="text-xs px-2 py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <KeyRound size={12} /> Reset PWD
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

      {/* ── Activity Log ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Activity Log</h3>
            <span className="text-xs text-slate-400 ml-1">— recent admin actions</span>
          </div>
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {['all', 'login', 'user_created', 'password_reset', 'status_changed'].map((f) => (
              <button key={f} onClick={() => setLogFilter(f)}
                className={`px-3 py-1.5 font-medium transition-colors capitalize ${logFilter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {f === 'all' ? 'All' : ACTION_LABELS[f]?.label || f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {activityLog
            .filter((e) => logFilter === 'all' || e.action === logFilter)
            .slice(0, 50)
            .map((entry) => {
              const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-slate-100 text-slate-600' }
              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{entry.details}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {fmtDateTime(entry.at)}
                      {entry.performedBy && <span className="ml-2 text-slate-300">· by {entry.performedBy}</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          {activityLog.filter((e) => logFilter === 'all' || e.action === logFilter).length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No activity recorded yet</div>
          )}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Lock size={16} className="text-violet-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Role Permissions Matrix</h3>
          <span className="text-xs text-slate-400 ml-1">— what each role can access</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-48">Permission</th>
                {Object.keys(ROLE_META).map(role => (
                  <th key={role} className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md font-semibold ${ROLE_META[role].color}`}>
                      {ROLE_META[role].label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                let lastGroup = ''
                return PERMISSIONS_TABLE.map(({ group, key, label }) => {
                  const groupHeader = group !== lastGroup
                  lastGroup = group
                  return [
                    groupHeader && (
                      <tr key={`g-${group}`} className="bg-slate-50/60">
                        <td colSpan={4} className="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {group}
                        </td>
                      </tr>
                    ),
                    <tr key={key} className="hover:bg-slate-50/40">
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{label}</td>
                      {Object.keys(ROLE_META).map(role => (
                        <td key={role} className="px-4 py-2.5 text-center">
                          {PERMISSIONS[key]?.[role]
                            ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100"><CheckCircle2 size={12} className="text-emerald-600" /></span>
                            : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50"><X size={12} className="text-red-400" /></span>
                          }
                        </td>
                      ))}
                    </tr>
                  ]
                })
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* end portal tab */}
      </>}

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
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          performedBy={currentUser?.name || 'Admin'}
          onClose={() => setResetUser(null)}
          onDone={() => { setResetUser(null); showToast(`Password reset for ${resetUser.name}.`) }}
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
