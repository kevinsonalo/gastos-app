import { useMemo, useState } from 'react'
import { currentMonth, monthLabel, todayISO } from '../domain/dates'
import { formatCurrency } from '../domain/format'
import { monthSummary, monthlyTrend, totalsByCategory } from '../domain/stats'
import type { Category, Expense } from '../domain/types'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onAddClick: () => void
}

export function Dashboard({ expenses, categories, onAddClick }: Props) {
  const [month, setMonth] = useState(currentMonth())
  const today = todayISO()

  const summary = useMemo(() => monthSummary(expenses, categories, month, today), [expenses, categories, month, today])
  const byCategory = useMemo(
    () => totalsByCategory(expenses.filter((e) => e.date.startsWith(month)), categories),
    [expenses, categories, month],
  )
  const trend = useMemo(() => monthlyTrend(expenses, month, 6), [expenses, month])
  const maxTrend = Math.max(1, ...trend.map((t) => t.total))

  const change = summary.changeVsPrevious
  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>Resumen · {monthLabel(month, true)}</h2>
        <input type="month" aria-label="Mes del resumen" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Total del mes</span>
          <span className="stat-value">{formatCurrency(summary.total)}</span>
          {change !== null && (
            <span className={change > 0 ? 'trend up' : 'trend down'}>
              {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs mes anterior
            </span>
          )}
        </div>
        <div className="card stat">
          <span className="stat-label">Promedio diario</span>
          <span className="stat-value">{formatCurrency(summary.dailyAverage)}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Registros</span>
          <span className="stat-value">{summary.count}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Categoría principal</span>
          <span className="stat-value small">
            {summary.topCategory ? (
              <>
                <span className="dot" style={{ background: summary.topCategory.category.color }} />{' '}
                {summary.topCategory.category.name}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="card">
          <h3>Gasto por categoría</h3>
          {byCategory.length === 0 ? (
            <div className="empty">
              <p>Sin gastos este mes.</p>
              <button className="primary" onClick={onAddClick}>Registrar gasto</button>
            </div>
          ) : (
            <ul className="bars">
              {byCategory.map(({ category, total, percentage, count }) => (
                <li key={category.id}>
                  <div className="bar-label">
                    <span>{category.name} <span className="muted">({count})</span></span>
                    <span>{formatCurrency(total)} · {percentage.toFixed(0)}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%`, background: category.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Tendencia últimos 6 meses</h3>
          <div className="columns" role="img" aria-label="Gráfico de gasto mensual">
            {trend.map((t) => (
              <div key={t.month} className={t.month === month ? 'col active' : 'col'} title={formatCurrency(t.total)}>
                <span className="col-value">{t.total > 0 ? formatCurrency(t.total) : ''}</span>
                <div className="col-bar" style={{ height: `${(t.total / maxTrend) * 100}%` }} />
                <span className="col-label">{monthLabel(t.month)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
