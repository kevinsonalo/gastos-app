import { useState, type FormEvent } from 'react'
import type { Result } from '../../application'
import { countExpensesInCategory, type Category, type CategoryInput, type Expense } from '../../domain'

interface Props {
  categories: Category[]
  expenses: Expense[]
  onAdd: (input: CategoryInput) => Result
  onUpdate: (id: string, input: CategoryInput) => Result
  onDelete: (id: string) => Result
}

const randomColor = () =>
  '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')

export function CategoryManager({ categories, expenses, onAdd, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState<CategoryInput>({ name: '', color: randomColor() })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const usage = (id: string) => countExpensesInCategory(expenses, id)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = editingId ? onUpdate(editingId, draft) : onAdd(draft)
    if (!result.ok) return setError(Object.values(result.errors)[0] ?? 'Error')
    setError('')
    setEditingId(null)
    setDraft({ name: '', color: randomColor() })
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setDraft({ name: c.name, color: c.color })
    setError('')
  }

  const handleDelete = (c: Category) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return
    const result = onDelete(c.id)
    setError(result.ok ? '' : Object.values(result.errors)[0] ?? 'Error')
  }

  return (
    <section className="card">
      <h2>Categorías</h2>
      <form className="category-form" onSubmit={handleSubmit}>
        <input
          type="color"
          aria-label="Color"
          value={draft.color}
          onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
        />
        <input
          type="text"
          aria-label="Nombre de categoría"
          placeholder="Nombre de la categoría"
          maxLength={40}
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
        <button type="submit" className="primary">{editingId ? 'Guardar' : 'Agregar'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setDraft({ name: '', color: randomColor() }) }}>
            Cancelar
          </button>
        )}
      </form>
      {error && <p className="error" role="alert">{error}</p>}

      <ul className="category-list">
        {categories.map((c) => {
          const count = usage(c.id)
          return (
            <li key={c.id}>
              <span className="dot" style={{ background: c.color }} aria-hidden />
              <span className="desc">{c.name}</span>
              <span className="muted">{count} gasto(s)</span>
              <div className="row-actions">
                <button type="button" onClick={() => startEdit(c)} aria-label={`Editar ${c.name}`}>✎</button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(c)}
                  disabled={count > 0}
                  title={count > 0 ? 'Tiene gastos asociados' : 'Eliminar'}
                  aria-label={`Eliminar ${c.name}`}
                >
                  🗑
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
