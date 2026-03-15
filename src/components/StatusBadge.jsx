import { STATUS_COLORS, PRS_STATUS_COLORS } from '../utils'

export function StatusBadge({ status, type = 'shipment', className = '' }) {
  const colors =
    type === 'prs'
      ? PRS_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'
      : STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors} ${className}`}>
      {status}
    </span>
  )
}
