import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2, AlertTriangle, Info, AlertCircle, X,
} from 'lucide-react'

/**
 * Toast system — zero dependencies.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success('Parcel booked', 'AWB OEX-2026-00123 issued')
 *   toast.error('Failed to save')
 *   toast.info('Reminder', 'You have 3 bags pending manifest')
 *
 * Notifications from the backend SSE stream are handled by useNotifications;
 * this hook is for in-session user feedback (button clicks, saves, etc).
 */

const ToastContext = createContext(null)

const VARIANTS = {
  success: {
    icon : CheckCircle2,
    ring : 'ring-emerald-200',
    dot  : 'text-emerald-500',
    badge: 'bg-emerald-50',
  },
  error: {
    icon : AlertCircle,
    ring : 'ring-red-200',
    dot  : 'text-red-500',
    badge: 'bg-red-50',
  },
  warning: {
    icon : AlertTriangle,
    ring : 'ring-amber-200',
    dot  : 'text-amber-500',
    badge: 'bg-amber-50',
  },
  info: {
    icon : Info,
    ring : 'ring-brand-200',
    dot  : 'text-brand-500',
    badge: 'bg-brand-50',
  },
}

const DEFAULT_DURATION = 4500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback((variant, title, message, opts = {}) => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const duration = opts.duration ?? DEFAULT_DURATION
    const toast = { id, variant, title, message, duration }
    setToasts((list) => [...list, toast])
    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, timer)
    }
    return id
  }, [dismiss])

  // Clean up all timers on unmount
  useEffect(() => () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
  }, [])

  const api = useRef(null)
  if (!api.current) {
    api.current = {
      success: (title, message, opts) => push('success', title, message, opts),
      error  : (title, message, opts) => push('error',   title, message, opts),
      warning: (title, message, opts) => push('warning', title, message, opts),
      info   : (title, message, opts) => push('info',    title, message, opts),
      dismiss,
    }
  }

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Safe fallback so components can call toast.* even if provider missing
    // (e.g. on the public Landing page which doesn't mount the provider).
    const noop = () => null
    return { success: noop, error: noop, warning: noop, info: noop, dismiss: noop }
  }
  return ctx
}

function ToastViewport({ toasts, dismiss }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>,
    document.body,
  )
}

function ToastItem({ toast, onDismiss }) {
  const v = VARIANTS[toast.variant] || VARIANTS.info
  const Icon = v.icon
  return (
    <div
      role="status"
      className={`pointer-events-auto w-80 max-w-[92vw] bg-white rounded-xl shadow-soft-lg border border-slate-200/80 ring-1 ${v.ring} animate-toast-in`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${v.badge}`}>
          <Icon size={17} className={v.dot} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-sm text-slate-500 leading-snug mt-0.5">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-slate-400 hover:text-slate-600 shrink-0 -m-1 p-1 rounded transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
