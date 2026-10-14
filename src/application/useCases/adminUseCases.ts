import {
  MAX_DESCRIPTION_LENGTH,
  categoryForMerchant,
  defaultCategories,
  hasErrors,
  normalizeExpense,
  roundMoney,
  validateExpense,
  type Expense,
} from '../../domain'
import type { BankNotificationReader, BankTransaction, EmailFile } from '../ports/bankNotificationReader'
import type { Clock } from '../ports/system'
import { accept, type Decision } from '../result'
import type { StoreState } from '../state/storeReducer'

/** "Borrar todo": elimina todos los gastos y restaura las categorías por defecto. */
export function resetData(): Decision {
  return accept({ type: 'store/replace', state: { categories: defaultCategories(), expenses: [] } })
}

export interface EmailImportOptions {
  /** Tipo de cambio para convertir compras en dólares; sin él, se omiten. */
  usdRate?: number
}

export interface EmailImportReport {
  read: number
  imported: number
  duplicates: number
  skipped: Array<{ file: string; reason: string }>
}

/** Tipos de transacción que no son gastos (reintegros, pagos a la tarjeta, reversiones). */
const NOT_AN_EXPENSE = /DEVOLUCI|REVERS|ANULACI|PAGO|ABONO|CR[EÉ]DITO|REEMBOLSO/

/** El id sale de la referencia del banco: reimportar la misma carpeta no duplica gastos. */
export const bankExpenseId = (tx: BankTransaction) =>
  `${tx.bank}-${tx.reference}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64)

/**
 * Convierte correos de notificación bancaria en gastos.
 * Puro: recibe el lector y el reloj inyectados y devuelve la decisión + un reporte para la UI.
 */
export function importBankEmails(
  state: StoreState,
  files: EmailFile[],
  reader: BankNotificationReader,
  { clock }: { clock: Clock },
  options: EmailImportOptions = {},
): { decision: Decision; report: EmailImportReport } {
  const report: EmailImportReport = { read: files.length, imported: 0, duplicates: 0, skipped: [] }
  const existingIds = new Set(state.expenses.map((e) => e.id))
  const expenses: Expense[] = []
  const now = clock.now()

  for (const file of files) {
    const tx = reader.read(file)
    const skip = (reason: string) => report.skipped.push({ file: file.name, reason })

    if (!tx) {
      skip('No es una notificación de transacción reconocible.')
      continue
    }
    if (NOT_AN_EXPENSE.test(tx.kind)) {
      skip(`No es un gasto (${tx.kind.toLowerCase()}).`)
      continue
    }

    const id = bankExpenseId(tx)
    if (existingIds.has(id)) {
      report.duplicates++
      continue
    }

    let amount = tx.amount
    let description = tx.merchant
    if (tx.currency === 'USD') {
      if (!options.usdRate || options.usdRate <= 0) {
        skip(`Compra en dólares (USD ${tx.amount}) sin tipo de cambio.`)
        continue
      }
      amount = roundMoney(tx.amount * options.usdRate)
      description = `${tx.merchant} (USD ${tx.amount})`
    }

    const category = categoryForMerchant(tx.merchant, state.categories)
    const input = {
      amount,
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      categoryId: category?.id ?? '',
      date: tx.date,
      paymentMethod: 'card' as const,
    }
    const errors = validateExpense(input, state.categories)
    if (hasErrors(errors)) {
      skip(Object.values(errors)[0] ?? 'Datos inválidos.')
      continue
    }

    expenses.push({ id, ...normalizeExpense(input), createdAt: now, updatedAt: now })
    existingIds.add(id)
  }

  report.imported = expenses.length
  return { decision: accept({ type: 'expense/import', expenses }), report }
}
