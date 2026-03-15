import { useState, useRef } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react'
import { downloadCSV, parseCSV } from '../utils/csvUtils'

export function ImportExportBar({
  templateRows,      // Array of example row objects for the template
  templateFilename,  // e.g. 'cities-template.csv'
  exportRows,        // Current data to export (formatted for CSV)
  exportFilename,    // e.g. 'cities-export.csv'
  onImport,          // (rows: array) => { imported, skipped, errors[] }
}) {
  const fileRef = useRef()
  const [result, setResult] = useState(null)  // { imported, skipped, errors }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const rows = parseCSV(evt.target.result)
      const res  = onImport(rows)
      setResult(res)
      setTimeout(() => setResult(null), 5000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Template download */}
      <button
        type="button"
        title="Download CSV template with example rows"
        onClick={() => downloadCSV(templateFilename, templateRows)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <FileSpreadsheet size={13} />
        Template
      </button>

      {/* Export current data */}
      <button
        type="button"
        title="Export current data as CSV"
        onClick={() => downloadCSV(exportFilename, exportRows)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Download size={13} />
        Export
      </button>

      {/* Import upload */}
      <label
        title="Import records from CSV file"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition-colors"
      >
        <Upload size={13} />
        Import CSV
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      {/* Import result toast */}
      {result && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium animate-pulse ${
          result.errors?.length ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {result.errors?.length
            ? <><XCircle size={13} /> {result.errors[0]}</>
            : <><CheckCircle size={13} /> Imported {result.imported}, skipped {result.skipped} duplicates</>
          }
        </div>
      )}
    </div>
  )
}
