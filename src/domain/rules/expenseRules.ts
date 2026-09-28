import type { Category } from '../entities/category'
import { PAYMENT_METHODS, type ExpenseInput } from '../entities/expense'
import { isValidISODate } from '../shared/dates'
import { roundMoney } from '../shared/money'
import type { ValidationErrors } from '../shared/validation'

export const MAX_AMOUNT = 1_000_000_000
export const MAX_DESCRIPTION_LENGTH = 120

export function validateExpense(
  input: ExpenseInput,
  categories: Category[],
): ValidationErrors<ExpenseInput> {
  const errors: ValidationErrors<ExpenseInput> = {}

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = 'El monto debe ser mayor a 0.'
  } else if (input.amount > MAX_AMOUNT) {
    errors.amount = 'El monto es demasiado alto.'
  }

  const description = input.description.trim()
  if (!description) errors.description = 'La descripción es obligatoria.'
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`
  }

  if (!categories.some((c) => c.id === input.categoryId)) {
    errors.categoryId = 'Seleccioná una categoría válida.'
  }

  if (!isValidISODate(input.date)) errors.date = 'Fecha inválida.'

  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    errors.paymentMethod = 'Método de pago inválido.'
  }

  return errors
}

/** Forma canónica con la que se persiste un gasto. */
export function normalizeExpense(input: ExpenseInput): ExpenseInput {
  return {
    ...input,
    amount: roundMoney(input.amount),
    description: input.description.trim(),
  }
}
