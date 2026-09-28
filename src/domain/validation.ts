import { isValidISODate } from './dates'
import { PAYMENT_METHODS } from './types'
import type { Category, CategoryInput, ExpenseInput, ValidationErrors } from './types'

export const MAX_AMOUNT = 1_000_000_000
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

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
  else if (description.length > 120) errors.description = 'Máximo 120 caracteres.'

  if (!categories.some((c) => c.id === input.categoryId)) {
    errors.categoryId = 'Seleccioná una categoría válida.'
  }

  if (!isValidISODate(input.date)) errors.date = 'Fecha inválida.'

  if (!PAYMENT_METHODS.some((p) => p.value === input.paymentMethod)) {
    errors.paymentMethod = 'Método de pago inválido.'
  }

  return errors
}

export function validateCategory(
  input: CategoryInput,
  categories: Category[],
  editingId?: string,
): ValidationErrors<CategoryInput> {
  const errors: ValidationErrors<CategoryInput> = {}
  const name = input.name.trim()

  if (!name) errors.name = 'El nombre es obligatorio.'
  else if (name.length > 40) errors.name = 'Máximo 40 caracteres.'
  else if (
    categories.some(
      (c) => c.id !== editingId && c.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Ya existe una categoría con ese nombre.'
  }

  if (!HEX_COLOR.test(input.color)) errors.color = 'Color inválido.'

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
