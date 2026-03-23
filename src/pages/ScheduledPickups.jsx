/**
 * Scheduled Pickups — /ops/scheduled-pickups
 * Customers or agents request a pickup at a specific date/time.
 * Ops team reviews, assigns a PRS, and confirms or rejects.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, CITIES, HUBS, DRIVERS } from '../utils'
import {
  CalendarClock, Plus, Search, CheckCircle2, X, Clock,
  Truck, MapPin, User, Phone, Package, ArrowRight, Edit2,
} from 'lucide-react'
import { Modal } from '../components/Modal'

// ── helpers ─────────────────────────────────────────────────
const STATUS_COLORS = {
  'Pending':   'bg-amber-100 text-amber-700 border-amber-200',
  'Confirmed': 'bg-blue-100 text-blue-700 border-blue-200',
  'Assigned':  'bg-purple-100 text-purple-700 border-purple-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
}

function SchedBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  )
}

// ── Sub-form for new schedule request ───────────────────────
const EMPTY = {
  customerName: '', customerPhone: '', customerEmail: '',
  pickupAddress: '', pickupCity: 'Lusaka',
  requestedDate: '', requestedTime: '09:00',
  hub: 'Lusaka Hub', pieces: '', notes: '',
}

export default function ScheduledPickups() {
  const schedPickups    = useStore(s => s.scheduledPickups || [])
  const addSchedPickup  = useStore(s => s.addScheduledPickup)
  const updateSchedPickup = useStore(s => s.updateScheduledPickup)

  const [search, setSearch] = useState('')
  const [tab,    setTab]    = useState('All')
  const [open,   setOpen]   = useState(false)
  const [form,   setForm]   = useState(EMPTY)
  const [assign, setAssign] = useState(null) // { id, driver, hub }

  const TABS = ['All', 'Pending', 'Confirmed', 'Assigned', 'Completed', 'Cancelled']

  const filtered = useMemo(() => {
    return schedPickups
      .filter(p => tab === 'All' || p.status === tab)
      .filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.customerName?.toLowerCase().includes(q) ||
          p.customerPhone?.toLowerCase().includes(q) ||
          p.pickupCity?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [schedPickups, tab, search])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (addSchedPickup) {
      addSchedPickup({
        ...form,
        pieces: form.pieces ? parseInt(form.pieces) : null,
      })
    }
    setOpen(false)
    setForm(EMPTY)
  }

  function handleStatusChange(id, status) {
    if (updateSchedPickup) updateSchedPickup(id, { status })
  }

  function handleAssign(e) {
    e.preventDefault()
    if (updateSchedPickup) {
      updateSchedPickup(assign.id, {
        status: 'Assigned',
        assignedDriver: assign.driver,
        assignedHub: assign.hub,
      })
    }
    setAssign(null)
  }

  const pending   = schedPickups.filter(p => p.status === 'Pending').length
  const confirmed = schedPickups.filter(p => p.status === 'Confirmed').length
  const assigned  = schedPickups.filter(p => p.status === 'Assigned').length

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: pending,    color: 'bg-amber-500',   icon: Clock },
          { label: 'Confirmed',      value: confirmed,  color: 'bg-blue-500',    icon: CheckCircle2 },
          { label: 'Assigned',       value: assigned,   color: 'bg-purple-500',  icon: Truck },
          { label: 'Total',          value: schedPickups.length, color: 'bg-slate-500', icon: CalendarClock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} className="text-white" />
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
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, city, ID…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >{t}</button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarClock size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No scheduled pickups</p>
            <p className="text-slate-400 text-sm mt-1">Create a pickup request to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['ID', 'Customer', 'Address', 'Requested', 'Hub', 'Driver', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.customerName}</div>
                      <div className="text-slate-400 text-xs">{p.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{p.pickupAddress}</div>
                      <div className="text-slate-400 text-xs">{p.pickupCity}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.requestedDate}</div>
                      <div className="text-slate-400 text-xs">{p.requestedTime}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.assignedHub || p.hub || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.assignedDriver || '—'}</td>
                    <td className="px-4 py-3"><SchedBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'Confirmed')}
                            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                          >Confirm</button>
                        )}
                        {p.status === 'Confirmed' && (
                          <button
                            onClick={() => setAssign({ id: p.id, driver: DRIVERS[0], hub: p.hub || HUBS[0] })}
                            className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
                          >Assign</button>
                        )}
                        {p.status === 'Assigned' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'Completed')}
                            className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                          >Complete</button>
                        )}
                        {!['Completed', 'Cancelled'].includes(p.status) && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'Cancelled')}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 border border-red-200"
                          >Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New request modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Scheduled Pickup Request" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border rounded-xl p-4 bg-blue-50 border-blue-100 space-y-3">
            <h3 className="font-medium text-blue-700 text-sm">Customer Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
                <input required value={form.customerName} onChange={e => set('customerName', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                <input required value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
            <h3 className="font-medium text-slate-700 text-sm">Pickup Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Pickup Address *</label>
                <input required value={form.pickupAddress} onChange={e => set('pickupAddress', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <select value={form.pickupCity} onChange={e => set('pickupCity', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Hub</label>
                <select value={form.hub} onChange={e => set('hub', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {HUBS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Date *</label>
                <input type="date" required value={form.requestedDate} onChange={e => set('requestedDate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Time</label>
                <input type="time" value={form.requestedTime} onChange={e => set('requestedTime', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Est. Pieces</label>
                <input type="number" min="1" placeholder="1" value={form.pieces} onChange={e => set('pieces', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <input value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="e.g. Call before arrival"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign driver modal */}
      {assign && (
        <Modal open={!!assign} onClose={() => setAssign(null)} title="Assign Driver" size="sm">
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Driver</label>
              <select value={assign.driver} onChange={e => setAssign(a => ({ ...a, driver: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DRIVERS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hub</label>
              <select value={assign.hub} onChange={e => setAssign(a => ({ ...a, hub: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {HUBS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAssign(null)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
              <button type="submit"
                className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium">
                Assign &amp; Confirm
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
