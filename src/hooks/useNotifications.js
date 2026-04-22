import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useNotifications — server-backed notification bell data.
 *
 * Talks to /api/v1/notifications:
 *   · seeds from GET /          on mount
 *   · opens an EventSource to /stream for live pushes
 *   · falls back to polling every 25s if SSE is unsupported / closed
 *   · PATCH /:id/read + POST /mark-all-read for mutation
 *
 * scope — 'ops' | 'admin' | 'customer:<id>'. Pass what the current shell
 * should see; the backend filters on it.
 *
 * Returns { notifications, unread, connected, refresh, markRead, markAllRead }.
 * The `connected` flag drives the little "reconnecting" dot on the bell.
 */

const ENDPOINT = '/api/v1/notifications'

export function useNotifications(scope) {
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const [connected,     setConnected]     = useState(false)

  const esRef    = useRef(null)
  const pollRef  = useRef(null)
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  // ── Low-level fetch with the scope header ────────────────────────────────
  const fetchWith = useCallback((path, init = {}) => {
    const s = scopeRef.current
    if (!s) return Promise.reject(new Error('no scope'))
    return fetch(ENDPOINT + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Scope': s,
        ...(init.headers || {}),
      },
    })
  }, [])

  // ── Seed / refresh — replaces the full list from server ──────────────────
  const refresh = useCallback(async () => {
    try {
      const res = await fetchWith('/?limit=50')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setNotifications(Array.isArray(json.items) ? json.items : [])
      setUnread(Number(json.unread) || 0)
      return true
    } catch (err) {
      // Keep whatever we already had; surface disconnect via `connected`
      console.warn('[useNotifications] refresh failed:', err.message)
      return false
    }
  }, [fetchWith])

  // ── Open the SSE stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (!scope) return

    refresh()

    let closed = false
    let retryTimer = null

    const openStream = () => {
      if (closed) return
      // EventSource doesn't accept custom headers, so we pass scope in the URL
      const url = `${ENDPOINT}/stream?scope=${encodeURIComponent(scope)}`
      let es
      try {
        es = new EventSource(url, { withCredentials: false })
      } catch (_) {
        // EventSource unsupported — fall back to polling
        startPolling()
        return
      }
      esRef.current = es

      es.addEventListener('open', () => setConnected(true))
      es.addEventListener('ready', () => setConnected(true))

      es.addEventListener('notification', (ev) => {
        try {
          const n = JSON.parse(ev.data)
          setNotifications((list) => {
            if (list.some((x) => x.id === n.id)) return list
            return [n, ...list].slice(0, 200)
          })
          if (!n.read) setUnread((u) => u + 1)
        } catch (_) { /* ignore malformed event */ }
      })

      es.onerror = () => {
        setConnected(false)
        try { es.close() } catch (_) {}
        if (closed) return
        // Reconnect with a short back-off and refresh from REST
        retryTimer = setTimeout(() => {
          refresh().finally(openStream)
        }, 3000)
      }
    }

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(refresh, 25000)
    }

    if (typeof EventSource !== 'undefined') {
      openStream()
    } else {
      startPolling()
    }

    return () => {
      closed = true
      if (esRef.current) try { esRef.current.close() } catch (_) {}
      if (retryTimer)    clearTimeout(retryTimer)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [scope, refresh])

  // ── Mutations — optimistic so the badge feels responsive ─────────────────
  const markRead = useCallback(async (id) => {
    setNotifications((list) => list.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((u) => Math.max(0, u - 1))
    try {
      const res = await fetchWith(`/${id}/read`, { method: 'PATCH' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (typeof json.unread === 'number') setUnread(json.unread)
    } catch (err) {
      console.warn('[useNotifications] markRead failed:', err.message)
      // Re-sync from server so we don't diverge
      refresh()
    }
  }, [fetchWith, refresh])

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => n.read ? n : { ...n, read: true }))
    setUnread(0)
    try {
      const res = await fetchWith('/mark-all-read', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.warn('[useNotifications] markAllRead failed:', err.message)
      refresh()
    }
  }, [fetchWith, refresh])

  return { notifications, unread, connected, refresh, markRead, markAllRead }
}

/**
 * Helper to derive the right scope for useNotifications from the auth user.
 * Undefined if the user isn't logged in / is a driver (no inbox yet).
 */
export function scopeForUser(user) {
  if (!user) return null
  if (user.role === 'admin')      return 'admin'
  if (user.role === 'operations') return 'ops'
  if (user.role === 'customer'   && user.customerId) return `customer:${user.customerId}`
  return null
}
