import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './authStore'
import { Layout } from './components/Layout'
import { AdminLayout } from './admin/AdminLayout'

// ── Public pages ────────────────────────────────────────────
import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import TrackShipment  from './pages/TrackShipment'
import CustomerPortal from './pages/CustomerPortal'

// ── Customer portal sub-pages ───────────────────────────────
import CustomerDashboard      from './pages/customer/CustomerDashboard'
import CustomerShipments      from './pages/customer/CustomerShipments'
import CustomerRateCalculator from './pages/customer/CustomerRateCalculator'
import CustomerWallet         from './pages/customer/CustomerWallet'
import CustomerHubLocations   from './pages/customer/CustomerHubLocations'
import CustomerProfile        from './pages/customer/CustomerProfile'

// ── Ops pages ──────────────────────────────────────────────
import Dashboard          from './pages/Dashboard'
import Booking            from './pages/Booking'
import PRS                from './pages/PRS'
import InboundScan        from './pages/InboundScan'
import BagManagement      from './pages/BagManagement'
import ManifestManagement from './pages/ManifestManagement'
import HubInbound         from './pages/HubInbound'
import DRS                from './pages/DRS'
import Delivery           from './pages/Delivery'
import Reports            from './pages/Reports'

// ── Admin pages ────────────────────────────────────────────
import Countries          from './admin/pages/location/Countries'
import States             from './admin/pages/location/States'
import Cities             from './admin/pages/location/Cities'
import PinCodes           from './admin/pages/location/PinCodes'
import InternationalZones from './admin/pages/zones/InternationalZones'
import DomesticZones      from './admin/pages/zones/DomesticZones'
import ShippingServices   from './admin/pages/services/ShippingServices'
import ServicePricing     from './admin/pages/services/ServicePricing'
import Settings           from './admin/pages/settings/Settings'
import Users              from './admin/pages/users/Users'

// ── Auth guard ──────────────────────────────────────────────
function RequireAuth({ roles, children }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'customer' ? '/portal' : '/ops'} replace />
  }
  return children
}

// ── Root: landing or redirect if logged in ──────────────────
function RootPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Landing />
  if (user.role === 'customer') return <Navigate to="/portal" replace />
  return <Navigate to="/ops" replace />
}

// ── Login: redirect if already authenticated ────────────────
function LoginPage() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to={user.role === 'customer' ? '/portal' : '/ops'} replace />
  return <Login />
}

// ── Register: redirect if already authenticated ─────────────
function RegisterPage() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/portal" replace />
  return <Register />
}

// ── Customer portal (violet sidebar, /portal/*) ─────────────
function PortalApp() {
  return (
    <CustomerPortal>
      <Routes>
        <Route index                  element={<CustomerDashboard />} />
        <Route path="shipments"       element={<CustomerShipments />} />
        <Route path="rate-calculator" element={<CustomerRateCalculator />} />
        <Route path="wallet"          element={<CustomerWallet />} />
        <Route path="hubs"            element={<CustomerHubLocations />} />
        <Route path="profile"         element={<CustomerProfile />} />
      </Routes>
    </CustomerPortal>
  )
}

// ── Ops section (slate sidebar, /ops/*) ─────────────────────
function OpsApp() {
  return (
    <Layout>
      <Routes>
        <Route index               element={<Dashboard />} />
        <Route path="booking"      element={<Booking />} />
        <Route path="prs"          element={<PRS />} />
        <Route path="inbound-scan" element={<InboundScan />} />
        <Route path="bags"         element={<BagManagement />} />
        <Route path="manifests"    element={<ManifestManagement />} />
        <Route path="hub-inbound"  element={<HubInbound />} />
        <Route path="drs"          element={<DRS />} />
        <Route path="delivery"     element={<Delivery />} />
        <Route path="reports"      element={<Reports />} />
      </Routes>
    </Layout>
  )
}

// ── Admin section (violet sidebar, /admin/*) ────────────────
function AdminApp() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="locations/countries" replace />} />
        <Route path="locations/countries"  element={<Countries />} />
        <Route path="locations/states"     element={<States />} />
        <Route path="locations/cities"     element={<Cities />} />
        <Route path="locations/pincodes"   element={<PinCodes />} />
        <Route path="zones/international"  element={<InternationalZones />} />
        <Route path="zones/domestic"       element={<DomesticZones />} />
        <Route path="services/pricing"     element={<ServicePricing />} />
        <Route path="services"             element={<ShippingServices />} />
        <Route path="settings/:section"    element={<Settings />} />
        <Route path="settings"             element={<Navigate to="settings/general" replace />} />
        <Route path="users"                element={<Users />} />
      </Routes>
    </AdminLayout>
  )
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<RootPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track"    element={<TrackShipment />} />

        {/* Customer portal */}
        <Route path="/portal/*" element={
          <RequireAuth roles={['customer']}>
            <PortalApp />
          </RequireAuth>
        } />

        {/* Ops — admin + operations roles */}
        <Route path="/ops/*" element={
          <RequireAuth roles={['admin', 'operations']}>
            <OpsApp />
          </RequireAuth>
        } />

        {/* Admin — admin role only */}
        <Route path="/admin/*" element={
          <RequireAuth roles={['admin']}>
            <AdminApp />
          </RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
