import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import {
  OK,
  addCategory,
  addExpense,
  deleteCategory,
  deleteExpense,
  exportBackup,
  importBackup,
  loadState,
  storeReducer,
  updateCategory,
  updateExpense,
  type AppDependencies,
  type Decision,
  type Result,
} from '../../application'
import type { CategoryInput, ExpenseInput } from '../../domain'

/**
 * Adaptador React de la capa de aplicación: conecta los casos de uso con
 * useReducer y persiste cada colección cuando cambia. No contiene reglas de negocio.
 */
export function useExpenseStore(deps: AppDependencies) {
  // Dependencias estables durante toda la vida del componente.
  const [{ repositories, ids, clock }] = useState(deps)
  const [state, dispatch] = useReducer(storeReducer, repositories, loadState)

  useEffect(() => repositories.expenses.saveAll(state.expenses), [repositories, state.expenses])
  useEffect(() => repositories.categories.saveAll(state.categories), [repositories, state.categories])

  const execute = useCallback((decision: Decision): Result => {
    if (!decision.ok) return decision
    dispatch(decision.action)
    return OK
  }, [])

  return useMemo(() => {
    const services = { ids, clock }
    return {
      ...state,
      addExpense: (input: ExpenseInput) => execute(addExpense(state, input, services)),
      updateExpense: (id: string, input: ExpenseInput) => execute(updateExpense(state, id, input, services)),
      deleteExpense: (id: string) => execute(deleteExpense(id)),
      addCategory: (input: CategoryInput) => execute(addCategory(state, input, services)),
      updateCategory: (id: string, input: CategoryInput) => execute(updateCategory(state, id, input)),
      deleteCategory: (id: string) => execute(deleteCategory(state, id)),
      importBackup: (json: string) => execute(importBackup(json)),
      exportBackup: () => exportBackup(state, clock),
    }
  }, [state, ids, clock, execute])
}

export type ExpenseStore = ReturnType<typeof useExpenseStore>
