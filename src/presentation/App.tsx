import { useState } from 'react'
import { CategoryManager } from './components/CategoryManager'
import { Dashboard } from './components/Dashboard'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import type { AppDependencies } from '../application'
import { NO_FILTERS, currentMonth, type Expense, type ExpenseFilters, type ExpenseInput } from '../domain'
import { useExpenseStore } from './hooks/useExpenseStore'
import { Sidebar, type Page } from './layout/Sidebar'
import { AdminPage } from './pages/AdminPage'

const TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  expenses: 'Gastos',
  categories: 'Categorías',
  admin: 'Administración',
}

interface Props {
  deps: AppDependencies
}

export default function App({ deps }: Props) {
  const store = useExpenseStore(deps)
  const [page, setPage] = useState<Page>('dashboard')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({ ...NO_FILTERS, month: currentMonth() })

  const handleSubmit = (input: ExpenseInput) => {
    if (!editing) return store.addExpense(input)
    const result = store.updateExpense(editing.id, input)
    if (result.ok) setEditing(null)
    return result
  }

  const handleDelete = (id: string) => {
    if (editing?.id === id) setEditing(null)
    store.deleteExpense(id)
  }

  return (
    <div className="shell">
      <Sidebar current={page} storageLabel={store.storageLabel} onNavigate={setPage} />

      <div className="content">
        <header className="page-header">
          <h1>{TITLES[page]}</h1>
        </header>

        {store.syncError && (
          <div className="alert" role="alert">
            <span>{store.syncError}</span>
            <button type="button" onClick={store.dismissError} aria-label="Cerrar aviso">
              ✕
            </button>
          </div>
        )}

        {store.status === 'loading' && <p className="card empty">Cargando datos…</p>}

        {store.status === 'error' && (
          <section className="card empty">
            <p>No se pudieron cargar los datos.</p>
            <button type="button" className="primary" onClick={store.retry}>
              Reintentar
            </button>
          </section>
        )}

        {store.status === 'ready' && (
          <main>
            {page === 'dashboard' && (
              <Dashboard
                expenses={store.expenses}
                categories={store.categories}
                onAddClick={() => setPage('expenses')}
                onDrillDown={(month, categoryId = '') => {
                  setFilters({ ...NO_FILTERS, month, categoryId })
                  setPage('expenses')
                }}
              />
            )}

            {page === 'expenses' && (
              <div className="expenses-layout">
                <ExpenseForm
                  key={editing?.id ?? 'new'}
                  categories={store.categories}
                  editing={editing}
                  onSubmit={handleSubmit}
                  onCancelEdit={() => setEditing(null)}
                />
                <ExpenseList
                  expenses={store.expenses}
                  categories={store.categories}
                  filters={filters}
                  editingId={editing?.id ?? null}
                  onFiltersChange={setFilters}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              </div>
            )}

            {page === 'categories' && (
              <CategoryManager
                categories={store.categories}
                expenses={store.expenses}
                onAdd={store.addCategory}
                onUpdate={store.updateCategory}
                onDelete={store.deleteCategory}
              />
            )}

            {page === 'admin' && <AdminPage store={store} />}
          </main>
        )}

        <footer className="muted">Objetivo Babel 2026 · React + TypeScript · Desarrollado con apoyo de Claude</footer>
      </div>
    </div>
  )
}
