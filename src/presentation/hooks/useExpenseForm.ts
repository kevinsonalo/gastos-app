import { useEffect, useState, type FormEvent } from 'react'
import type { Errors, Result } from '../../application'
import { DEFAULT_PAYMENT_METHOD, todayISO, type Category, type Expense, type ExpenseInput } from '../../domain'

/** Estado del formulario: los inputs HTML manejan texto, por eso `amount` es string. */
export interface ExpenseFormValues {
  amount: string
  description: string
  categoryId: string
  date: string
  paymentMethod: ExpenseInput['paymentMethod']
}

const SAVED_MESSAGE_MS = 1500

function initialValues(categories: Category[], editing: Expense | null): ExpenseFormValues {
  if (editing) return { ...editing, amount: String(editing.amount) }
  return {
    amount: '',
    description: '',
    categoryId: categories[0]?.id ?? '',
    date: todayISO(),
    paymentMethod: DEFAULT_PAYMENT_METHOD,
  }
}

/** Convierte los valores del formulario al input del caso de uso ('' → NaN para que la validación lo rechace). */
function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  return { ...values, amount: values.amount === '' ? NaN : Number(values.amount) }
}

/**
 * Lógica del formulario de gastos, separada del marcado JSX.
 * El componente padre reinicia el estado cambiando la `key` al editar otro gasto.
 */
export function useExpenseForm(
  categories: Category[],
  editing: Expense | null,
  onSubmit: (input: ExpenseInput) => Result,
) {
  const [values, setValues] = useState(() => initialValues(categories, editing))
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState(false)

  // Oculta el aviso "Guardado" y limpia el timer si el componente se desmonta.
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), SAVED_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [saved])

  const setField = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = onSubmit(toExpenseInput(values))
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaved(true)
    // En alta, se conservan categoría y fecha para registrar varios gastos seguidos.
    if (!editing) {
      setValues((current) => ({ ...initialValues(categories, null), categoryId: current.categoryId, date: current.date }))
    }
  }

  return { values, errors, saved, setField, handleSubmit }
}
