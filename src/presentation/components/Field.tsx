import type { ReactNode } from 'react'

interface Props {
  label: string
  error?: string
  children: ReactNode
}

/** Etiqueta + control + mensaje de error: patrón repetido en todos los formularios. */
export function Field({ label, error, children }: Props) {
  return (
    <label>
      {label}
      {children}
      {error && <span className="error">{error}</span>}
    </label>
  )
}
