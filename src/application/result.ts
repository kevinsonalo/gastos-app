import type { StoreAction } from './state/storeReducer'

export type Errors = Record<string, string>

export type Failure = { ok: false; errors: Errors }

/** Resultado de un comando expuesto a la UI. */
export type Result = { ok: true } | Failure

/** Un caso de uso decide: o rechaza con errores, o devuelve la acción a aplicar. */
export type Decision = { ok: true; action: StoreAction } | Failure

export const OK: Result = { ok: true }

/** Convierte un mapa de errores de validación (campos opcionales) en un Failure. */
export const fail = (errors: Partial<Record<string, string>>): Failure => ({
  ok: false,
  errors: Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined)) as Errors,
})

export const accept = (action: StoreAction): Decision => ({ ok: true, action })
