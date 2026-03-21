import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { useAuthStore } from '../../authStore'
import { formatDate } from '../../utils'
import { Play, ChevronRight, CheckCircle2, Clock, MapPin, Route } from 'lucide-react'

const STATUS_META = {
  Pending:       { color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
  'In Progress': { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  Completed:     { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

function DRSCard({ drs }) {
  const navigate   = useNavigate()
  const shipments  = useStore((s) => s.shipments)
  const startDRS   = useStore((s) => s.startDRS)

  const drsShipments = shipments.filter((s) => drs.shipments.includes(s.awb))
  const delivered    = drsShipments.filter((s) => s.status === 'Delivered').length
  const ndr          = drsShipments.filter((s) => s.status === 'Non-Delivery').length
  const pending      = drsShipments.filter((s) =>
    !['Delivered', 'Non-Delivery'].includes(s.status)
  ).length
  const total        = drsShipments.length
  const pct          = total > 0 ? Math.round(((delivered + ndr) / total) * 100) : 0

  const meta = STATUS_META[drs.status] || STATUS_META.Pending

  const handleStart = (e) => {
    e.stopPropagation()
    startDRS(drs.id)
    navigate(`/driver/run/${drs.id}`)
  }

  const handleOpen = () => navigate(`/driver/run/${drs.id}`)

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer active:opacity-80"
      onClick={handleOpen}
    >
      {/* Top strip */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <span className="font-mono font-bold text-green-700 text-base">{drs.id}</span>
          <div className="text-xs text-slate-400 mt-0.5">{formatDate(drs.createdAt)}</div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {drs.status}
        </span>
      </div>

      {/* Route info */}
      <div className="flex items-center gap-4 px-4 pb-3 text-sm text-slate-600">
        <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {drs.hub}</span>
        <span className="flex items-center gap-1"><Route size={13} className="text-slate-400" /> {drs.routeCode}</span>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{delivered + ndr} of {total} done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex border-t divide-x text-center">
        <div className="flex-1 py-2.5">
          <div className="text-base font-bold text-green-700">{delivered}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Delivered</div>
        </div>
        <div className="flex-1 py-2.5">
          <div className="text-base font-bold text-red-500">{ndr}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">NDR</div>
        </div>
        <div className="flex-1 py-2.5">
          <div className="text-base font-bold text-slate-700">{pending}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Pending</div>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-4 py-3 bg-slate-50 border-t flex items-center justify-between">
        {drs.status === 'Pending' ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl w-full justify-center"
          >
            <Play size={14} /> Start Run
          </button>
        ) : drs.status === 'In Progress' ? (
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl w-full justify-center"
          >
            Continue Run <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 text-emerald-700 text-sm font-medium w-full justify-center"
          >
            <CheckCircle2 size={14} /> View Summary <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function DriverHome() {
  const user = useAuthStore((s) => s.user)
  const drs  = useStore((s) => s.drs)

  // Filter to this driver's runs
  const myRuns = drs
    .filter((d) => d.driver === user?.name)
    .sort((a, b) => {
      const order = { 'In Progress': 0, Pending: 1, Completed: 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    })

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">My Deliveries</h1>
        <p className="text-sm text-slate-500">
          {myRuns.filter((r) => r.status !== 'Completed').length} active run
          {myRuns.filter((r) => r.status !== 'Completed').length !== 1 ? 's' : ''} today
        </p>
      </div>

      {myRuns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Clock size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-500">No delivery runs assigned</p>
          <p className="text-sm text-slate-400 mt-1">Check back later or contact your dispatcher.</p>
        </div>
      ) : (
        myRuns.map((d) => <DRSCard key={d.id} drs={d} />)
      )}
    </div>
  )
}
