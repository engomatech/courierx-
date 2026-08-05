/**
 * Background cron jobs — scheduled tasks that run inside the Express process.
 *
 * Checks every hour and runs jobs when due.  No external dependencies needed.
 *
 * Jobs:
 *   weeklyKycReminders — every Monday 09:00 Zambia time (UTC+2 = UTC 07:00)
 *                        Emails all customers with kyc_status in
 *                        ('not_started', 'rejected') who haven't been reminded
 *                        in the last 6 days.
 */

'use strict'

const HOUR = 60 * 60 * 1000

/* ── Weekly KYC reminder ──────────────────────────────────────────────────── */

async function maybeRunKycReminders() {
  const now = new Date()

  // Only fire on Mondays (UTC day 1), between 07:00–12:59 UTC (= 09:00–14:59 Zambia)
  if (now.getUTCDay() !== 1)                           return
  if (now.getUTCHours() < 7 || now.getUTCHours() > 12) return

  const db = require('./db')

  // Idempotency — skip if we already ran today
  const lastRun = db
    .prepare("SELECT value FROM notification_settings WHERE key='_kyc_reminder_last_run'")
    .get()?.value

  if (lastRun) {
    const today = now.toISOString().slice(0, 10)
    if (lastRun.startsWith(today)) return
  }

  console.log('[kyc-reminder] Running weekly KYC reminders…')

  const { sendKycReminders } = require('./mailer')
  const result = await sendKycReminders(db)

  console.log(
    `[kyc-reminder] Done — sent: ${result.sent}, failed: ${result.failed}, skipped: ${result.skipped ?? 0}`
  )

  // Stamp the run so we don't fire again until next week
  db.prepare(
    "INSERT OR REPLACE INTO notification_settings (key, value) VALUES ('_kyc_reminder_last_run', ?)"
  ).run(now.toISOString())
}

// Check every hour
setInterval(
  () => maybeRunKycReminders().catch(e => console.error('[kyc-reminder]', e.message)),
  HOUR
)

// Also check 90 s after startup in case the server was restarted on a Monday morning
setTimeout(
  () => maybeRunKycReminders().catch(e => console.error('[kyc-reminder]', e.message)),
  90_000
)

module.exports = { maybeRunKycReminders }
