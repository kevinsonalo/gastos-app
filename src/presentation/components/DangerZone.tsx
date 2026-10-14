import { useState } from 'react'
import type { Result } from '../../application'

interface Props {
  expenseCount: number
  onReset: () => Result
}

/** "Borrar todo" con confirmación en dos pasos: no hay deshacer. */
export function DangerZone({ expenseCount, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)

  const handleReset = () => {
    const result = onReset()
    setConfirming(false)
    setDone(result.ok)
  }

  return (
    <section className="card danger-zone">
      <h2>Borrar todos los datos</h2>
      <p className="muted">
        Elimina todos los gastos y restaura las 8 categorías por defecto. No se puede deshacer: exportá un respaldo
        antes si querés conservarlos.
      </p>

      {!confirming ? (
        <button
          type="button"
          className="danger-button"
          onClick={() => {
            setDone(false)
            setConfirming(true)
          }}
        >
          🗑 Borrar todo
        </button>
      ) : (
        <div className="confirm" role="alertdialog" aria-label="Confirmar borrado">
          <p>
            ¿Seguro? Se eliminarán <strong>{expenseCount} gasto(s)</strong> y las categorías personalizadas.
          </p>
          <div className="actions">
            <button type="button" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button type="button" className="danger-button" onClick={handleReset}>
              Sí, borrar todo
            </button>
          </div>
        </div>
      )}

      {done && (
        <p className="saved" role="status">
          ✓ Datos borrados. La app quedó como recién instalada.
        </p>
      )}
    </section>
  )
}
