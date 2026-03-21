/**
 * ZPL (Zebra Programming Language) label generator
 * Target: 4" × 6" thermal label @ 203 dpi  →  812 × 1218 dots
 */

const t = (str, max = 35) => String(str || '').substring(0, max)

export function generateZPL(s) {
  const { awb, sender, receiver, weight, dimensions, serviceType, createdAt } = s

  const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const svcTag = serviceType === 'Express'       ? 'EXPRESS'
               : serviceType === 'International' ? 'INTL'
               : 'STD'

  const lines = [
    '^XA',
    '^CI28',           // UTF-8 encoding
    '^LH0,0',
    '^PW812',          // 4 inches wide @ 203 dpi

    // ── Header: company + service ─────────────────────────────────
    '^FO20,20^A0N,38,38^FDONLINE EXPRESS^FS',
    `^FO570,24^GB210,52,52,B^FS`,
    `^FO580,30^A0N,30,30^FR^FD${svcTag}^FS`,

    // ── Divider ───────────────────────────────────────────────────
    '^FO20,82^GB772,3,3^FS',

    // ── FROM block ────────────────────────────────────────────────
    '^FO20,95^A0N,20,20^FDFROM:^FS',
    `^FO20,122^A0N,26,26^FD${t(sender.name)}^FS`,
    `^FO20,155^A0N,21,21^FD${t(sender.address)}^FS`,
    `^FO20,181^A0N,21,21^FD${t(sender.city)}, ${t(sender.country, 20)}^FS`,
    `^FO20,207^A0N,21,21^FDTel: ${t(sender.phone, 20)}^FS`,

    // ── Divider ───────────────────────────────────────────────────
    '^FO20,236^GB772,3,3^FS',

    // ── TO block ──────────────────────────────────────────────────
    '^FO20,250^A0N,20,20^FDTO:^FS',
    `^FO20,278^A0N,32,32^FD${t(receiver.name)}^FS`,
    `^FO20,318^A0N,22,22^FD${t(receiver.address)}^FS`,
    `^FO20,346^A0N,22,22^FD${t(receiver.city)}, ${t(receiver.country, 20)}^FS`,
    `^FO20,374^A0N,22,22^FDTel: ${t(receiver.phone, 20)}^FS`,

    // ── Divider ───────────────────────────────────────────────────
    '^FO20,406^GB772,3,3^FS',

    // ── Package details ───────────────────────────────────────────
    `^FO20,420^A0N,22,22^FDWt: ${weight} kg^FS`,
    `^FO200,420^A0N,22,22^FDDims: ${dimensions.l}×${dimensions.w}×${dimensions.h} cm^FS`,
    `^FO620,420^A0N,22,22^FD${dateStr}^FS`,

    // ── Divider ───────────────────────────────────────────────────
    '^FO20,452^GB772,3,3^FS',

    // ── Barcode (Code 128 auto) ───────────────────────────────────
    `^FO156,466^BCN,120,N,N,N^FD${awb}^FS`,

    // ── AWB text ──────────────────────────────────────────────────
    `^FO196,600^A0N,36,36^FD${awb}^FS`,

    '^XZ',
  ]

  return lines.join('\n')
}

/**
 * Generate a self-contained HTML page for browser printing.
 * Opens in a popup window, calls window.print() automatically.
 */
export function generateLabelHtml(s) {
  const { awb, sender, receiver, weight, dimensions, serviceType, createdAt } = s

  const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const svcColor = serviceType === 'Express'       ? '#ea580c'
                 : serviceType === 'International' ? '#7c3aed'
                 : '#334155'

  // Simple Code-39 style visual bar (decorative — real scanner will read the text AWB)
  // We embed a barcode as an SVG using the AWB characters for the striping pattern.
  // For production, replace with a barcode library; this gives a visual hint.
  const barsHtml = awb
    .split('')
    .map((c) => {
      const w = ((c.charCodeAt(0) % 3) + 1) * 2
      return `<rect x="0" y="0" width="${w}" height="60" fill="#000" />`
    })
    .join('<rect x="0" y="0" width="2" height="60" fill="#fff" />')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Label – ${awb}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 4in 6in; margin: 0; }
  body { width: 4in; height: 6in; font-family: Arial, sans-serif; overflow: hidden; }
  .label { width: 4in; height: 6in; border: 1px solid #000; padding: 10pt; display: flex; flex-direction: column; gap: 0; }
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 6pt; border-bottom: 2px solid #000; }
  .company { font-size: 14pt; font-weight: 900; letter-spacing: -0.5px; }
  .svc-badge { font-size: 10pt; font-weight: 800; color: #fff; background: ${svcColor}; padding: 2pt 7pt; border-radius: 3pt; }
  .block { padding: 5pt 0; border-bottom: 1.5px solid #000; }
  .block-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 2pt; }
  .block-name { font-size: 12pt; font-weight: 700; }
  .block-name.lg { font-size: 14pt; }
  .block-detail { font-size: 9pt; color: #222; line-height: 1.4; }
  .details-row { display: flex; justify-content: space-between; padding: 5pt 0; border-bottom: 1.5px solid #000; font-size: 9pt; }
  .detail-item { display: flex; flex-direction: column; }
  .detail-item .dl { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #555; }
  .detail-item .dv { font-size: 10pt; font-weight: 600; }
  .barcode-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6pt 0 4pt; }
  .barcode-svg { display: block; }
  .awb-text { font-size: 15pt; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 2px; margin-top: 4pt; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="label">

  <div class="header">
    <span class="company">ONLINE EXPRESS</span>
    <span class="svc-badge">${serviceType.toUpperCase()}</span>
  </div>

  <div class="block">
    <div class="block-label">From</div>
    <div class="block-name">${sender.name}</div>
    <div class="block-detail">${sender.address}<br>${sender.city}, ${sender.country}<br>Tel: ${sender.phone}</div>
  </div>

  <div class="block">
    <div class="block-label">To</div>
    <div class="block-name lg">${receiver.name}</div>
    <div class="block-detail">${receiver.address}<br>${receiver.city}, ${receiver.country}<br>Tel: ${receiver.phone}</div>
  </div>

  <div class="details-row">
    <div class="detail-item">
      <span class="dl">Weight</span>
      <span class="dv">${weight} kg</span>
    </div>
    <div class="detail-item">
      <span class="dl">Dimensions</span>
      <span class="dv">${dimensions.l}×${dimensions.w}×${dimensions.h} cm</span>
    </div>
    <div class="detail-item">
      <span class="dl">Date</span>
      <span class="dv">${dateStr}</span>
    </div>
  </div>

  <div class="barcode-area">
    <svg class="barcode-svg" xmlns="http://www.w3.org/2000/svg"
         width="260" height="70" viewBox="0 0 260 70">
      ${generateBarSvg(awb)}
    </svg>
    <div class="awb-text">${awb}</div>
  </div>

</div>
<script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`
}

/**
 * Generates a simple visual barcode SVG representation.
 * Uses Code 39 character widths (narrow=2px, wide=5px) for a realistic look.
 * NOTE: This is visual only — pair with a proper barcode lib for scan accuracy.
 */
function generateBarSvg(text) {
  // Code 39 bit patterns (5 bars, 4 spaces alternating, 1=wide, 0=narrow)
  const CODE39 = {
    '0':'000110100','1':'100100001','2':'001100001','3':'101100000',
    '4':'000110001','5':'100110000','6':'001110000','7':'000100101',
    '8':'100100100','9':'001100100','A':'100001001','B':'001001001',
    'C':'101001000','D':'000011001','E':'100011000','F':'001011000',
    'G':'000001101','H':'100001100','I':'001001100','J':'000011100',
    'K':'100000011','L':'001000011','M':'101000010','N':'000010011',
    'O':'100010010','P':'001010010','Q':'000000111','R':'100000110',
    'S':'001000110','T':'000010110','U':'110000001','V':'011000001',
    'W':'111000000','X':'010010001','Y':'110010000','Z':'011010000',
    '-':'010000101','.':'110000100',' ':'011000100','*':'010010100',
    '$':'010101000','/':'010100010','+':'010001010','%':'000101010',
  }

  const narrow = 2, wide = 5, gap = narrow
  let x = 10
  const rects = []
  const chars = ('*' + text.toUpperCase() + '*').split('')

  for (const ch of chars) {
    const pattern = CODE39[ch] || CODE39['-']
    const bars = pattern.split('')
    bars.forEach((b, i) => {
      const w = b === '1' ? wide : narrow
      if (i % 2 === 0) {
        // bar (black)
        rects.push(`<rect x="${x}" y="5" width="${w}" height="60" fill="#000"/>`)
      }
      // odd = space (white) — skip
      x += w + (i % 2 === 1 ? gap : 0)
    })
    x += gap // inter-character gap
  }

  return rects.join('')
}
