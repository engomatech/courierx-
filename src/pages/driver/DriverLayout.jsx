import { useAuthStore } from '../../authStore'
import { Truck, LogOut } from 'lucide-react'

export default function DriverLayout({ children }) {
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <Truck size={20} />
          <div>
            <div className="font-bold text-sm leading-tight">Online Express</div>
            <div className="text-green-200 text-xs leading-tight">Driver App</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-green-200 text-xs">Driver</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-full hover:bg-green-700 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
