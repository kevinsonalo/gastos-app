import { useRef, useState } from 'react'
import { todayISO } from '../domain/dates'
import type { Result } from '../hooks/useExpenseStore'

interface Props {
  onExport: () => string
  onImport: (json: string) => Result
}

export function BackupControls({ onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const handleExport = () => {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastos-respaldo-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!window.confirm('Importar reemplazará todos los datos actuales. ¿Continuar?')) return
    const result = onImport(await file.text())
    setMessage(result.ok ? '✓ Respaldo importado' : Object.values(result.errors)[0])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="backup">
      <button type="button" onClick={handleExport}>Exportar JSON</button>
      <button type="button" onClick={() => fileRef.current?.click()}>Importar JSON</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      {message && <span className="muted" role="status">{message}</span>}
    </div>
  )
}
