import type { Result } from '../../application'
import { MAX_DESCRIPTION_LENGTH, PAYMENT_METHODS, type Category, type Expense, type ExpenseInput } from '../../domain'
import { useExpenseForm, type ExpenseFormValues } from '../hooks/useExpenseForm'
import { PAYMENT_METHOD_LABELS } from '../labels'
import { Field } from './Field'

interface Props {
  categories: Category[]
  /** Gasto en edición o null para alta. Montar con `key` distinta por gasto para reiniciar el formulario. */
  editing: Expense | null
  onSubmit: (input: ExpenseInput) => Result
  onCancelEdit: () => void
}

export function ExpenseForm({ categories, editing, onSubmit, onCancelEdit }: Props) {
  const { values, errors, saved, setField, handleSubmit } = useExpenseForm(categories, editing, onSubmit)
  const isEditing = editing !== null

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</h2>

      <Field label="Monto (₡)" error={errors.amount}>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={values.amount}
          onChange={(e) => setField('amount', e.target.value)}
          aria-invalid={!!errors.amount}
          autoFocus
        />
      </Field>

      <Field label="Descripción" error={errors.description}>
        <input
          type="text"
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Ej. Almuerzo, gasolina…"
          aria-invalid={!!errors.description}
        />
      </Field>

      <div className="row">
        <Field label="Categoría" error={errors.categoryId}>
          <select
            value={values.categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
            aria-invalid={!!errors.categoryId}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha" error={errors.date}>
          <input
            type="date"
            value={values.date}
            onChange={(e) => setField('date', e.target.value)}
            aria-invalid={!!errors.date}
          />
        </Field>
      </div>

      <Field label="Método de pago" error={errors.paymentMethod}>
        <select
          value={values.paymentMethod}
          onChange={(e) => setField('paymentMethod', e.target.value as ExpenseFormValues['paymentMethod'])}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </Field>

      <div className="actions">
        <button type="submit" className="primary">
          {isEditing ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        {saved && <span className="saved" role="status">✓ Guardado</span>}
      </div>
    </form>
  )
}
