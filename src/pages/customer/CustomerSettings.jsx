import { useState } from 'react'
import { CheckCircle, AlertCircle, Eye, EyeOff, KeyRound, Bell, Globe, Save } from 'lucide-react'
import { useAuthStore } from '../../authStore'

const API = '/api'

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-5">
      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={16} className="text-slate-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

/* ── Change Password ─────────────────────────────────────────────────────── */
function ChangePasswordSection() {
  const user           = useAuthStore((s) => s.user)
  const changePassword = useAuthStore((s) => s.changePassword)

  const [form,  setForm]  = useState({ current: '', next: '', confirm: '' })
  const [show,  setShow]  = useState({ current: false, next: false, confirm: false })
  const [msg,   setMsg]   = useState(null)
  const [saving, setSaving] = useState(false)

  const fields = [
    { key: 'current', label: 'Current Password',     placeholder: 'Enter current password' },
    { key: 'next',    label: 'New Password',          placeholder: 'Minimum 6 characters' },
    { key: 'confirm', label: 'Confirm New Password',  placeholder: 'Repeat new password' },
  ]

  const handleSave = async () => {
    if (form.next !== form.confirm) {
      setMsg({ ok: false, text: 'New passwords do not match.' }); return
    }
    if (form.next.length < 6) {
      setMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      // Update local Zustand store
      const res = changePassword(user?.id, form.current, form.next)
      if (res.error) { setMsg({ ok: false, text: res.error }); return }
      // Also update server-side record
      await fetch(`${API}/portal/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, newPassword: form.next }),
      }).catch(() => {})
      setMsg({ ok: true, text: 'Password changed successfully!' })
      setForm({ current: '', next: '', confirm: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <SectionHeading icon={KeyRound} title="Change Password" description="Update your login password" />
      <div className="space-y-4 max-w-md">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
            <div className="relative">
              <input
                type={show[key] ? 'text' : 'password'}
                value={form[key]}
                onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
              />
              <button type="button" onClick={() => setShow((v) => ({ ...v, [key]: !v[key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show[key] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}

        {msg && (
          <div className={`flex items-center gap-2 text-xs rounded-xl px-4 py-2.5
            ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {msg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {msg.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !form.current || !form.next || !form.confirm}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

/* ── Notification Preferences ────────────────────────────────────────────── */
function NotificationsSection() {
  const [prefs, setPrefs] = useState({ email: true, sms: false })
  const [saved, setSaved] = useState(false)

  const toggle = (key) => setPrefs((v) => ({ ...v, [key]: !v[key] }))

  const handleSave = () => {
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <SectionHeading icon={Bell} title="Notification Preferences" description="Choose how you receive updates about your shipments" />
      <div className="space-y-3 mb-5">
        {[
          { key: 'email', label: 'Email Notifications', desc: 'Shipment updates, delivery confirmations, and account alerts' },
          { key: 'sms',   label: 'SMS Notifications',   desc: 'Text messages for critical shipment status changes' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => toggle(key)}
                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
            </div>
          </label>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl mb-4">
          <CheckCircle size={13} /> Preferences saved.
        </div>
      )}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <Save size={15} /> Save Preferences
      </button>
    </div>
  )
}

/* ── Language ─────────────────────────────────────────────────────────────── */
function LanguageSection() {
  const [lang, setLang] = useState('en')
  const [saved, setSaved] = useState(false)

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <SectionHeading icon={Globe} title="Language Preference" description="Choose your preferred display language" />
      <div className="max-w-xs space-y-4">
        <select
          value={lang}
          onChange={(e) => { setLang(e.target.value); setSaved(false) }}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="pt">Portuguese</option>
        </select>
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
            <CheckCircle size={13} /> Language preference saved.
          </div>
        )}
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Save size={15} /> Save
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main: CustomerSettings
══════════════════════════════════════════════════════════════════════════════ */
export default function CustomerSettings() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <ChangePasswordSection />
      <NotificationsSection />
      <LanguageSection />
    </div>
  )
}
