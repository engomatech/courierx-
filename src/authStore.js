import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SEED_USERS = [
  { id: 'U001', email: 'admin@onlineexpress.com',   password: 'admin123', name: 'Alex Admin',    role: 'admin',      initials: 'AA', status: 'active', createdAt: '2024-01-01', verificationToken: null },
  { id: 'U002', email: 'ops@onlineexpress.com',     password: 'ops123',   name: 'Sam Ops',       role: 'operations', initials: 'SO', status: 'active', createdAt: '2024-01-01', verificationToken: null },
  { id: 'U003', email: 'customer@example.com', password: 'cust123',  name: 'Jane Customer', role: 'customer',   initials: 'JC', status: 'active', createdAt: '2024-01-01', verificationToken: null },
]

function makeInitials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'U'
}

function makeId(users) {
  const nums = users.map((u) => parseInt(u.id.replace('U', ''), 10)).filter((n) => !isNaN(n))
  return 'U' + String((Math.max(0, ...nums) + 1)).padStart(3, '0')
}

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      users: SEED_USERS,

      login: (email, password) => {
        const found = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        if (!found)                                      return { error: 'Invalid email or password.' }
        if (found.status === 'inactive')                 return { error: 'This account has been deactivated. Please contact support.' }
        if (found.status === 'pending_verification')     return { error: 'PENDING_VERIFICATION', email: found.email }
        const { password: _, verificationToken: __, ...safeUser } = found
        set({ user: safeUser })
        return { user: safeUser }
      },

      register: ({ name, email, phone, password }) => {
        const users = get().users
        if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'An account with this email already exists.' }
        }
        const token = generateToken()
        const newUser = {
          id:                makeId(users),
          email:             email.trim().toLowerCase(),
          password,
          name:              name.trim(),
          phone:             phone?.trim() || '',
          role:              'customer',
          initials:          makeInitials(name),
          status:            'pending_verification',
          verificationToken: token,
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
        const { password: _, verificationToken: __, ...safeUser } = { ...found, status: 'active', verificationToken: null }
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

      // Admin user management
      getUsers:      ()              => get().users,
      updateUser:    (id, changes)   => set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...changes } : u) })),
      setUserStatus: (id, status)    => set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, status } : u) })),
      createUser:    (data)          => {
        const users = get().users
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { error: 'An account with this email already exists.' }
        }
        const newUser = {
          id:                makeId(users),
          email:             data.email.trim().toLowerCase(),
          password:          data.password || 'changeme123',
          name:              data.name.trim(),
          phone:             data.phone?.trim() || '',
          role:              data.role || 'customer',
          initials:          makeInitials(data.name),
          status:            'active',
          verificationToken: null,
          createdAt:         new Date().toISOString().slice(0, 10),
        }
        set((s) => ({ users: [...s.users, newUser] }))
        return { user: newUser }
      },
    }),
    { name: 'online-express-auth' }
  )
)
