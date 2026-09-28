import type { Category } from '../entities/category'
import type { Expense } from '../entities/expense'
import { daysInMonth, lastMonths } from '../shared/dates'
import { roundMoney } from '../shared/money'

/** Criterios de consulta de la lista de gastos (vacío = sin filtrar). */
export interface ExpenseFilters {
  /** YYYY-MM o '' para todos los meses */
  month: string
  categoryId: string
  search: string
}

export const NO_FILTERS: ExpenseFilters = { month: '', categoryId: '', search: '' }

/** Aplica los filtros de mes, categoría y texto (sin distinguir mayúsculas). */
export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const term = filters.search.trim().toLowerCase()
  return expenses.filter(
    (e) =>
      (!filters.month || e.date.startsWith(filters.month)) &&
      (!filters.categoryId || e.categoryId === filters.categoryId) &&
      (!term || e.description.toLowerCase().includes(term)),
  )
}

/** Orden: fecha descendente, luego creación descendente. */
export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  )
}

/** Suma de montos redondeada a 2 decimales. */
export function total(expenses: Expense[]): number {
  return roundMoney(expenses.reduce((sum, e) => sum + e.amount, 0))
}

export interface CategoryTotal {
  category: Category
  total: number
  count: number
  /** 0-100 */
  percentage: number
}

/** Totales por categoría, ordenados de mayor a menor; omite categorías sin gastos. */
export function totalsByCategory(expenses: Expense[], categories: Category[]): CategoryTotal[] {
  const grand = total(expenses)
  const map = new Map<string, { total: number; count: number }>()
  for (const e of expenses) {
    const acc = map.get(e.categoryId) ?? { total: 0, count: 0 }
    acc.total += e.amount
    acc.count += 1
    map.set(e.categoryId, acc)
  }
  return categories
    .filter((c) => map.has(c.id))
    .map((category) => {
      const { total: t, count } = map.get(category.id)!
      return {
        category,
        total: roundMoney(t),
        count,
        percentage: grand > 0 ? roundMoney((t / grand) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export interface MonthTotal {
  month: string
  total: number
}

/** Total por mes de los últimos `count` meses hasta `endMonth` (meses sin gastos = 0). */
export function monthlyTrend(expenses: Expense[], endMonth: string, count = 6): MonthTotal[] {
  const months = lastMonths(endMonth, count)
  const map = new Map<string, number>(months.map((m) => [m, 0]))
  for (const e of expenses) {
    const m = e.date.slice(0, 7)
    if (map.has(m)) map.set(m, map.get(m)! + e.amount)
  }
  return months.map((month) => ({ month, total: roundMoney(map.get(month)!) }))
}

export interface MonthSummary {
  total: number
  count: number
  dailyAverage: number
  topCategory: CategoryTotal | null
  /** Variación % vs mes anterior; null si el mes anterior fue 0. */
  changeVsPrevious: number | null
}

/** Indicadores del dashboard para un mes (YYYY-MM) a la fecha `today` (YYYY-MM-DD). */
export function monthSummary(
  expenses: Expense[],
  categories: Category[],
  month: string,
  today: string,
): MonthSummary {
  const inMonth = expenses.filter((e) => e.date.startsWith(month))
  const [prev] = lastMonths(month, 2)
  const prevTotal = total(expenses.filter((e) => e.date.startsWith(prev)))
  const monthTotal = total(inMonth)

  // Si es el mes en curso, promediar sobre los días transcurridos.
  const elapsed = today.startsWith(month) ? Number(today.slice(8, 10)) : daysInMonth(month)

  return {
    total: monthTotal,
    count: inMonth.length,
    dailyAverage: roundMoney(monthTotal / elapsed),
    topCategory: totalsByCategory(inMonth, categories)[0] ?? null,
    changeVsPrevious:
      prevTotal > 0 ? roundMoney(((monthTotal - prevTotal) / prevTotal) * 100) : null,
  }
}
