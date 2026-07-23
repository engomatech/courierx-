import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Profile field definitions ────────────────────────────────────────────────
// s1 = Personal Details, s2 = Delivery Address, s3 = KYC (was s3/s4 in UI)
const S1_MANDATORY = ['firstName', 'surname', 'phone', 'dateOfBirth', 'sex']
const S2_MANDATORY = ['houseNo', 'street', 'countryId', 'cityId']
const S3_MANDATORY = ['tpin', 'kycWith', 'idProofNo']
const TOTAL_MANDATORY = S1_MANDATORY.length + S2_MANDATORY.length + S3_MANDATORY.length // 12

// ─── Blank profile template — used as fallback for users with no saved profile ─
const EMPTY_PROFILE = {
  firstName: '', surname: '', name: '', pronouns: '',
  companyName: '', phone: '', whatsapp: '', dateOfBirth: '', sex: '', nationality: '',
  houseNo: '', street: '', address: '', postalCode: '', countryId: '', cityId: '', hubId: '',
  tpin: '', kycWith: '', idProofNo: '', occupation: '', kycCompanyName: '', position: '', maritalStatus: '',
  idNo: '', accountHolderName: '', accountNo: '',
}

// ─── Seed profiles ────────────────────────────────────────────────────────────
const SEED_PROFILES = {
  U003: {
    firstName: 'Jane', surname: 'Customer', name: 'Jane Customer', pronouns: 'She/Her',
    companyName: '', phone: '', whatsapp: '', dateOfBirth: '', sex: '', nationality: '',
    houseNo: '', street: '', address: '', postalCode: '', countryId: '', cityId: '', hubId: '',
    tpin: '', kycWith: '', idProofNo: '', occupation: '', kycCompanyName: '', position: '', maritalStatus: '',
    idNo: '', accountHolderName: '', accountNo: '',
  },
  U006: {
    firstName: 'Chipo', surname: 'Mwanza', name: 'Chipo Mwanza', pronouns: 'She/Her',
    companyName: '', phone: '+260977123456', whatsapp: '+260977123456', dateOfBirth: '1992-04-15', sex: 'Female', nationality: 'Zambian',
    houseNo: '14', street: 'Cairo Road', address: 'Lusaka Central', postalCode: '10101', countryId: 'ZM', cityId: 'LSK', hubId: 'H001',
    tpin: '1003456789', kycWith: 'NRC', idProofNo: '123456/78/1', occupation: 'Accountant', kycCompanyName: '', position: '', maritalStatus: 'Single',
    idNo: '', accountHolderName: 'Chipo Mwanza', accountNo: '',
  },
  U007: {
    firstName: 'Bwalya', surname: 'Mutale', name: 'Bwalya Mutale', pronouns: '',
    companyName: 'Mutale Enterprises', phone: '+260955987654', whatsapp: '', dateOfBirth: '1985-09-22', sex: 'Male', nationality: 'Zambian',
    houseNo: '7B', street: 'Independence Avenue', address: 'Ndola', postalCode: '10101', countryId: 'ZM', cityId: 'NDA', hubId: 'H002',
    tpin: '1007890123', kycWith: 'Passport', idProofNo: 'ZM2019001234', occupation: 'Business Owner', kycCompanyName: 'Mutale Enterprises', position: 'Director', maritalStatus: 'Married',
    idNo: '', accountHolderName: 'Bwalya Mutale', accountNo: '',
  },
  U008: {
    firstName: 'Temwani', surname: 'Phiri', name: 'Temwani Phiri', pronouns: 'She/Her',
    companyName: '', phone: '+260966543210', whatsapp: '+260966543210', dateOfBirth: '1998-02-08', sex: 'Female', nationality: 'Zambian',
    houseNo: '3', street: 'Buteko Avenue', address: 'Lusaka West', postalCode: '10101', countryId: 'ZM', cityId: 'LSK', hubId: 'H001',
    tpin: '', kycWith: '', idProofNo: '', occupation: 'Student', kycCompanyName: '', position: '', maritalStatus: '',
    idNo: '', accountHolderName: '', accountNo: '',
  },
  U009: {
    firstName: 'Mwila', surname: 'Bupe', name: 'Mwila Bupe', pronouns: '',
    companyName: '', phone: '+260978001122', whatsapp: '+260978001122', dateOfBirth: '1990-07-30', sex: 'Male', nationality: 'Zambian',
    houseNo: '22', street: 'Kafue Road', address: 'Chilenje', postalCode: '10101', countryId: 'ZM', cityId: 'LSK', hubId: 'H001',
    tpin: '1009112233', kycWith: 'NRC', idProofNo: '567890/90/1', occupation: 'Engineer', kycCompanyName: '', position: '', maritalStatus: 'Married',
    idNo: '', accountHolderName: 'Mwila Bupe', accountNo: '',
  },
  U010: {
    firstName: 'Grace', surname: 'Lungu', name: 'Grace Lungu', pronouns: 'She/Her',
    companyName: 'GL Imports', phone: '+260211445566', whatsapp: '', dateOfBirth: '1980-11-05', sex: 'Female', nationality: 'Zambian',
    houseNo: '1', street: 'Lumumba Road', address: 'Kitwe', postalCode: '20100', countryId: 'ZM', cityId: 'KWE', hubId: 'H002',
    tpin: '1010445566', kycWith: 'NRC', idProofNo: '234567/80/1', occupation: 'Import/Export', kycCompanyName: 'GL Imports', position: 'Owner', maritalStatus: 'Married',
    idNo: '', accountHolderName: 'Grace Lungu', accountNo: '',
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
        // Use EMPTY_PROFILE (not U003 seed) so authStore registration fallbacks work correctly
        return profiles[userId] || { ...EMPTY_PROFILE }
      },

      saveProfileSection: (userId, sectionData) => {
        set((state) => ({
          profiles: {
            ...state.profiles,
            [userId]: {
              ...(state.profiles[userId] || { ...EMPTY_PROFILE }),
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
