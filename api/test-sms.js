/**
 * Quick SMS test — run from the api/ directory:
 *   ZAMTEL_SMS_API_KEY=your_key node test-sms.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const { sendSMS } = require('./sms')

const TO      = process.argv[2] || '260965778086'
const MESSAGE = process.argv[3] || 'Online Express: Test SMS from your courier system. If you received this, Zamtel SMS is working!'

;(async () => {
  console.log(`Sending SMS to ${TO}...`)
  console.log(`API Key: ${process.env.ZAMTEL_SMS_API_KEY ? '✓ set' : '✗ MISSING'}`)
  console.log(`Sender:  ${process.env.ZAMTEL_SENDER_ID || 'OnlineExp'}`)
  console.log('')

  try {
    const result = await sendSMS({ to: TO, message: MESSAGE })
    console.log('Result:', result)
    process.exit(result.success ? 0 : 1)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
})()
