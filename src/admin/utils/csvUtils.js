// ── CSV Download ──────────────────────────────────────────
export function downloadCSV(filename, rows) {
  if (!rows?.length) { alert('No data to download.'); return }
  const headers = Object.keys(rows[0])
  const escape  = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV Parse ─────────────────────────────────────────────
export function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0]).map((h) => h.trim())
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const vals = splitCSVLine(l)
      return headers.reduce((obj, h, i) => {
        obj[h] = (vals[i] ?? '').trim()
        return obj
      }, {})
    })
}

function splitCSVLine(line) {
  const vals = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (line[i] === ',' && !inQ) {
      vals.push(cur); cur = ''
    } else {
      cur += line[i]
    }
  }
  vals.push(cur)
  return vals
}
