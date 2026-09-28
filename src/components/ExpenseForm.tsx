import { useEffect, useState, type FormEvent } from 'react'
import { todayISO } from '../domain/dates'
import { PAYMENT_METHODS, type Category, type Expense, type ExpenseInput } from '../domain/types'
import type { Result } from '../hooks/useExpenseStore'

interface Props {
  categories: Category[]
  editing: Expense | null
  onSubmit: (input: ExpenseInput) => Result
  onCancelEdit: () => void
}

interface FormState {
  amount: string
  description: string
  categoryId: string
  date: string
  paymentMethod: ExpenseInput['paymentMethod']
}

const emptyForm = (categories: Category[]): FormState => ({
  amount: '',
  description: '',
  categoryId: categories[0]?.id ?? '',
  date: todayISO(),
  paymentMethod: 'card',
})

export function ExpenseForm({ categories, editing, onSubmit, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(categories))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setErrors({})
    setForm(
      editing
        ? { ...editing, amount: String(editing.amount) }
        : emptyForm(categories),
    )
    // Solo reiniciar al cambiar el gasto en edición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = onSubmit({ ...form, amount: form.amount === '' ? NaN : Number(form.amount) })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    if (!editing) setForm((f) => ({ ...emptyForm(categories), categoryId: f.categoryId, date: f.date }))
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? 'Editar gasto' : 'Nuevo gasto'}</h2>

      <label>
        Monto (₡)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          aria-invalid={!!errors.amount}
          autoFocus
        />
        {errors.amount && <span className="error">{errors.amount}</span>}
      </label>

      <label>
        Descripción
        <input
          type="text"
          maxLength={120}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ej. Almuerzo, gasolina…"
          aria-invalid={!!errors.description}
        />
        {errors.description && <span className="error">{errors.description}</span>}
      </label>

      <div className="row">
        <label>
          Categoría
          <select
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            aria-invalid={!!errors.categoryId}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="error">{errors.categoryId}</span>}
        </label>

        <label>
          Fecha
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            aria-invalid={!!errors.date}
          />
          {errors.date && <span className="error">{errors.date}</span>}
        </label>
      </div>

      <label>
        Método de pago
        <select
          value={form.paymentMethod}
          onChange={(e) => set('paymentMethod', e.target.value as FormState['paymentMethod'])}
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="actions">
        <button type="submit" className="primary">
          {editing ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        {saved && <span className="saved" role="status">✓ Guardado</span>}
      </div>
    </form>
  )
}
