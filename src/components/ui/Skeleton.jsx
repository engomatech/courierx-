/**
 * Skeleton loader primitives.
 *
 * Use <Skeleton> for any single shape, and the helpers for common patterns
 * (a line of text, a table row, a card). All use the shared `.skeleton`
 * utility defined in index.css for the shimmer animation.
 */
export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="border-b last:border-0">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" style={{ width: `${70 - i * 8}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  )
}
