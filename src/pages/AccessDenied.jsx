import { Link } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { usePermissions, defaultRedirect } from '../permissions'

export default function AccessDenied() {
  const { role, roleMeta } = usePermissions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-6">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-2">
          Your account role <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${roleMeta.color}`}>{roleMeta.label}</span> does not have permission to view this page.
        </p>
        <p className="text-slate-500 text-xs mb-8">
          If you believe this is an error, please contact your administrator.
        </p>
        <Link
          to={defaultRedirect(role)}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} />
          Back to your dashboard
        </Link>
      </div>
    </div>
  )
}
