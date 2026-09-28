import { useMemo } from 'react'
import {
  filterExpenses,
  sortExpenses,
  total,
  type Category,
  type Expense,
  type ExpenseFilters,
} from '../../domain'
import { formatCurrency, formatDate } from '../format'
import { PAYMENT_METHOD_LABELS } from '../labels'
import { FilterBar } from './FilterBar'

interface Props {
  expenses: Expense[]
  categories: Category[]
  filters: ExpenseFilters
  editingId: string | null
  onFiltersChange: (f: ExpenseFilters) => void
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, categories, filters, editingId, onFiltersChange, onEdit, onDelete }: Props) {
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const visible = useMemo(() => sortExpenses(filterExpenses(expenses, filters)), [expenses, filters])

  const handleDelete = (e: Expense) => {
    if (window.confirm(`¿Eliminar "${e.description}" por ${formatCurrency(e.amount)}?`)) onDelete(e.id)
  }

  return (
    <section className="card">
      <div className="list-header">
        <h2>Gastos</h2>
        <span className="muted">
          {visible.length} registro(s) · <strong>{formatCurrency(total(visible))}</strong>
        </span>
      </div>
      <FilterBar filters={filters} categories={categories} onChange={onFiltersChange} />

      {visible.length === 0 ? (
        <p className="empty">
          {expenses.length === 0 ? 'Aún no hay gastos. Registrá el primero 👈' : 'Ningún gasto coincide con los filtros.'}
        </p>
      ) : (
        <ul className="expense-list">
          {visible.map((e) => {
            const cat = categoryById.get(e.categoryId)
            return (
              <li key={e.id} className={e.id === editingId ? 'editing' : undefined}>
                <span className="dot" style={{ background: cat?.color ?? '#999' }} aria-hidden />
                <div className="expense-main">
                  <span className="desc">{e.description}</span>
                  <span className="meta">
                    {formatDate(e.date)} · {cat?.name ?? 'Sin categoría'} · {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                  </span>
                </div>
                <span className="amount">{formatCurrency(e.amount)}</span>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(e)} aria-label={`Editar ${e.description}`}>
                    ✎
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(e)} aria-label={`Eliminar ${e.description}`}>
                    🗑
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
