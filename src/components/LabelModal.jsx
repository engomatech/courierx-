import { useState } from 'react'
import { Printer, Download, X, Package, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'
import { generateZPL, generateLabelHtml } from '../utils/zpl'
import { formatDate } from '../utils'

// ── Service color helpers ──────────────────────────────────────
const SVC_COLOR = {
  Express:       'bg-orange-100 text-orange-700 border-orange-200',
  International: 'bg-purple-100 text-purple-700 border-purple-200',
  Standard:      'bg-slate-100  text-slate-600  border-slate-200',
}

// ── Label preview (in-browser) ────────────────────────────────
function LabelPreview({ s }) {
  if (!s) return null
  const { awb, sender, receiver, weight, dimensions, serviceType, createdAt } = s
  const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="border-2 border-slate-800 rounded bg-white font-mono text-[11px] leading-tight select-none overflow-hidden"
      style={{ width: 320, minHeight: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-slate-800">
        <span className="text-[13px] font-black tracking-tight text-slate-900">ONLINE EXPRESS</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SVC_COLOR[serviceType] || SVC_COLOR.Standard}`}>
          {serviceType.toUpperCase()}
        </span>
      </div>

      {/* FROM */}
      <div className="px-3 py-2 border-b border-slate-300">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">From</div>
        <div className="font-bold text-slate-900">{sender.name}</div>
        <div className="text-slate-600">{sender.address}</div>
        <div className="text-slate-600">{sender.city}, {sender.country}</div>
        <div className="text-slate-500">Tel: {sender.phone}</div>
      </div>

      {/* TO */}
      <div className="px-3 py-2 border-b-2 border-slate-800">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">To</div>
        <div className="text-[13px] font-black text-slate-900">{receiver.name}</div>
        <div className="text-slate-600">{receiver.address}</div>
        <div className="text-slate-600">{receiver.city}, {receiver.country}</div>
        <div className="text-slate-500">Tel: {receiver.phone}</div>
      </div>

      {/* Package details */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 bg-slate-50">
        <span><span className="text-slate-400">Wt </span><strong>{weight} kg</strong></span>
        <span><span className="text-slate-400">Dims </span><strong>{dimensions.l}×{dimensions.w}×{dimensions.h} cm</strong></span>
        <span className="text-slate-400">{dateStr}</span>
      </div>

      {/* Barcode area */}
      <div className="flex flex-col items-center justify-center py-4 gap-1">
        {/* Visual barcode SVG */}
        <BarcodeSvg value={awb} />
        <div className="text-[13px] font-bold tracking-[3px] text-slate-900 mt-1">{awb}</div>
      </div>
    </div>
  )
}

// ── Minimal visual barcode (Code 39 widths) ───────────────────
function BarcodeSvg({ value }) {
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
  }
  const narrow = 1.8, wide = 4.5
  const rects = []
  let x = 4
  const chars = ('*' + value.toUpperCase() + '*').split('')
  for (const ch of chars) {
    const pat = CODE39[ch] || CODE39['-']
    pat.split('').forEach((b, i) => {
      const w = b === '1' ? wide : narrow
      if (i % 2 === 0) rects.push({ x, w })
      x += w + (i % 2 === 1 ? narrow : 0)
    })
    x += narrow
  }
  const totalW = x + 4
  return (
    <svg width={Math.min(totalW, 290)} height={52} viewBox={`0 0 ${totalW} 52`}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={2} width={r.w} height={48} fill="#1e293b" />
      ))}
    </svg>
  )
}

// ── Print via popup window ────────────────────────────────────
function openPrintWindow(s) {
  const html = generateLabelHtml(s)
  const win = window.open('', '_blank', 'width=480,height=720,menubar=no,toolbar=no,location=no')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

// ── Download .zpl file ────────────────────────────────────────
function downloadZPL(s) {
  const zpl = generateZPL(s)
  const blob = new Blob([zpl], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${s.awb}.zpl`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main modal ────────────────────────────────────────────────
export function LabelModal({ shipment, onClose }) {
  const [printed, setPrinted] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const handlePrint = () => {
    openPrintWindow(shipment)
    setPrinted(true)
    setTimeout(() => setPrinted(false), 2500)
  }

  const handleDownload = () => {
    downloadZPL(shipment)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <Modal open={!!shipment} onClose={onClose} title="Shipment Label" size="md">
      <div className="flex flex-col items-center gap-5">

        {/* AWB pill */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5">
          <Package size={14} className="text-slate-500" />
          <span className="font-mono font-bold text-slate-700 text-sm">{shipment?.awb}</span>
        </div>

        {/* Label preview */}
        {shipment && <LabelPreview s={shipment} />}

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {printed ? (
              <><CheckCircle2 size={15} /> Sent to Print</>
            ) : (
              <><Printer size={15} /> Print Label</>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {downloaded ? (
              <><CheckCircle2 size={15} /> Downloaded</>
            ) : (
              <><Download size={15} /> Download ZPL</>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center max-w-xs">
          <strong>Print Label</strong> opens a 4"×6" print dialog for any printer.{' '}
          <strong>Download ZPL</strong> saves a raw Zebra file for direct thermal printer submission.
        </p>
      </div>
    </Modal>
  )
}
