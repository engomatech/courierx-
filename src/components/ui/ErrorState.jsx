import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * ErrorState — shown when a fetch / load fails.
 *
 * Follows the same layout grammar as EmptyState: centred icon, title, hint,
 * optional retry button. Keeps the tone constructive (amber rather than
 * alarm-red) unless explicitly marked severe.
 */
export function ErrorState({
  title = 'Something went wrong',
  hint = 'We couldn\u2019t load this just now. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  severe = false,
  className = '',
}) {
  const colour = severe ? 'red' : 'amber'
  const iconBg  = severe ? 'bg-red-100' : 'bg-amber-100'
  const iconClr = severe ? 'text-red-500' : 'text-amber-500'

  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
        <AlertTriangle size={22} className={iconClr} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{hint}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            severe
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-soft-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
