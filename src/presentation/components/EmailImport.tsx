import { useEffect, useRef, useState } from 'react'
import type { EmailFile, EmailImportOptions, EmailImportReport } from '../../application'

const EMAIL_EXTENSIONS = /\.(eml|html?|txt)$/i
const MAX_SKIPPED_SHOWN = 8

interface Props {
  onImport: (files: EmailFile[], options: EmailImportOptions) => EmailImportReport
}

/**
 * Importa notificaciones de BAC desde una carpeta de correos descargados (.eml, .html, .txt).
 * Los archivos se leen en el navegador: no se suben a ningún servidor.
 */
export function EmailImport({ onImport }: Props) {
  const folderRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const [usdRate, setUsdRate] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<EmailImportReport | null>(null)

  // `webkitdirectory` (elegir carpeta) no está en los tipos de React: se agrega al montar.
  useEffect(() => {
    folderRef.current?.setAttribute('webkitdirectory', '')
  }, [])

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setBusy(true)
    try {
      const selected = Array.from(list).filter((f) => EMAIL_EXTENSIONS.test(f.name))
      const files = await Promise.all(selected.map(async (f) => ({ name: f.name, content: await f.text() })))
      const rate = Number(usdRate.replace(',', '.'))
      setReport(onImport(files, { usdRate: rate > 0 ? rate : undefined }))
    } finally {
      setBusy(false)
      if (folderRef.current) folderRef.current.value = ''
      if (filesRef.current) filesRef.current.value = ''
    }
  }

  return (
    <section className="card">
      <h2>Importar correos de BAC</h2>
      <p className="muted">
        Elegí la carpeta donde descargaste las notificaciones de transacción (.eml desde Gmail con "Descargar
        mensaje", o .html). Cada compra se registra como gasto con su categoría sugerida; reimportar la misma carpeta
        no duplica gastos.
      </p>

      <div className="import-row">
        <label className="inline-field">
          Tipo de cambio USD (opcional)
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 505"
            value={usdRate}
            onChange={(e) => setUsdRate(e.target.value)}
          />
        </label>
        <button type="button" className="primary" disabled={busy} onClick={() => folderRef.current?.click()}>
          📁 Elegir carpeta
        </button>
        <button type="button" disabled={busy} onClick={() => filesRef.current?.click()}>
          Elegir archivos
        </button>
        <input ref={folderRef} type="file" hidden multiple onChange={(e) => handleFiles(e.target.files)} />
        <input
          ref={filesRef}
          type="file"
          hidden
          multiple
          accept=".eml,.html,.htm,.txt"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {busy && <p className="muted">Leyendo correos…</p>}

      {report && (
        <div className="import-report" role="status">
          <p>
            <strong>{report.imported}</strong> gasto(s) importado(s) de {report.read} archivo(s)
            {report.duplicates > 0 && <> · {report.duplicates} ya existían</>}
            {report.skipped.length > 0 && <> · {report.skipped.length} omitido(s)</>}
          </p>
          {report.skipped.length > 0 && (
            <ul className="skipped">
              {report.skipped.slice(0, MAX_SKIPPED_SHOWN).map((s) => (
                <li key={s.file}>
                  <code>{s.file}</code>: {s.reason}
                </li>
              ))}
              {report.skipped.length > MAX_SKIPPED_SHOWN && <li>… y {report.skipped.length - MAX_SKIPPED_SHOWN} más</li>}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
