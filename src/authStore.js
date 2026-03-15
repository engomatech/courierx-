import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEMO_USERS = [
  { id: 'U001', email: 'admin@courierx.com',   password: 'admin123', name: 'Alex Admin',    role: 'admin',      initials: 'AA' },
  { id: 'U002', email: 'ops@courierx.com',     password: 'ops123',   name: 'Sam Ops',       role: 'operations', initials: 'SO' },
  { id: 'U003', email: 'customer@example.com', password: 'cust123',  name: 'Jane Customer', role: 'customer',   initials: 'JC' },
]

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const found = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        if (!found) return { error: 'Invalid email or password.' }
        const { password: _, ...safeUser } = found
        set({ user: safeUser })
        return { user: safeUser }
      },
      logout: () => set({ user: null }),
    }),
    { name: 'courier-x-auth' }
  )
)
