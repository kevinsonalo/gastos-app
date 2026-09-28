import { NO_FILTERS, type Category, type ExpenseFilters } from '../../domain'

interface Props {
  filters: ExpenseFilters
  categories: Category[]
  onChange: (filters: ExpenseFilters) => void
}

export function FilterBar({ filters, categories, onChange }: Props) {
  return (
    <div className="filters">
      <input
        type="month"
        aria-label="Mes"
        value={filters.month}
        onChange={(e) => onChange({ ...filters, month: e.target.value })}
      />
      <select
        aria-label="Categoría"
        value={filters.categoryId}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="search"
        aria-label="Buscar"
        placeholder="Buscar descripción…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      {(filters.month || filters.categoryId || filters.search) && (
        <button type="button" onClick={() => onChange(NO_FILTERS)}>
          Limpiar
        </button>
      )}
    </div>
  )
}
