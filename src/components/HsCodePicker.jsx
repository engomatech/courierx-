import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { HS_CODES } from '../data/hsCodes'

/**
 * HsCodePicker — searchable HS code combobox.
 *
 * Props:
 *   value       string   — current HS code value
 *   onChange    fn(code) — called with new code string
 *   className   string   — extra classes on the trigger button
 */
export default function HsCodePicker({ value, onChange, className = '' }) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Focus search box when dropdown opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const q = query.trim().toLowerCase()

  const filtered = q
    ? HS_CODES.filter(
        (h) =>
          h.code.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.category.toLowerCase().includes(q)
      ).slice(0, 60)
    : HS_CODES.slice(0, 60)

  // Group by category for display
  const grouped = filtered.reduce((acc, h) => {
    if (!acc[h.category]) acc[h.category] = []
    acc[h.category].push(h)
    return acc
  }, {})

  const selected = value ? HS_CODES.find((h) => h.code === value) : null

  function select(code) {
    onChange(code)
    setOpen(false)
  }

  function clear(e) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-left transition-colors
          hover:border-violet-300 ${className}`}
      >
        {selected ? (
          <>
            <span className="font-mono font-semibold text-slate-800 shrink-0">{selected.code}</span>
            <span className="text-slate-500 truncate flex-1">{selected.description}</span>
            <button
              type="button"
              onClick={clear}
              className="text-slate-400 hover:text-slate-600 shrink-0 ml-1"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <span className="text-slate-400 flex-1">Search HS code or description…</span>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type code, description or category…"
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No matching HS codes found.<br />
                <span className="text-xs">You can type the code manually in the field below.</span>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 sticky top-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat}</span>
                  </div>
                  {items.map((h) => (
                    <button
                      key={h.code}
                      type="button"
                      onClick={() => select(h.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-violet-50 transition-colors
                        ${value === h.code ? 'bg-violet-50' : ''}`}
                    >
                      <span className="font-mono text-xs font-bold text-violet-700 shrink-0 w-16">{h.code}</span>
                      <span className="text-slate-700 truncate">{h.description}</span>
                      {value === h.code && (
                        <span className="ml-auto text-violet-500 text-xs shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Manual entry hint */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Can't find it?{' '}
              <button
                type="button"
                onClick={() => {
                  const custom = query.trim()
                  if (custom) { onChange(custom); setOpen(false) }
                }}
                className="text-violet-600 font-medium hover:underline"
              >
                Use "{query || '…'}" as the code
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
