import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Profile field definitions ────────────────────────────────────────────────
// s1 = Personal Details, s2 = Delivery Address, s3 = KYC (was s3/s4 in UI)
const S1_MANDATORY = ['firstName', 'surname', 'phone', 'dateOfBirth', 'sex']
const S2_MANDATORY = ['houseNo', 'street', 'countryId', 'cityId']
const S3_MANDATORY = ['tpin', 'kycWith', 'idProofNo']
const TOTAL_MANDATORY = S1_MANDATORY.length + S2_MANDATORY.length + S3_MANDATORY.length // 12

// ─── Seed data for U003 (Jane Customer) ──────────────────────────────────────
const SEED_PROFILES = {
  U003: {
    // Section 1 — Personal Details
    firstName: 'Jane',
    surname: 'Customer',
    name: 'Jane Customer',
    pronouns: 'She/Her',
    companyName: '',
    phone: '',
    whatsapp: '',
    dateOfBirth: '',
    sex: '',
    nationality: '',
    // Section 2 — Delivery Address
    houseNo: '',
    street: '',
    address: '',      // town/area — kept for compat
    postalCode: '',
    countryId: '',
    cityId: '',
    hubId: '',
    // Section 3 — KYC & Compliance
    tpin: '',
    kycWith: '',
    idProofNo: '',
    occupation: '',
    kycCompanyName: '',
    position: '',
    maritalStatus: '',
    // Legacy (kept for compat)
    idNo: '',
    accountHolderName: '',
    accountNo: '',
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
        const s2Filled = S2_MANDATORY.filter((f) => profile[f] && profile[f].trim?.() !== '').length
        const s3Filled = S3_MANDATORY.filter((f) => profile[f] && profile[f].trim?.() !== '').length
        const totalFilled = s1Filled + s2Filled + s3Filled
        return {
          overall: Math.round((totalFilled / TOTAL_MANDATORY) * 100),
          s1: Math.round((s1Filled / S1_MANDATORY.length) * 100),
          s2: Math.round((s2Filled / S2_MANDATORY.length) * 100),
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

      // ── Shipment Drafts ────────────────────────────────────────────────────
      getDrafts: (userId) => {
        return (get().shipmentDrafts || {})[userId] || []
      },

      saveDraft: (userId, formData, cost) => {
        const id = 'DRAFT-' + Date.now().toString(36).toUpperCase()
        const draft = {
          id,
          savedAt: new Date().toISOString(),
          cost,
          form: formData,
        }
        set((state) => {
          const existing = (state.shipmentDrafts || {})[userId] || []
          return {
            shipmentDrafts: {
              ...(state.shipmentDrafts || {}),
              [userId]: [draft, ...existing],
            },
          }
        })
        return id
      },

      deleteDraft: (userId, draftId) => {
        set((state) => {
          const existing = (state.shipmentDrafts || {})[userId] || []
          return {
            shipmentDrafts: {
              ...(state.shipmentDrafts || {}),
              [userId]: existing.filter((d) => d.id !== draftId),
            },
          }
        })
      },
    }),
    { name: 'online-express-customer' }
  )
)
