import type { Category } from '../entities/category'
import type { Expense } from '../entities/expense'
import { daysInMonth, lastMonths } from '../shared/dates'
import { roundMoney } from '../shared/money'
import { normalizeText } from '../rules/merchantCategory'
import { total } from './stats'

/*
 * Análisis del dashboard (ADR-013): gastos fijos vs variables, proyección de cierre e insights.
 * Todo es puro y determinista: recibe `today` en lugar de leer el reloj.
 */

/** Meses previos que se usan como línea base. */
export const BASELINE_MONTHS = 3

const dayOf = (date: string) => Number(date.slice(8, 10))
const inMonth = (expenses: Expense[], month: string) => expenses.filter((e) => e.date.startsWith(month))

/** Gastos del mes hasta el día `uptoDay` inclusive (se ajusta a los días que tenga el mes). */
export function expensesUpToDay(expenses: Expense[], month: string, uptoDay: number): Expense[] {
  const limit = Math.min(uptoDay, daysInMonth(month))
  return inMonth(expenses, month).filter((e) => dayOf(e.date) <= limit)
}

/** Días transcurridos del mes: si es el mes en curso, el día de hoy; si no, el mes completo. */
export function elapsedDays(month: string, today: string): number {
  return today.startsWith(month) ? dayOf(today) : daysInMonth(month)
}

const previousMonths = (month: string, count = BASELINE_MONTHS) => lastMonths(month, count + 1).slice(0, count)

// ─── Gastos fijos vs variables ────────────────────────────────────────────────

/** Un gasto fijo se repite con montos parecidos: el mayor no supera en más de 60% al menor. */
const MAX_FIXED_RATIO = 1.6
/** …y se cobra más o menos el mismo día del mes (máximo 6 días de diferencia entre meses). */
const MAX_FIXED_DAY_SPREAD = 6

export interface RecurringExpense {
  /** Descripción tal como aparece en el gasto más reciente. */
  description: string
  /** Monto del mes anterior: se usa como estimado de los fijos que aún no se han cobrado. */
  expectedAmount: number
}

/**
 * Gastos recurrentes ("fijos") para un mes: descripciones que aparecen exactamente una vez en
 * cada uno de los 3 meses anteriores, con montos parecidos y cerca del mismo día del mes
 * (alquiler, luz, internet, streaming…).
 * El supermercado o la gasolina se repiten varias veces al mes, así que quedan como variables.
 */
export function recurringExpenses(expenses: Expense[], month: string): Map<string, RecurringExpense> {
  const months = previousMonths(month)
  const byKey = new Map<string, Expense[][]>()
  months.forEach((m, i) => {
    for (const e of inMonth(expenses, m)) {
      const key = normalizeText(e.description)
      const slots = byKey.get(key) ?? months.map(() => [])
      slots[i].push(e)
      byKey.set(key, slots)
    }
  })

  const result = new Map<string, RecurringExpense>()
  for (const [key, slots] of byKey) {
    if (!slots.every((s) => s.length === 1)) continue
    const amounts = slots.map((s) => s[0].amount)
    if (Math.max(...amounts) > Math.min(...amounts) * MAX_FIXED_RATIO) continue
    const days = slots.map((s) => dayOf(s[0].date))
    if (Math.max(...days) - Math.min(...days) > MAX_FIXED_DAY_SPREAD) continue
    const latest = slots[slots.length - 1][0]
    result.set(key, { description: latest.description, expectedAmount: latest.amount })
  }
  return result
}

export interface MonthBreakdown {
  fixedTotal: number
  variableTotal: number
  /** Fijos que se esperan este mes y aún no aparecen (solo mes en curso). */
  pendingFixed: RecurringExpense[]
  pendingFixedTotal: number
  /**
   * Proyección de cierre (solo mes en curso): fijos cobrados + fijos pendientes
   * + variables al ritmo diario actual. Así el alquiler no se multiplica por 30.
   */
  projectedTotal: number | null
}

export function monthBreakdown(expenses: Expense[], month: string, today: string): MonthBreakdown {
  const recurring = recurringExpenses(expenses, month)
  const current = inMonth(expenses, month)
  const isFixed = (e: Expense) => recurring.has(normalizeText(e.description))

  const fixedTotal = total(current.filter(isFixed))
  const variableTotal = total(current.filter((e) => !isFixed(e)))
  const isCurrentMonth = today.startsWith(month)

  const seen = new Set(current.map((e) => normalizeText(e.description)))
  const pendingFixed = isCurrentMonth
    ? [...recurring].filter(([key]) => !seen.has(key)).map(([, r]) => r)
    : []
  const pendingFixedTotal = roundMoney(pendingFixed.reduce((sum, r) => sum + r.expectedAmount, 0))

  const days = daysInMonth(month)
  const projectedTotal = isCurrentMonth
    ? roundMoney(fixedTotal + pendingFixedTotal + (variableTotal / dayOf(today)) * days)
    : null

  return { fixedTotal, variableTotal, pendingFixed, pendingFixedTotal, projectedTotal }
}

// ─── Insights ─────────────────────────────────────────────────────────────────

/** Cambio mínimo (en %) para que una categoría se mencione. */
const MIN_CATEGORY_CHANGE = 25
/** La diferencia debe pesar al menos 5% del gasto típico del período (evita ruido en montos chicos). */
const MIN_CATEGORY_WEIGHT = 0.05
/** Un gasto es inusual si supera esta cantidad de veces su monto típico. */
const UNUSUAL_FACTOR = 2.5
/** Muestras mínimas para calcular un monto típico. */
const MIN_SAMPLES = 3

export type Insight =
  | {
      kind: 'category-change'
      category: Category
      /** % vs el promedio de los 3 meses anteriores en el mismo período. */
      change: number
      amount: number
      baseline: number
      /** true si el mes está en curso y se comparan los primeros N días. */
      partial: boolean
    }
  | { kind: 'unusual-expense'; expense: Expense; category: Category; times: number }
  | { kind: 'top-month'; month: string; total: number }

/**
 * Hasta 4 observaciones del mes, de mayor a menor relevancia:
 * la categoría que más subió, la que más bajó, el gasto más inusual y el mes más caro del año.
 */
export function monthInsights(expenses: Expense[], categories: Category[], month: string, today: string): Insight[] {
  const insights: Insight[] = []
  const cutoff = elapsedDays(month, today)
  const partial = today.startsWith(month)
  const baselineMonths = previousMonths(month).filter((m) => inMonth(expenses, m).length > 0)
  const current = expensesUpToDay(expenses, month, cutoff)

  if (baselineMonths.length > 0) {
    const baselineOf = (categoryId: string) =>
      roundMoney(
        baselineMonths.reduce(
          (sum, m) => sum + total(expensesUpToDay(expenses, m, cutoff).filter((e) => e.categoryId === categoryId)),
          0,
        ) / baselineMonths.length,
      )
    const typicalPeriod =
      baselineMonths.reduce((sum, m) => sum + total(expensesUpToDay(expenses, m, cutoff)), 0) / baselineMonths.length

    const changes = categories
      .map((category) => {
        const amount = total(current.filter((e) => e.categoryId === category.id))
        const baseline = baselineOf(category.id)
        const change = baseline > 0 ? roundMoney(((amount - baseline) / baseline) * 100) : null
        return { category, amount, baseline, change }
      })
      .filter(
        (c): c is typeof c & { change: number } =>
          c.change !== null &&
          Math.abs(c.change) >= MIN_CATEGORY_CHANGE &&
          Math.abs(c.amount - c.baseline) >= typicalPeriod * MIN_CATEGORY_WEIGHT,
      )
      .sort((a, b) => b.change - a.change)

    const up = changes[0]
    const down = changes[changes.length - 1]
    if (up && up.change > 0) insights.push({ kind: 'category-change', ...up, partial })
    if (down && down.change < 0) insights.push({ kind: 'category-change', ...down, partial })
  }

  // Si el gasto inusual explica la categoría que más subió, no se repite la misma historia.
  const unusual = mostUnusualExpense(expenses, categories, month, current)
  const upCategory = insights.find((i) => i.kind === 'category-change' && i.change > 0)
  if (unusual && !(upCategory?.kind === 'category-change' && unusual.kind === 'unusual-expense' && upCategory.category.id === unusual.category.id))
    insights.push(unusual)

  const top = topMonthOfYear(expenses, month, today)
  if (top) insights.push(top)

  return insights
}

function mostUnusualExpense(
  expenses: Expense[],
  categories: Category[],
  month: string,
  current: Expense[],
): Insight | null {
  const history = previousMonths(month).flatMap((m) => inMonth(expenses, m))
  const recurring = recurringExpenses(expenses, month)
  let best: { expense: Expense; category: Category; times: number } | null = null

  for (const expense of current) {
    if (recurring.has(normalizeText(expense.description))) continue // el alquiler no es "inusual"
    // Monto típico: el del mismo comercio si hay historia suficiente; si no, el de la categoría.
    const key = normalizeText(expense.description)
    const sameMerchant = history.filter((e) => normalizeText(e.description) === key)
    const samples =
      sameMerchant.length >= MIN_SAMPLES ? sameMerchant : history.filter((e) => e.categoryId === expense.categoryId)
    if (samples.length < MIN_SAMPLES) continue
    const average = total(samples) / samples.length
    const times = roundMoney(expense.amount / average)
    const category = categories.find((c) => c.id === expense.categoryId)
    if (category && times >= UNUSUAL_FACTOR && (!best || times > best.times)) best = { expense, category, times }
  }
  return best ? { kind: 'unusual-expense', ...best } : null
}

/** El mes más caro del año hasta `month`; solo cuenta meses cerrados y exige al menos 3 con datos. */
function topMonthOfYear(expenses: Expense[], month: string, today: string): Insight | null {
  const [year, m] = month.split('-').map(Number)
  const months = Array.from({ length: m }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    .filter((mm) => !today.startsWith(mm))
    .map((mm) => ({ month: mm, total: total(inMonth(expenses, mm)) }))
    .filter((t) => t.total > 0)
  if (months.length < 3) return null
  const top = months.reduce((a, b) => (b.total > a.total ? b : a))
  return { kind: 'top-month', ...top }
}
