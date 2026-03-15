import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, X, CheckCircle, CreditCard, Loader, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { useCustomerStore } from '../../customerStore'
import { generateId } from '../../utils'

// ── Top-Up Modal ──────────────────────────────────────────────────────────────
function TopUpModal({ onClose, userId, currentBalance }) {
  const topUpWallet          = useCustomerStore((s) => s.topUpWallet)
  const getProfileCompletion = useCustomerStore((s) => s.getProfileCompletion)

  const completion  = getProfileCompletion(userId)
  const isProfileOk = completion.overall >= 100

  const QUICK_AMOUNTS = [500, 1000, 2500, 5000]
  const [amount,     setAmount]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)

  const numAmount = +amount || 0

  const handleTopUp = async () => {
    if (numAmount <= 0) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    topUpWallet(userId, numAmount, generateId('TXN'))
    setSubmitting(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Funds Added!</h3>
          <p className="text-slate-500 text-sm mb-1">
            <span className="font-semibold text-emerald-700">ZK {numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> has been added to your wallet.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            New balance: ZK {(currentBalance + numAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <button onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-slate-900">Top Up Wallet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {!isProfileOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Complete your profile before topping up your wallet.</span>
            </div>
          )}

          {/* Current balance */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Current Balance</span>
            <span className="font-bold text-slate-800">
              ZK {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Quick amounts */}
          <div>
            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide block mb-2">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-colors
                    ${+amount === q
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-400 hover:text-violet-700'}`}
                >
                  {q >= 1000 ? `${q / 1000}K` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide block mb-1.5">Or Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">ZK</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
              />
            </div>
          </div>

          {numAmount > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">After top-up</span>
              <span className="font-bold text-violet-700">
                ZK {(currentBalance + numAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <button
            disabled={numAmount <= 0 || submitting || !isProfileOk}
            onClick={handleTopUp}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader size={16} className="animate-spin" /> Processing…</>
              : <><CreditCard size={16} /> Add Funds {numAmount > 0 ? `(ZK ${numAmount.toLocaleString()})` : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main: CustomerWallet ──────────────────────────────────────────────────────
export default function CustomerWallet() {
  const user    = useAuthStore((s) => s.user)
  const getWallet = useCustomerStore((s) => s.getWallet)
  const getCredit = useCustomerStore((s) => s.getCredit)

  const [activeTab,   setActiveTab]   = useState('Wallet')
  const [showTopUp,   setShowTopUp]   = useState(false)

  const wallet = getWallet(user?.id)
  const credit = getCredit(user?.id)

  const fmtDate = (d) => new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', '')

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Account Transactions</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your wallet balance and view transaction history.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b">
        {['Wallet', 'Credit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === tab
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Wallet tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'Wallet' && (
        <div className="space-y-5">
          {/* Balance card */}
          <div className="bg-white rounded-2xl border p-5 flex items-start justify-between shadow-sm max-w-sm">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Wallet size={14} /> Wallet Balance
              </div>
              <div className="text-3xl font-extrabold text-red-600">
                ZK {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <TrendingUp size={15} /> Top Up
            </button>
          </div>

          {/* Transactions table */}
          <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold text-slate-700">Wallet History</h3>
            </div>
            {wallet.transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No transactions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Entry Date</th>
                      <th className="px-4 py-3 text-left">Transaction ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Payment Mode</th>
                      <th className="px-4 py-3 text-left">Payment Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wallet.transactions.map((t, i) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(t.date)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-700">{t.txnId}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm">
                          <span className={t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                            {t.type === 'credit' ? '+' : '-'}ZK{t.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{t.mode}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Credit tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'Credit' && (
        <div className="space-y-5">
          {/* Credit limit card */}
          <div className="bg-white rounded-2xl border p-5 max-w-sm shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <CreditCard size={14} /> Credit Limit
            </div>
            <div className="text-3xl font-extrabold text-red-600">
              ZK {credit.limit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Used Credit: ZK {credit.used.toFixed(2)}
            </div>
          </div>

          {/* Total / Used stat cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="bg-white rounded-2xl border p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Total Limit</div>
              <div className="text-lg font-extrabold text-slate-900">ZK{credit.limit}</div>
            </div>
            <div className="bg-white rounded-2xl border p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Used Limit</div>
              <div className="text-lg font-extrabold text-slate-900">ZK{credit.used.toFixed(2)}</div>
            </div>
          </div>

          {/* Credit transactions */}
          <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold text-slate-700">Credit History</h3>
            </div>
            {credit.transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Record Not Found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Entry Date</th>
                      <th className="px-4 py-3 text-left">Transaction ID</th>
                      <th className="px-4 py-3 text-left">Shipment ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Payment Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credit.transactions.map((t, i) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 text-xs">{fmtDate(t.date)}</td>
                        <td className="px-4 py-3 text-xs font-mono">{t.txnId}</td>
                        <td className="px-4 py-3 text-xs font-mono">{t.awb || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-xs">
                          <span className={t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                            {t.type === 'credit' ? '+' : '-'}ZK{t.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top-Up modal */}
      {showTopUp && (
        <TopUpModal
          userId={user?.id}
          currentBalance={wallet.balance}
          onClose={() => setShowTopUp(false)}
        />
      )}
    </div>
  )
}
