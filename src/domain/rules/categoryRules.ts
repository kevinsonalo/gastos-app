import type { Category, CategoryInput } from '../entities/category'
import type { Expense } from '../entities/expense'
import type { ValidationErrors } from '../shared/validation'

export const MAX_CATEGORY_NAME_LENGTH = 40
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export function validateCategory(
  input: CategoryInput,
  categories: Category[],
  editingId?: string,
): ValidationErrors<CategoryInput> {
  const errors: ValidationErrors<CategoryInput> = {}
  const name = input.name.trim()

  if (!name) errors.name = 'El nombre es obligatorio.'
  else if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    errors.name = `Máximo ${MAX_CATEGORY_NAME_LENGTH} caracteres.`
  } else if (
    categories.some(
      (c) => c.id !== editingId && c.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Ya existe una categoría con ese nombre.'
  }

  if (!HEX_COLOR.test(input.color)) errors.color = 'Color inválido.'

  return errors
}

export function normalizeCategory(input: CategoryInput): CategoryInput {
  return { name: input.name.trim(), color: input.color.toLowerCase() }
}

/** ADR-008: una categoría con gastos asociados no se puede eliminar. */
export function countExpensesInCategory(expenses: Expense[], categoryId: string): number {
  return expenses.filter((e) => e.categoryId === categoryId).length
}
