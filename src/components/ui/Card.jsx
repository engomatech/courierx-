/**
 * Card — the default surface for grouped content across the app.
 * Matches the Wayels reference aesthetic: white, rounded-2xl, soft shadow,
 * neutral border. Use <CardHeader> + <CardBody> for consistent padding.
 */
export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...rest }) {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...rest }) {
  return (
    <div className={`px-5 py-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', icon: Icon, children }) {
  return (
    <h3 className={`text-sm font-semibold text-slate-800 flex items-center gap-2 ${className}`}>
      {Icon && <Icon size={16} className="text-slate-400" />}
      {children}
    </h3>
  )
}
