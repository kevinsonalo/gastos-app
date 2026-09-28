import { hasErrors, normalizeExpense, validateExpense, type ExpenseInput } from '../../domain'
import type { Services } from '../ports/system'
import { accept, fail, type Decision } from '../result'
import type { StoreState } from '../state/storeReducer'

export function addExpense(state: StoreState, input: ExpenseInput, { ids, clock }: Services): Decision {
  const errors = validateExpense(input, state.categories)
  if (hasErrors(errors)) return fail(errors)

  const now = clock.now()
  return accept({
    type: 'expense/add',
    expense: { id: ids.next(), ...normalizeExpense(input), createdAt: now, updatedAt: now },
  })
}

export function updateExpense(
  state: StoreState,
  id: string,
  input: ExpenseInput,
  { clock }: Pick<Services, 'clock'>,
): Decision {
  const current = state.expenses.find((e) => e.id === id)
  if (!current) return fail({ id: 'El gasto ya no existe.' })

  const errors = validateExpense(input, state.categories)
  if (hasErrors(errors)) return fail(errors)

  return accept({
    type: 'expense/update',
    expense: { ...current, ...normalizeExpense(input), updatedAt: clock.now() },
  })
}

export function deleteExpense(id: string): Decision {
  return accept({ type: 'expense/delete', id })
}
