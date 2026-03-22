/**
 * JoinPortal — /portal/join?token=xxx
 *
 * Public page (no login required). Sent to auto-created customers via invitation email.
 * The token identifies the customer. They set a password + complete KYC here.
 *
 * Flow:
 *  1. Load customer info from token (GET /api/v1/admin/customers/join/:token)
 *  2. Show form: name, email (read-only), password, DOB, address, ID type, ID number, ID doc upload
 *  3. Submit: POST /api/v1/admin/customers/:id/kyc/submit (multipart)
 *             then authStore.register({ name, email, password, customer_id })
 *             then navigate to /portal/profile
 */

import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../authStore'
import {
  Package, Loader2, CheckCircle2, AlertCircle, Upload,
  Eye, EyeOff, Shield, FileText, User, Calendar,
  MapPin, Hash, Lock,
} from 'lucide-react'

const DOC_TYPES = ['NRC', 'Passport', 'Driving Licence', 'TPIN Certificate']

/* ── Field wrapper ── */
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

/* ── Text input ── */
function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
      <input
        className={`w-full border border-slate-200 rounded-lg py-2.5 pr-3 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                    ${Icon ? 'pl-9' : 'pl-3'}
                    ${props.disabled ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
        {...props}
      />
    </div>
  )
}

export default function JoinPortal() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const register       = useAuthStore(s => s.register)
  const token          = searchParams.get('token')

  // Token validation
  const [customer,    setCustomer]    = useState(null)
  const [tokenError,  setTokenError]  = useState(null)
  const [tokenLoading,setTokenLoading]= useState(true)

  // Form state
  const [name,          setName]          = useState('')
  const [password,      setPassword]      = useState('')
  const [confirmPwd,    setConfirmPwd]    = useState('')
  const [showPwd,       setShowPwd]       = useState(false)
  const [dob,           setDob]           = useState('')
  const [address,       setAddress]       = useState('')
  const [docType,       setDocType]       = useState('NRC')
  const [nationalId,    setNationalId]    = useState('')
  const [docFile,       setDocFile]       = useState(null)
  const [docError,      setDocError]      = useState('')

  // Submission
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [done,        setDone]        = useState(false)

  /* ── Load customer from token ── */
  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found in this link.')
      setTokenLoading(false)
      return
    }
    fetch(`/api/v1/admin/customers/join/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.message || 'Invalid token')
        setCustomer(d)
        setName(d.name || '')
        setTokenLoading(false)
      })
      .catch(e => {
        setTokenError(e.message)
        setTokenLoading(false)
      })
  }, [token])

  /* ── File validation ── */
  function handleFile(e) {
    const file = e.target.files?.[0]
    setDocError('')
    if (!file) { setDocFile(null); return }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setDocError('Only JPG, PNG, or PDF files are accepted.')
      setDocFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocError('File must be smaller than 5 MB.')
      setDocFile(null)
      return
    }
    setDocFile(file)
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError(null)

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPwd) {
      setSubmitError('Passwords do not match.')
      return
    }
    if (!docFile) {
      setSubmitError('Please upload a photo or scan of your ID document.')
      return
    }

    setSubmitting(true)
    try {
      // Step 1: Submit KYC with document
      const formData = new FormData()
      formData.append('national_id',       nationalId)
      formData.append('kyc_document_type', docType)
      formData.append('date_of_birth',     dob)
      formData.append('physical_address',  address)
      formData.append('name',              name)
      formData.append('kyc_document',      docFile)

      const kycRes = await fetch(`/api/v1/admin/customers/${customer.id}/kyc/submit`, {
        method: 'POST',
        body  : formData,
      })
      const kycData = await kycRes.json()
      if (!kycRes.ok) throw new Error(kycData.message || 'KYC submission failed.')

      // Step 2: Register portal account
      const regResult = register({
        name,
        email      : customer.email,
        password,
        phone      : customer.phone || '',
        customer_id: customer.id,
      })
      if (regResult?.error) throw new Error(regResult.error)

      // Step 3: Link portal_user_id back to customer
      // (register returns user — we patch the customer with the portal user ID)
      // This is best-effort; KYC is already submitted so don't fail hard
      try {
        const auth = JSON.parse(localStorage.getItem('auth-store') || '{}')
        const userId = auth?.state?.user?.id
        if (userId) {
          await fetch(`/api/v1/admin/customers/${customer.id}`, {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ portal_user_id: userId }),
          })
        }
      } catch (_) { /* non-critical */ }

      setDone(true)
      setTimeout(() => navigate('/portal/profile'), 2500)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── States ── */
  if (tokenLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-300">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Verifying your invitation…</span>
      </div>
    </div>
  )

  if (tokenError) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Invitation Link Invalid</h1>
        <p className="text-slate-500 text-sm mb-6">{tokenError}</p>
        <p className="text-slate-400 text-xs">
          Please contact Online Express for a new invitation link.<br />
          📞 +260 975 525 181 &nbsp;·&nbsp;
          <a href="mailto:zamaccounts@onlineexpress.co.zm" className="text-violet-600">zamaccounts@onlineexpress.co.zm</a>
        </p>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Profile Submitted!</h1>
        <p className="text-slate-500 text-sm mb-4">
          Your identity documents are under review. We'll notify you once your account is verified.
        </p>
        <p className="text-slate-400 text-xs">Redirecting to your dashboard…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col">

      {/* Nav */}
      <header className="px-6 py-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <Package className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg">Online Express</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📦</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              Welcome, {customer.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-400">
              A parcel from <span className="text-violet-300 font-medium">{customer.created_from}</span> is on its way to you.
              Complete your profile to receive it.
            </p>
          </div>

          {/* KYC info banner */}
          <div className="bg-violet-900/40 border border-violet-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-violet-200 text-sm font-semibold">Identity Verification Required</p>
              <p className="text-violet-300/80 text-xs mt-1">
                As a compliance requirement, all customers must verify their identity before we can process your delivery.
                This is a one-time process.
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            <form onSubmit={handleSubmit}>
              {/* Section: Account Setup */}
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Account Setup
                </h2>
                <div className="mt-4 space-y-4">
                  <Field label="Full Name" required>
                    <Input icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full legal name" required />
                  </Field>
                  <Field label="Email Address">
                    <Input value={customer.email} disabled readOnly />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Create Password" required>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          required minLength={8}
                          className="w-full border border-slate-200 rounded-lg py-2.5 pl-9 pr-10 text-sm text-slate-800
                                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
                        />
                        <button type="button" onClick={() => setShowPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Confirm Password" required>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={e => setConfirmPwd(e.target.value)}
                        placeholder="Repeat password"
                        required
                        className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-800
                                   placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Section: Personal Details */}
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Personal Details
                </h2>
                <div className="mt-4 space-y-4">
                  <Field label="Date of Birth" required>
                    <Input icon={Calendar} type="date" value={dob} onChange={e => setDob(e.target.value)} required max={new Date().toISOString().slice(0,10)} />
                  </Field>
                  <Field label="Physical Address" required hint="Street address where you live — not a PO Box">
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. 14 Cairo Road, Longacres, Lusaka"
                      required rows={2}
                      className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-800
                                 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
                    />
                  </Field>
                </div>
              </div>

              {/* Section: KYC Document */}
              <div className="px-6 py-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Identity Document
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Document Type" required>
                      <select
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-800
                                   focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
                      >
                        {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="ID Number" required>
                      <Input icon={Hash} value={nationalId} onChange={e => setNationalId(e.target.value)}
                        placeholder="e.g. 123456/78/1" required />
                    </Field>
                  </div>

                  {/* File upload */}
                  <Field label="Upload ID Document" required hint="Clear photo or scan — JPG, PNG, or PDF · max 5 MB">
                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors
                      ${docFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'}`}>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} className="hidden" />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                        ${docFile ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        {docFile
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          : <Upload className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                      <div>
                        {docFile
                          ? <p className="text-sm font-medium text-emerald-700">{docFile.name}</p>
                          : <p className="text-sm text-slate-500">Click to select file</p>
                        }
                        {docFile && <p className="text-xs text-emerald-600 mt-0.5">{(docFile.size / 1024).toFixed(0)} KB</p>}
                      </div>
                    </label>
                    {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
                  </Field>
                </div>
              </div>

              {/* Error + Submit */}
              <div className="px-6 pb-6">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold
                             py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    : <><Shield className="w-4 h-4" /> Submit Profile & Verify Identity</>
                  }
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Already have an account?{' '}
                  <Link to="/login" className="text-violet-500 hover:text-violet-700">Sign in →</Link>
                </p>
              </div>
            </form>

          </div>
        </div>
      </main>

      <footer className="text-center text-slate-600 text-xs py-4">
        © {new Date().getFullYear()} Online Express · Your data is protected and used only for identity verification.
      </footer>
    </div>
  )
}
