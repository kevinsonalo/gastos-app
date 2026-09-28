import {
  countExpensesInCategory,
  hasErrors,
  normalizeCategory,
  validateCategory,
  type CategoryInput,
} from '../../domain'
import type { Services } from '../ports/system'
import { accept, fail, type Decision } from '../result'
import type { StoreState } from '../state/storeReducer'

export function addCategory(state: StoreState, input: CategoryInput, { ids, clock }: Services): Decision {
  const errors = validateCategory(input, state.categories)
  if (hasErrors(errors)) return fail(errors)

  return accept({
    type: 'category/add',
    category: { id: ids.next(), ...normalizeCategory(input), createdAt: clock.now() },
  })
}

export function updateCategory(state: StoreState, id: string, input: CategoryInput): Decision {
  const current = state.categories.find((c) => c.id === id)
  if (!current) return fail({ id: 'La categoría ya no existe.' })

  const errors = validateCategory(input, state.categories, id)
  if (hasErrors(errors)) return fail(errors)

  return accept({ type: 'category/update', category: { ...current, ...normalizeCategory(input) } })
}

export function deleteCategory(state: StoreState, id: string): Decision {
  const used = countExpensesInCategory(state.expenses, id)
  if (used > 0) {
    return fail({ categoryId: `La categoría tiene ${used} gasto(s). Reasignalos antes de eliminarla.` })
  }
  return accept({ type: 'category/delete', id })
}
