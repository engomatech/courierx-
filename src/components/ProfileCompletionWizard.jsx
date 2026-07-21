import { useState } from 'react'
import { CheckCircle, ChevronRight, User, MapPin, ShieldCheck, AlertCircle, Package } from 'lucide-react'
import { useAuthStore } from '../authStore'
import { useCustomerStore } from '../customerStore'
import { useAdminStore } from '../admin/adminStore'

const STEPS = [
  { id: 1, label: 'Personal',  sub: 'Your details',       icon: User },
  { id: 2, label: 'Address',   sub: 'Where you live',     icon: MapPin },
  { id: 3, label: 'Verify',    sub: 'ID & compliance',    icon: ShieldCheck },
]

const KYC_TYPES = [
  'National Registration Card (NRC)',
  'Passport',
  "Driver's Licence",
  'Voter Registration Card',
]

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white'
const sel = inp + ' appearance-none'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProfileCompletionWizard() {
  const user               = useAuthStore((s) => s.user)
  const saveProfileSection = useCustomerStore((s) => s.saveProfileSection)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)
  // Subscribe to profile data so the component re-renders when it changes
  const profileData        = useCustomerStore((s) => s.profiles[user?.id] || {})
  const countries          = useAdminStore((s) => s.countries)
  const cities             = useAdminStore((s) => s.cities)

  const completion = getProfileCompletion(user?.id)

  const [step,  setStep]  = useState(1)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName:   profileData.firstName   || user?.firstName || '',
    surname:     profileData.surname     || user?.surname    || '',
    phone:       profileData.phone       || user?.phone      || '',
    dateOfBirth: profileData.dateOfBirth || '',
    sex:         profileData.sex         || user?.gender     || '',
    houseNo:     profileData.houseNo     || '',
    street:      profileData.street      || '',
    countryId:   profileData.countryId   || '',
    cityId:      profileData.cityId      || '',
    tpin:        profileData.tpin        || user?.tpin        || '',
    kycWith:     profileData.kycWith     || '',
    idProofNo:   profileData.idProofNo   || '',
  })

  // Wizard is only needed if profile is incomplete
  if (!user || user.role !== 'customer' || completion.overall >= 100) return null

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  const filteredCities = cities.filter(
    (c) => c.countryId === form.countryId && c.status !== 'Inactive'
  )

  const validate = () => {
    if (step === 1) {
      if (!form.firstName.trim()) return 'First name is required.'
      if (!form.surname.trim())   return 'Surname is required.'
      if (!form.phone.trim())     return 'Phone number is required.'
      if (!form.dateOfBirth)      return 'Date of birth is required.'
      if (!form.sex)              return 'Gender is required.'
    }
    if (step === 2) {
      if (!form.houseNo.trim())  return 'House / Plot No. is required.'
      if (!form.street.trim())   return 'Street name is required.'
      if (!form.countryId)       return 'Country is required.'
      if (!form.cityId)          return 'City is required.'
    }
    if (step === 3) {
      if (!form.tpin.trim())      return 'TPIN is required.'
      if (!form.kycWith)          return 'Please select an ID type.'
      if (!form.idProofNo.trim()) return 'ID number is required.'
    }
    return ''
  }

  const handleNext = () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    if (step === 1) {
      saveProfileSection(user.id, {
        firstName: form.firstName.trim(),
        surname:   form.surname.trim(),
        phone:     form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        sex:       form.sex,
      })
      setStep(2)
    } else if (step === 2) {
      saveProfileSection(user.id, {
        houseNo:   form.houseNo.trim(),
        street:    form.street.trim(),
        countryId: form.countryId,
        cityId:    form.cityId,
      })
      setStep(3)
    } else {
      saveProfileSection(user.id, {
        tpin:     form.tpin.trim(),
        kycWith:  form.kycWith,
        idProofNo: form.idProofNo.trim(),
      })
      // component re-renders; completion.overall becomes 100 → returns null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — blurred, non-dismissable */}
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-violet-700 to-violet-600 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Complete Your Profile</h2>
              <p className="text-violet-200 text-xs mt-0.5">
                Required before you can use the portal
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-1.5 mb-2">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${Math.round((step / 3) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-violet-200">Step {step} of 3 — {STEPS[step - 1].label}</p>
        </div>

        {/* ── Step indicators ─────────────────────────────────────────── */}
        <div className="flex border-b border-slate-100">
          {STEPS.map((s) => {
            const Icon = s.icon
            const done   = step > s.id
            const active = step === s.id
            return (
              <div
                key={s.id}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors border-b-2
                  ${done   ? 'text-violet-600 border-violet-400' :
                    active ? 'text-slate-800 border-violet-600' :
                             'text-slate-400 border-transparent'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                  ${done ? 'bg-violet-100' : active ? 'bg-violet-50' : 'bg-slate-50'}`}>
                  {done
                    ? <CheckCircle size={14} className="text-violet-600" />
                    : <Icon size={14} className={active ? 'text-violet-600' : 'text-slate-400'} />
                  }
                </div>
                <span>{s.label}</span>
              </div>
            )
          })}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* Step 1 — Personal Details */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" required>
                  <input className={inp} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
                </Field>
                <Field label="Surname" required>
                  <input className={inp} value={form.surname} onChange={(e) => set('surname', e.target.value)} placeholder="Surname" />
                </Field>
              </div>
              <Field label="Phone Number" required>
                <input className={inp} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+260 9XX XXX XXX" />
              </Field>
              <Field label="Date of Birth" required>
                <input className={inp} type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </Field>
              <Field label="Gender" required>
                <select className={sel} value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>
            </>
          )}

          {/* Step 2 — Delivery Address */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="House / Plot No." required>
                  <input className={inp} value={form.houseNo} onChange={(e) => set('houseNo', e.target.value)} placeholder="Plot 123" />
                </Field>
                <Field label="Street" required>
                  <input className={inp} value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="Cairo Road" />
                </Field>
              </div>
              <Field label="Country" required>
                <select
                  className={sel}
                  value={form.countryId}
                  onChange={(e) => { set('countryId', e.target.value); set('cityId', '') }}
                >
                  <option value="">Select country</option>
                  {countries.filter((c) => c.status !== 'Inactive').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="City" required>
                <select
                  className={sel}
                  value={form.cityId}
                  onChange={(e) => set('cityId', e.target.value)}
                  disabled={!form.countryId || filteredCities.length === 0}
                >
                  <option value="">
                    {!form.countryId ? 'Select a country first' : filteredCities.length === 0 ? 'No cities available' : 'Select city'}
                  </option>
                  {filteredCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {/* Step 3 — Verification */}
          {step === 3 && (
            <>
              <Field label="TPIN" required>
                <input
                  className={inp}
                  value={form.tpin}
                  onChange={(e) => set('tpin', e.target.value)}
                  placeholder="Your TPIN number"
                />
              </Field>
              <Field label="ID Type" required>
                <select className={sel} value={form.kycWith} onChange={(e) => set('kycWith', e.target.value)}>
                  <option value="">Select ID type</option>
                  {KYC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="ID Number" required>
                <input
                  className={inp}
                  value={form.idProofNo}
                  onChange={(e) => set('idProofNo', e.target.value)}
                  placeholder="Enter your ID number"
                />
              </Field>
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">
                Your TPIN and ID details are required for customs clearance. They are stored securely and never shared without your consent.
              </p>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-0">
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {step < 3 ? (
              <>Save & Continue <ChevronRight size={16} /></>
            ) : (
              <>Complete Profile <CheckCircle size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
