import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// All page keys available to operations staff — used for per-user access control
export const ALL_OPS_PAGES = [
  'dashboard', 'partner_orders', 'booking', 'prs', 'inbound_scan', 'bags',
  'manifests', 'direct_manifests', 'hub_inbound', 'discrepancies', 'drs',
  'delivery', 'exceptions', 'reports', 'finance', 'customs', 'cod', 'pickups', 'customers',
]

const SEED_USERS = [
  { id: 'U001', email: 'admin@onlineexpress.com',   password: 'admin123',  name: 'Alex Admin',    firstName: 'Alex',  surname: 'Admin',    pronouns: '', role: 'admin',      initials: 'AA', status: 'active', createdAt: '2024-01-01', verificationToken: null },
  { id: 'U002', email: 'ops@onlineexpress.com',     password: 'ops123',    name: 'Sam Ops',       firstName: 'Sam',   surname: 'Ops',      pronouns: '', role: 'operations', initials: 'SO', status: 'active', createdAt: '2024-01-01', verificationToken: null, allowed_pages: [...ALL_OPS_PAGES] },
  { id: 'U003', email: 'customer@example.com',      password: 'cust123',   name: 'Jane Customer', firstName: 'Jane',  surname: 'Customer', pronouns: 'She/Her', role: 'customer',   initials: 'JC', status: 'active', createdAt: '2024-01-01', verificationToken: null, customerId: 'CX000003' },
  { id: 'U004', email: 'james@onlineexpress.com',   password: 'driver123', name: 'James Brown',   firstName: 'James', surname: 'Brown',    pronouns: '', role: 'driver',     initials: 'JB', status: 'active', createdAt: '2024-01-01', verificationToken: null },
  { id: 'U005', email: 'lisa@onlineexpress.com',    password: 'driver123', name: 'Lisa Zhang',    firstName: 'Lisa',  surname: 'Zhang',    pronouns: '', role: 'driver',     initials: 'LZ', status: 'active', createdAt: '2024-01-01', verificationToken: null },
]

function makeInitials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'U'
}

function makeId(users) {
  const nums = users.map((u) => parseInt(u.id.replace('U', ''), 10)).filter((n) => !isNaN(n))
  return 'U' + String((Math.max(0, ...nums) + 1)).padStart(3, '0')
}

// CX-prefixed 6-digit customer ID derived from user numeric ID
function makeCustomerId(userId) {
  const num = parseInt((userId || 'U0').replace('U', ''), 10) || 0
  return 'CX' + String(num).padStart(6, '0')
}

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      users:       SEED_USERS,
      activityLog: [],

      // ── Activity log ──────────────────────────────────────────────────────
      logActivity: (action, details, performedBy) => {
        const entry = {
          id:          Date.now().toString(36) + Math.random().toString(36).slice(2),
          action,
          details,
          performedBy: performedBy || 'System',
          at:          new Date().toISOString(),
        }
        set((s) => ({ activityLog: [entry, ...(s.activityLog || [])].slice(0, 500) }))
      },

      login: (emailOrId, password) => {
        const input = (emailOrId || '').trim().toLowerCase()
        const found = get().users.find(
          (u) =>
            (u.email.toLowerCase() === input ||
             (u.customerId && u.customerId.toLowerCase() === input)) &&
            u.password === password
        )
        if (!found)                                      return { error: 'Invalid email or password.' }
        if (found.status === 'inactive')                 return { error: 'This account has been deactivated. Please contact support.' }
        if (found.status === 'pending_verification')     return { error: 'PENDING_VERIFICATION', email: found.email }
        const now = new Date().toISOString()
        set((s) => ({
          users: s.users.map((u) => u.id === found.id ? { ...u, lastLogin: now } : u),
        }))
        const { password: _, verificationToken: __, ...safeUser } = { ...found, lastLogin: now }
        set({ user: safeUser })
        get().logActivity('login', `${found.name} signed in`, found.name)
        return { user: safeUser }
      },

      register: ({ firstName, surname, name, pronouns, gender, email, phone, town, physicalAddress, tpin, occupation, password, customer_id }) => {
        const users = get().users
        if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'An account with this email already exists.' }
        }
        // Accept either firstName+surname or legacy name
        const fn  = (firstName || '').trim()
        const sn  = (surname || '').trim()
        const full = fn && sn ? `${fn} ${sn}` : (name || `${fn}${sn}`).trim()
        const token = generateToken()
        const newId = makeId(users)
        const newUser = {
          id:                newId,
          email:             email.trim().toLowerCase(),
          password,
          firstName:         fn,
          surname:           sn,
          name:              full,
          pronouns:          (pronouns || '').trim(),
          gender:            (gender || '').trim(),
          phone:             phone?.trim() || '',
          town:              (town || '').trim(),
          physicalAddress:   (physicalAddress || '').trim(),
          tpin:              (tpin || '').trim(),
          occupation:        (occupation || '').trim(),
          role:              'customer',
          initials:          makeInitials(full),
          status:            'pending_verification',
          verificationToken: token,
          customerId:        makeCustomerId(newId),
          customer_id:       customer_id || null,
          createdAt:         new Date().toISOString().slice(0, 10),
        }
        set((s) => ({ users: [...s.users, newUser] }))
        return { pendingVerification: true, email: newUser.email, token }
      },

      verifyEmail: (token) => {
        const users = get().users
        const found = users.find((u) => u.verificationToken === token)
        if (!found) return { error: 'This verification link is invalid or has already been used.' }
        set((s) => ({
          users: s.users.map((u) =>
            u.id === found.id ? { ...u, status: 'active', verificationToken: null } : u
          ),
        }))
        const { password: _, verificationToken: __, ...safeUser } = { ...found, status: 'active', verificationToken: null, customer_id: found.customer_id || null }
        set({ user: safeUser })
        return { user: safeUser }
      },

      resendVerification: (email) => {
        const users = get().users
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.status === 'pending_verification')
        if (!found) return { error: 'No pending account found for this email.' }
        const token = generateToken()
        set((s) => ({
          users: s.users.map((u) => u.id === found.id ? { ...u, verificationToken: token } : u),
        }))
        return { token, email: found.email }
      },

      logout: () => set({ user: null }),

      changePassword: (userId, currentPassword, newPassword) => {
        const users = get().users
        const found = users.find((u) => u.id === userId)
        if (!found)                          return { error: 'User not found.' }
        if (found.password !== currentPassword) return { error: 'Current password is incorrect.' }
        if (newPassword.length < 6)          return { error: 'New password must be at least 6 characters.' }
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, password: newPassword } : u),
        }))
        return { ok: true }
      },

      // Admin user management
      getUsers:      ()              => get().users,

      updateUser: (id, changes, performedBy) => {
        const target = get().users.find((u) => u.id === id)
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...changes } : u) }))
        if (target) get().logActivity('user_updated', `Updated profile for ${target.name} (${target.email})`, performedBy)
      },

      setUserStatus: (id, status, performedBy) => {
        const target = get().users.find((u) => u.id === id)
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, status } : u) }))
        if (target) get().logActivity('status_changed', `${target.name} status changed to ${status}`, performedBy)
      },

      adminResetPassword: (userId, newPassword, performedBy) => {
        if (!newPassword || newPassword.length < 6) return { error: 'Password must be at least 6 characters.' }
        const target = get().users.find((u) => u.id === userId)
        if (!target) return { error: 'User not found.' }
        set((s) => ({ users: s.users.map((u) => u.id === userId ? { ...u, password: newPassword } : u) }))
        get().logActivity('password_reset', `Password reset for ${target.name} (${target.email})`, performedBy || 'Admin')
        return { ok: true }
      },

      createUser:    (data, performedBy)          => {
        const users = get().users
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { error: 'An account with this email already exists.' }
        }
        const newId = makeId(users)
        const role  = data.role || 'customer'
        // Support firstName+surname or legacy name
        const fn   = (data.firstName || '').trim()
        const sn   = (data.surname || '').trim()
        const full = fn && sn ? `${fn} ${sn}` : (data.name || `${fn}${sn}`).trim()
        const newUser = {
          id:                newId,
          email:             data.email.trim().toLowerCase(),
          password:          data.password || 'changeme123',
          firstName:         fn || full.split(' ')[0] || '',
          surname:           sn || full.split(' ').slice(1).join(' ') || '',
          name:              full,
          pronouns:          (data.pronouns || '').trim(),
          phone:             data.phone?.trim() || '',
          role,
          initials:          makeInitials(full),
          status:            'active',
          verificationToken: null,
          customerId:        role === 'customer' ? makeCustomerId(newId) : undefined,
          allowed_pages:     role === 'operations' ? [...ALL_OPS_PAGES] : undefined,
          createdAt:         new Date().toISOString().slice(0, 10),
        }
        set((s) => ({ users: [...s.users, newUser] }))
        get().logActivity('user_created', `New ${role} account created: ${newUser.name} (${newUser.email})`, performedBy || 'Admin')
        return { user: newUser }
      },
    }),
    {
      name: 'online-express-auth',
      version: 5,
      migrate: (persisted, fromVersion) => {
        let state = persisted
        // v2: backfill customerId for any customer user that's missing it
        if (fromVersion < 2) {
          state = {
            ...state,
            users: (state.users || []).map((u) =>
              u.role === 'customer' && !u.customerId
                ? { ...u, customerId: makeCustomerId(u.id) }
                : u
            ),
            user: state.user && state.user.role === 'customer' && !state.user.customerId
              ? { ...state.user, customerId: makeCustomerId(state.user.id) }
              : state.user,
          }
        }
        // v3: backfill allowed_pages for any operations user that's missing it
        if (fromVersion < 3) {
          state = {
            ...state,
            users: (state.users || []).map((u) =>
              u.role === 'operations' && !u.allowed_pages
                ? { ...u, allowed_pages: [...ALL_OPS_PAGES] }
                : u
            ),
          }
        }
        // v5: backfill new registration fields with empty strings
        if (fromVersion < 5) {
          const defaults = { gender: '', town: '', physicalAddress: '', tpin: '', occupation: '' }
          state = {
            ...state,
            users: (state.users || []).map((u) => ({ ...defaults, ...u })),
            user: state.user ? { ...defaults, ...state.user } : state.user,
          }
        }
        // v4: backfill firstName/surname/pronouns from name for all users
        if (fromVersion < 4) {
          const splitName = (name) => {
            const parts = (name || '').trim().split(/\s+/)
            return { firstName: parts[0] || '', surname: parts.slice(1).join(' ') || '' }
          }
          state = {
            ...state,
            users: (state.users || []).map((u) =>
              !u.firstName ? { ...u, ...splitName(u.name), pronouns: u.pronouns || '' } : u
            ),
            user: state.user && !state.user.firstName
              ? { ...state.user, ...splitName(state.user.name), pronouns: state.user.pronouns || '' }
              : state.user,
          }
        }
        return state
      },
    }
  )
)
