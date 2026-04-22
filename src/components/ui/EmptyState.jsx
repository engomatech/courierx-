import { Inbox } from 'lucide-react'

/**
 * EmptyState — shown when a list, table, or search has no results.
 *
 * Keeps the same centred illustration + title + hint + optional CTA shape
 * across the app so users recognise the pattern. Pass `icon` to customise,
 * `actionLabel` + `onAction` for the button.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing to show yet',
  hint,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="text-sm text-slate-400 mt-1 max-w-xs">{hint}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-soft-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
