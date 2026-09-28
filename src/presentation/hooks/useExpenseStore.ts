import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import {
  EMPTY_STATE,
  OK,
  addCategory,
  addExpense,
  deleteCategory,
  deleteExpense,
  exportBackup,
  importBackup,
  storeReducer,
  updateCategory,
  updateExpense,
  type AppDependencies,
  type Decision,
  type Result,
} from '../../application'
import type { CategoryInput, ExpenseInput } from '../../domain'

export type LoadStatus = 'loading' | 'ready' | 'error'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Adaptador React de la capa de aplicación: conecta los casos de uso con useReducer y
 * delega la persistencia al StoreGateway (localStorage o API). No contiene reglas de negocio.
 *
 * Guardado optimista: la UI se actualiza de inmediato y, si el servidor rechaza el cambio,
 * se muestra el error y se recargan los datos para volver a un estado consistente.
 */
export function useExpenseStore(deps: AppDependencies) {
  // Dependencias estables durante toda la vida del componente.
  const [{ gateway, ids, clock }] = useState(deps)
  const [state, dispatch] = useReducer(storeReducer, EMPTY_STATE)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [syncError, setSyncError] = useState<string | null>(null)

  const reload = useCallback(
    () =>
      gateway.load().then(
        (loaded) => {
          dispatch({ type: 'store/replace', state: loaded })
          setStatus('ready')
        },
        (error: unknown) => {
          setSyncError(errorMessage(error))
          setStatus('error')
        },
      ),
    [gateway],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  const execute = useCallback(
    (current: typeof state, decision: Decision): Result => {
      if (!decision.ok) return decision
      dispatch(decision.action)
      gateway.persist(decision.action, storeReducer(current, decision.action)).catch((error: unknown) => {
        setSyncError(`No se pudo guardar: ${errorMessage(error)}`)
        void reload()
      })
      return OK
    },
    [gateway, reload],
  )

  return useMemo(() => {
    const services = { ids, clock }
    const run = (decision: Decision) => execute(state, decision)
    return {
      ...state,
      status,
      syncError,
      storageLabel: gateway.label,
      dismissError: () => setSyncError(null),
      retry: () => {
        setSyncError(null)
        setStatus('loading')
        void reload()
      },
      addExpense: (input: ExpenseInput) => run(addExpense(state, input, services)),
      updateExpense: (id: string, input: ExpenseInput) => run(updateExpense(state, id, input, services)),
      deleteExpense: (id: string) => run(deleteExpense(id)),
      addCategory: (input: CategoryInput) => run(addCategory(state, input, services)),
      updateCategory: (id: string, input: CategoryInput) => run(updateCategory(state, id, input)),
      deleteCategory: (id: string) => run(deleteCategory(state, id)),
      importBackup: (json: string) => run(importBackup(json)),
      exportBackup: () => exportBackup(state, clock),
    }
  }, [state, status, syncError, gateway, ids, clock, execute, reload])
}

export type ExpenseStore = ReturnType<typeof useExpenseStore>
