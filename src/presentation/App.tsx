import { useState } from 'react'
import { BackupControls } from './components/BackupControls'
import { CategoryManager } from './components/CategoryManager'
import { Dashboard } from './components/Dashboard'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import type { AppDependencies } from '../application'
import { currentMonth, type Expense, type ExpenseFilters, type ExpenseInput } from '../domain'
import { useExpenseStore } from './hooks/useExpenseStore'

type Tab = 'dashboard' | 'expenses' | 'categories'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'categories', label: 'Categorías' },
]

interface Props {
  deps: AppDependencies
}

export default function App({ deps }: Props) {
  const store = useExpenseStore(deps)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({ month: currentMonth(), categoryId: '', search: '' })

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
    <div className="app">
      <header className="topbar">
        <h1>💸 Mis Gastos</h1>
        <nav role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'tab active' : 'tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'dashboard' && (
          <Dashboard expenses={store.expenses} categories={store.categories} onAddClick={() => setTab('expenses')} />
        )}

        {tab === 'expenses' && (
          <div className="expenses-layout">
            <ExpenseForm
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

        {tab === 'categories' && (
          <>
            <CategoryManager
              categories={store.categories}
              expenses={store.expenses}
              onAdd={store.addCategory}
              onUpdate={store.updateCategory}
              onDelete={store.deleteCategory}
            />
            <section className="card">
              <h2>Respaldo de datos</h2>
              <p className="muted">Los datos se guardan en este navegador. Exportá un respaldo para moverlos o protegerlos.</p>
              <BackupControls onExport={store.exportBackup} onImport={store.importBackup} />
            </section>
          </>
        )}
      </main>

      <footer className="muted">Objetivo Babel 2026 · React + TypeScript · Desarrollado con apoyo de Claude</footer>
    </div>
  )
}
