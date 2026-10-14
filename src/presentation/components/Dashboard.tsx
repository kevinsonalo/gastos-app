import { useMemo, useState } from 'react'
import {
  currentMonth,
  lastMonths,
  monthBreakdown,
  monthInsights,
  monthSummary,
  monthlyTrend,
  todayISO,
  totalsByCategory,
  type Category,
  type Expense,
  type Insight,
} from '../../domain'
import { formatCurrency, formatDate, monthLabel } from '../format'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onAddClick: () => void
  /** Abre la lista de gastos filtrada por mes y, opcionalmente, categoría. */
  onDrillDown: (month: string, categoryId?: string) => void
}

/** Meses del selector: desde el primer gasto hasta el mes actual (mínimo los últimos 12). */
function selectableMonths(expenses: Expense[], now: string): string[] {
  const first = expenses.reduce((min, e) => (e.date < min ? e.date : min), now).slice(0, 7)
  const [y1, m1] = first.split('-').map(Number)
  const [y2, m2] = now.split('-').map(Number)
  const span = Math.max(12, (y2 - y1) * 12 + (m2 - m1) + 1)
  return lastMonths(now, span).reverse()
}

function insightText(insight: Insight, selected: string): { icon: string; text: string } {
  switch (insight.kind) {
    case 'category-change': {
      const period = insight.partial ? 'a esta altura del mes' : 'este mes'
      const howMuch =
        insight.change >= 200
          ? `${(insight.amount / insight.baseline).toFixed(1)} veces tu promedio`
          : `${Math.abs(insight.change).toFixed(0)}% ${insight.change > 0 ? 'más' : 'menos'} que tu promedio`
      return {
        icon: insight.change > 0 ? '📈' : '📉',
        text: `${insight.category.name}: llevás ${howMuch} de los últimos 3 meses ${period} (${formatCurrency(insight.amount)} vs ${formatCurrency(insight.baseline)}).`,
      }
    }
    case 'unusual-expense':
      return {
        icon: '⚠️',
        text: `${insight.expense.description} del ${formatDate(insight.expense.date)} (${formatCurrency(insight.expense.amount)}) es ${insight.times.toFixed(1)} veces lo que solés gastar ahí.`,
      }
    case 'top-month':
      return {
        icon: '🏆',
        text: `${monthLabel(insight.month, true).split(' ')[0]} ${insight.month === selected ? 'es' : 'fue'} tu mes más caro del año: ${formatCurrency(insight.total)}.`,
      }
  }
}

export function Dashboard({ expenses, categories, onAddClick, onDrillDown }: Props) {
  const now = currentMonth()
  const [month, setMonth] = useState(now)
  const today = todayISO()

  const summary = useMemo(() => monthSummary(expenses, categories, month, today), [expenses, categories, month, today])
  const breakdown = useMemo(() => monthBreakdown(expenses, month, today), [expenses, month, today])
  const insights = useMemo(() => monthInsights(expenses, categories, month, today), [expenses, categories, month, today])
  const byCategory = useMemo(
    () => totalsByCategory(expenses.filter((e) => e.date.startsWith(month)), categories),
    [expenses, categories, month],
  )
  const trend = useMemo(() => monthlyTrend(expenses, month, 6), [expenses, month])
  const months = useMemo(() => selectableMonths(expenses, now), [expenses, now])
  const maxTrend = Math.max(1, ...trend.map((t) => t.total))

  const change = summary.changeVsPrevious
  const [prev] = lastMonths(month, 2)
  const prevName = monthLabel(prev, true).split(' ')[0].toLowerCase()
  const compareLabel = summary.comparedDays ? `vs 1–${summary.comparedDays} de ${prevName}` : `vs ${prevName}`
  const fixedShare = summary.total > 0 ? (breakdown.fixedTotal / summary.total) * 100 : 0

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>Resumen · {monthLabel(month, true)}</h2>
        <select aria-label="Mes del resumen" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, true)}
            </option>
          ))}
        </select>
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Total del mes</span>
          <span className="stat-value">{formatCurrency(summary.total)}</span>
          {change !== null && (
            <span className={change > 0 ? 'trend up' : 'trend down'}>
              {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% {compareLabel}
            </span>
          )}
          <span className="stat-sub">
            {summary.count} registros · {formatCurrency(summary.dailyAverage)}/día
          </span>
        </div>

        {breakdown.projectedTotal !== null ? (
          <div className="card stat">
            <span className="stat-label">Proyección al cierre</span>
            <span className="stat-value">{formatCurrency(breakdown.projectedTotal)}</span>
            <span className="stat-sub">
              Fijos {breakdown.pendingFixedTotal > 0 ? `(faltan ${formatCurrency(breakdown.pendingFixedTotal)}) ` : ''}+ variables al ritmo actual
            </span>
          </div>
        ) : (
          <div className="card stat">
            <span className="stat-label">Promedio diario</span>
            <span className="stat-value">{formatCurrency(summary.dailyAverage)}</span>
          </div>
        )}

        <div className="card stat">
          <span className="stat-label">Fijos vs variables</span>
          <div className="split" role="img" aria-label={`Fijos ${fixedShare.toFixed(0)}%, variables ${(100 - fixedShare).toFixed(0)}%`}>
            <div className="split-fixed" style={{ width: `${fixedShare}%` }} />
          </div>
          <span className="split-legend">
            <span><span className="dot split-dot-fixed" /> Fijos {formatCurrency(breakdown.fixedTotal)}</span>
            <span><span className="dot split-dot-var" /> Variables {formatCurrency(breakdown.variableTotal)}</span>
          </span>
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
          {summary.topCategory && (
            <span className="stat-sub">
              {formatCurrency(summary.topCategory.total)} · {summary.topCategory.percentage.toFixed(0)}% del mes
            </span>
          )}
        </div>
      </div>

      {insights.length > 0 && (
        <section className="card insights" aria-label="Observaciones del mes">
          <h3>💡 Lo que dicen tus datos</h3>
          <ul>
            {insights.map((insight, i) => {
              const { icon, text } = insightText(insight, month)
              return (
                <li key={i}>
                  <span aria-hidden>{icon}</span> {text}
                </li>
              )
            })}
          </ul>
        </section>
      )}

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
                  <button
                    type="button"
                    className="bar-button"
                    title={`Ver los gastos de ${category.name}`}
                    onClick={() => onDrillDown(month, category.id)}
                  >
                    <div className="bar-label">
                      <span>{category.name} <span className="muted">({count})</span></span>
                      <span>{formatCurrency(total)} · {percentage.toFixed(0)}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percentage}%`, background: category.color }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Tendencia últimos 6 meses</h3>
          <div className="columns" aria-label="Gasto mensual: elegí un mes para verlo">
            {trend.map((t) => (
              <button
                type="button"
                key={t.month}
                className={t.month === month ? 'col active' : 'col'}
                title={`${monthLabel(t.month, true)}: ${formatCurrency(t.total)}`}
                aria-pressed={t.month === month}
                onClick={() => setMonth(t.month)}
              >
                <span className="col-value">{t.total > 0 ? formatCurrency(t.total) : ''}</span>
                <div className="col-bar" style={{ height: `${(t.total / maxTrend) * 100}%` }} />
                <span className="col-label">{monthLabel(t.month)}</span>
              </button>
            ))}
          </div>
          <p className="hint muted">Tocá un mes para verlo · tocá una categoría para ver sus gastos</p>
        </section>
      </div>
    </div>
  )
}
