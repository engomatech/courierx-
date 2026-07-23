// Shared headers for /api/v1/admin/* endpoints
export const ADMIN_HEADERS = {
  'X-Admin-Token': import.meta.env.VITE_ADMIN_SECRET,
}

export const ADMIN_JSON_HEADERS = {
  ...ADMIN_HEADERS,
  'Content-Type': 'application/json',
}
