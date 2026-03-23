import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Profile field definitions ────────────────────────────────────────────────
const S1_MANDATORY = ['name', 'phone', 'postalCode', 'countryId', 'cityId', 'address']
const S3_MANDATORY = ['sex', 'maritalStatus']
const TOTAL_MANDATORY = S1_MANDATORY.length + S3_MANDATORY.length // 8

// ─── Seed data for U003 (Jane Customer) ──────────────────────────────────────
const SEED_PROFILES = {
  U003: {
    // Section 1 — Basic Details
    name: 'Jane Customer',
    companyName: '',
    phone: '',
    postalCode: '',
    countryId: '',
    cityId: '',
    hubId: '',
    address: '',
    // Section 2 — KYC Details (all optional)
    idNo: '',
    accountHolderName: '',
    accountNo: '',   // auto-assigned, not user-editable
    // Section 3 — Customer KYC Details
    kycWith: '',
    idProofNo: '',
    occupation: '',
    kycCompanyName: '',
    position: '',
    tpin: '',
    sex: '',
    maritalStatus: '',
  },
}

const SEED_WALLETS = {
  U003: {
    balance: 8999.65,
    transactions: [
      {
        id: 'WT001',
        date: '2025-09-26T09:39:00Z',
        txnId: '7214479fa0',
        type: 'credit',
        mode: 'Admin',
        amount: 10000,
        detail: 'Wallet Recharge',
        awb: null,
      },
      {
        id: 'WT002',
        date: '2025-09-26T09:39:00Z',
        txnId: 'fa09a1301f6',
        type: 'debit',
        mode: 'Shipment',
        amount: 622.45,
        detail: 'Shipment Booking',
        awb: 'CX9001234567',
      },
      {
        id: 'WT003',
        date: '2025-10-03T04:54:00Z',
        txnId: '63041d94fb',
        type: 'debit',
        mode: 'Shipment',
        amount: 238.95,
        detail: 'Shipment Booking',
        awb: 'CX9001234568',
      },
      {
        id: 'WT004',
        date: '2025-10-03T05:15:00Z',
        txnId: '8fdc3fa95d',
        type: 'debit',
        mode: 'Shipment',
        amount: 17.15,
        detail: 'Shipment Booking',
        awb: 'CX9001234569',
      },
      {
        id: 'WT005',
        date: '2026-01-07T05:43:00Z',
        txnId: '8bde54974f',
        type: 'debit',
        mode: 'Shipment',
        amount: 121.80,
        detail: 'Shipment Booking',
        awb: 'CX9001234570',
      },
    ],
  },
}

const SEED_CREDITS = {
  U003: { limit: 0, used: 0.0, transactions: [] },
}

const SEED_SHIPMENTS = {
  U003: [],
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useCustomerStore = create(
  persist(
    (set, get) => ({
      profiles: SEED_PROFILES,
      wallets: SEED_WALLETS,
      credits: SEED_CREDITS,
      customerShipments: SEED_SHIPMENTS,

      // ── Profile ──────────────────────────────────────────────────────────────
      getProfile: (userId) => {
        const profiles = get().profiles
        return profiles[userId] || { ...SEED_PROFILES.U003, name: '' }
      },

      saveProfileSection: (userId, sectionData) => {
        set((state) => ({
          profiles: {
            ...state.profiles,
            [userId]: {
              ...(state.profiles[userId] || { ...SEED_PROFILES.U003, name: '' }),
              ...sectionData,
            },
          },
        }))
      },

      getProfileCompletion: (userId) => {
        const profile = get().getProfile(userId)
        const s1Filled = S1_MANDATORY.filter((f) => profile[f] && profile[f].trim?.() !== '').length
        const s3Filled = S3_MANDATORY.filter((f) => profile[f] && profile[f].trim?.() !== '').length
        const totalFilled = s1Filled + s3Filled
        return {
          overall: Math.round((totalFilled / TOTAL_MANDATORY) * 100),
          s1: Math.round((s1Filled / S1_MANDATORY.length) * 100),
          s2: 100, // Section 2 has no mandatory fields — always 100%
          s3: Math.round((s3Filled / S3_MANDATORY.length) * 100),
        }
      },

      // ── Wallet ────────────────────────────────────────────────────────────────
      getWallet: (userId) => {
        const wallets = get().wallets
        return wallets[userId] || { balance: 0, transactions: [] }
      },

      topUpWallet: (userId, amount, txnId) => {
        const ts = new Date().toISOString()
        set((state) => {
          const existing = state.wallets[userId] || { balance: 0, transactions: [] }
          return {
            wallets: {
              ...state.wallets,
              [userId]: {
                balance: +(existing.balance + amount).toFixed(2),
                transactions: [
                  {
                    id: `WT${Date.now()}`,
                    date: ts,
                    txnId,
                    type: 'credit',
                    mode: 'TopUp',
                    amount,
                    detail: 'Wallet Top-Up',
                    awb: null,
                  },
                  ...existing.transactions,
                ],
              },
            },
          }
        })
      },

      deductWallet: (userId, amount, awb) => {
        const ts = new Date().toISOString()
        const txnId = Math.random().toString(36).slice(2, 12)
        set((state) => {
          const existing = state.wallets[userId] || { balance: 0, transactions: [] }
          return {
            wallets: {
              ...state.wallets,
              [userId]: {
                balance: +(existing.balance - amount).toFixed(2),
                transactions: [
                  {
                    id: `WT${Date.now()}`,
                    date: ts,
                    txnId,
                    type: 'debit',
                    mode: 'Shipment',
                    amount,
                    detail: 'Shipment Booking',
                    awb,
                  },
                  ...existing.transactions,
                ],
              },
            },
          }
        })
      },

      // ── Credit ────────────────────────────────────────────────────────────────
      getCredit: (userId) => {
        const credits = get().credits
        return credits[userId] || { limit: 0, used: 0, transactions: [] }
      },

      // ── Customer Shipments ────────────────────────────────────────────────────
      getCustomerShipments: (userId) => {
        const cs = get().customerShipments
        return cs[userId] || []
      },

      addCustomerShipment: (userId, shipment) => {
        set((state) => {
          const existing = state.customerShipments[userId] || []
          return {
            customerShipments: {
              ...state.customerShipments,
              [userId]: [shipment, ...existing],
            },
          }
        })
      },

      updateCustomerShipment: (userId, awb, updates) => {
        set((state) => {
          const existing = state.customerShipments[userId] || []
          return {
            customerShipments: {
              ...state.customerShipments,
              [userId]: existing.map((s) => (s.awb === awb ? { ...s, ...updates } : s)),
            },
          }
        })
      },
    }),
    { name: 'online-express-customer' }
  )
)
