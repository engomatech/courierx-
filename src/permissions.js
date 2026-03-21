/**
 * RBAC — Role-Based Access Control
 *
 * Single source of truth for what each role can do.
 * Import `usePermissions()` in any component to check access.
 *
 * Roles:
 *   admin       — full platform access
 *   operations  — ops pipeline only; no system config or user management
 *   customer    — customer portal only; no ops or admin screens
 */

import { useAuthStore } from './authStore'

/* ─────────────────────────────────────────────────────────────
   PERMISSIONS MATRIX
   Each key is a feature flag. Set true for roles that have access.
───────────────────────────────────────────────────────────── */
export const PERMISSIONS = {
  // ── Ops pipeline ─────────────────────────────────────────
  viewOps:             { admin: true,  operations: true,  customer: false, driver: false },
  manageBookings:      { admin: true,  operations: true,  customer: false, driver: false },
  scanParcels:         { admin: true,  operations: true,  customer: false, driver: false },
  manageBags:          { admin: true,  operations: true,  customer: false, driver: false },
  manageManifests:     { admin: true,  operations: true,  customer: false, driver: false },
  manageDelivery:      { admin: true,  operations: true,  customer: false, driver: false },
  viewReports:         { admin: true,  operations: true,  customer: false, driver: false },

  // ── Admin — system config ─────────────────────────────────
  manageUsers:         { admin: true,  operations: false, customer: false, driver: false },
  manageSettings:      { admin: true,  operations: false, customer: false, driver: false },
  manageCarriers:      { admin: true,  operations: false, customer: false, driver: false },
  manageApiKeys:       { admin: true,  operations: false, customer: false, driver: false },
  manageLocations:     { admin: true,  operations: false, customer: false, driver: false },
  manageZones:         { admin: true,  operations: false, customer: false, driver: false },
  manageServices:      { admin: true,  operations: false, customer: false, driver: false },
  managePricing:       { admin: true,  operations: false, customer: false, driver: false },
  viewAuditLog:        { admin: true,  operations: false, customer: false, driver: false },
  resetData:           { admin: true,  operations: false, customer: false, driver: false },

  // ── Customer portal ───────────────────────────────────────
  viewPortal:          { admin: false, operations: false, customer: true,  driver: false },
  bookShipment:        { admin: false, operations: false, customer: true,  driver: false },
  viewOwnShipments:    { admin: false, operations: false, customer: true,  driver: false },
  manageOwnProfile:    { admin: false, operations: false, customer: true,  driver: false },
  viewWallet:          { admin: false, operations: false, customer: true,  driver: false },

  // ── Driver ────────────────────────────────────────────────
  viewDriverApp:       { admin: false, operations: false, customer: false, driver: true  },
  recordDelivery:      { admin: false, operations: false, customer: false, driver: true  },

  // ── Shared ────────────────────────────────────────────────
  trackShipment:       { admin: true,  operations: true,  customer: true,  driver: true  },
}

/* ─────────────────────────────────────────────────────────────
   ROLE METADATA  — labels, colours, descriptions for UI display
───────────────────────────────────────────────────────────── */
export const ROLE_META = {
  admin: {
    label      : 'Admin',
    color      : 'bg-violet-100 text-violet-700',
    badge      : 'bg-violet-600',
    description: 'Full platform access — system config, user management, ops pipeline',
  },
  operations: {
    label      : 'Operations',
    color      : 'bg-blue-100 text-blue-700',
    badge      : 'bg-blue-600',
    description: 'Ops pipeline access — booking, scanning, manifests, delivery',
  },
  customer: {
    label      : 'Customer',
    color      : 'bg-emerald-100 text-emerald-700',
    badge      : 'bg-emerald-600',
    description: 'Customer portal only — book shipments, track, manage profile',
  },
  driver: {
    label      : 'Driver',
    color      : 'bg-green-100 text-green-700',
    badge      : 'bg-green-600',
    description: 'Last-mile delivery — view DRS runs, record POD and NDR in-field',
  },
}

/* ─────────────────────────────────────────────────────────────
   usePermissions()  — hook for component-level access checks

   Usage:
     const { can, role, isAdmin, isOps, isCustomer } = usePermissions()
     if (can('manageUsers')) { ... }
     {can('manageApiKeys') && <button>Generate Key</button>}
───────────────────────────────────────────────────────────── */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'customer'

  function can(permission) {
    const perm = PERMISSIONS[permission]
    if (!perm) return false
    return perm[role] === true
  }

  return {
    can,
    role,
    user,
    isAdmin    : role === 'admin',
    isOps      : role === 'operations',
    isCustomer : role === 'customer',
    roleMeta   : ROLE_META[role] || ROLE_META.customer,
  }
}

/* ─────────────────────────────────────────────────────────────
   defaultRedirect(role)
   Where to send a user after login based on their role.
───────────────────────────────────────────────────────────── */
export function defaultRedirect(role) {
  if (role === 'customer') return '/portal'
  if (role === 'admin')    return '/admin/users'
  if (role === 'driver')   return '/driver'
  return '/ops'
}

/* ─────────────────────────────────────────────────────────────
   PERMISSIONS_TABLE
   Flat array used to render the matrix in the admin UI.
───────────────────────────────────────────────────────────── */
export const PERMISSIONS_TABLE = [
  { group: 'Operations Pipeline',    key: 'viewOps',          label: 'View ops pipeline'          },
  { group: 'Operations Pipeline',    key: 'manageBookings',   label: 'Create & manage bookings'   },
  { group: 'Operations Pipeline',    key: 'scanParcels',      label: 'Scan & receive parcels'     },
  { group: 'Operations Pipeline',    key: 'manageBags',       label: 'Bag & seal parcels'         },
  { group: 'Operations Pipeline',    key: 'manageManifests',  label: 'Create & close manifests'   },
  { group: 'Operations Pipeline',    key: 'manageDelivery',   label: 'DRS / POD / NDR'            },
  { group: 'Operations Pipeline',    key: 'viewReports',      label: 'View reports'               },
  { group: 'System Administration',  key: 'manageUsers',      label: 'Manage users'               },
  { group: 'System Administration',  key: 'manageSettings',   label: 'System settings'            },
  { group: 'System Administration',  key: 'manageCarriers',   label: 'Manage carriers'            },
  { group: 'System Administration',  key: 'manageApiKeys',    label: 'Partner API keys'           },
  { group: 'System Administration',  key: 'manageLocations',  label: 'Locations & zones'          },
  { group: 'System Administration',  key: 'managePricing',    label: 'Pricing & services'         },
  { group: 'System Administration',  key: 'resetData',        label: 'Reset platform data'        },
  { group: 'Customer Portal',        key: 'viewPortal',       label: 'Access customer portal'     },
  { group: 'Customer Portal',        key: 'bookShipment',     label: 'Book shipments'             },
  { group: 'Customer Portal',        key: 'viewOwnShipments', label: 'View own shipments'         },
  { group: 'Customer Portal',        key: 'manageOwnProfile', label: 'Update profile'             },
  { group: 'Customer Portal',        key: 'viewWallet',       label: 'View & top up wallet'       },
  { group: 'Driver App',              key: 'viewDriverApp',    label: 'Access driver app'          },
  { group: 'Driver App',              key: 'recordDelivery',   label: 'Record POD / NDR in-field'  },
  { group: 'Shared',                  key: 'trackShipment',    label: 'Track any shipment'         },
]
