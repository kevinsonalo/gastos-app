import type { Category, Expense } from '../../domain'
import type { Clock } from '../ports/system'
import { accept, fail, type Decision } from '../result'
import type { StoreState } from '../state/storeReducer'

export const BACKUP_VERSION = 1

type ParseResult = { ok: true; state: StoreState } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function isCategory(v: unknown): v is Category {
  return isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.color === 'string'
}

function isExpense(v: unknown): v is Expense {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof v.amount === 'number' &&
    typeof v.description === 'string' &&
    typeof v.categoryId === 'string' &&
    typeof v.date === 'string'
  )
}

/** Valida un respaldo JSON antes de reemplazar el estado. */
export function parseBackup(json: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' }
  }
  if (!isObj(data) || !Array.isArray(data.categories) || !Array.isArray(data.expenses)) {
    return { ok: false, error: 'Formato de respaldo no reconocido.' }
  }
  if (!data.categories.every(isCategory) || !data.expenses.every(isExpense)) {
    return { ok: false, error: 'El respaldo contiene registros inválidos.' }
  }
  const ids = new Set(data.categories.map((c) => c.id))
  if (!data.expenses.every((e) => ids.has(e.categoryId))) {
    return { ok: false, error: 'Hay gastos con categorías inexistentes.' }
  }
  return { ok: true, state: { categories: data.categories, expenses: data.expenses } }
}

export function importBackup(json: string): Decision {
  const parsed = parseBackup(json)
  if (!parsed.ok) return fail({ file: parsed.error })
  return accept({ type: 'store/replace', state: parsed.state })
}

export function exportBackup(state: StoreState, clock: Clock): string {
  return JSON.stringify({ version: BACKUP_VERSION, exportedAt: clock.now(), ...state }, null, 2)
}
