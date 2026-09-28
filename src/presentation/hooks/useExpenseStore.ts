import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createRepositories, type Repositories } from '../data'
import { newId } from '../domain/id'
import type { CategoryInput, ExpenseInput } from '../domain/types'
import { hasErrors, validateCategory, validateExpense } from '../domain/validation'
import { categoryInUse, expenseReducer } from './expenseReducer'
import { parseBackup } from './backup'

export type Result = { ok: true } | { ok: false; errors: Record<string, string> }

export function useExpenseStore(repos?: Repositories) {
  // Instancia estable de repositorios (se crea una sola vez).
  const [store] = useState<Repositories>(() => repos ?? createRepositories())

  const [state, dispatch] = useReducer(expenseReducer, store, (r) => ({
    categories: r.categories.getAll(),
    expenses: r.expenses.getAll(),
  }))

  // Persistencia: se guarda cada colección solo cuando cambia.
  useEffect(() => store.expenses.saveAll(state.expenses), [store, state.expenses])
  useEffect(() => store.categories.saveAll(state.categories), [store, state.categories])

  const addExpense = useCallback(
    (input: ExpenseInput): Result => {
      const errors = validateExpense(input, state.categories)
      if (hasErrors(errors)) return { ok: false, errors: errors as Record<string, string> }
      dispatch({ type: 'expense/add', id: newId(), now: new Date().toISOString(), input })
      return { ok: true }
    },
    [state.categories],
  )

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput): Result => {
      const errors = validateExpense(input, state.categories)
      if (hasErrors(errors)) return { ok: false, errors: errors as Record<string, string> }
      dispatch({ type: 'expense/update', id, now: new Date().toISOString(), input })
      return { ok: true }
    },
    [state.categories],
  )

  const deleteExpense = useCallback((id: string) => dispatch({ type: 'expense/delete', id }), [])

  const addCategory = useCallback(
    (input: CategoryInput): Result => {
      const errors = validateCategory(input, state.categories)
      if (hasErrors(errors)) return { ok: false, errors: errors as Record<string, string> }
      dispatch({ type: 'category/add', id: newId(), now: new Date().toISOString(), input })
      return { ok: true }
    },
    [state.categories],
  )

  const updateCategory = useCallback(
    (id: string, input: CategoryInput): Result => {
      const errors = validateCategory(input, state.categories, id)
      if (hasErrors(errors)) return { ok: false, errors: errors as Record<string, string> }
      dispatch({ type: 'category/update', id, input })
      return { ok: true }
    },
    [state.categories],
  )

  const deleteCategory = useCallback(
    (id: string): Result => {
      const used = categoryInUse(state, id)
      if (used > 0) {
        return {
          ok: false,
          errors: { categoryId: `La categoría tiene ${used} gasto(s). Reasignalos antes de eliminarla.` },
        }
      }
      dispatch({ type: 'category/delete', id })
      return { ok: true }
    },
    [state],
  )

  const importBackup = useCallback((json: string): Result => {
    const parsed = parseBackup(json)
    if (!parsed.ok) return { ok: false, errors: { file: parsed.error } }
    dispatch({ type: 'store/replace', state: parsed.state })
    return { ok: true }
  }, [])

  const exportBackup = useCallback(
    (): string =>
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2),
    [state],
  )

  return useMemo(
    () => ({
      ...state,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      importBackup,
      exportBackup,
    }),
    [state, addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory, importBackup, exportBackup],
  )
}

export type ExpenseStore = ReturnType<typeof useExpenseStore>
