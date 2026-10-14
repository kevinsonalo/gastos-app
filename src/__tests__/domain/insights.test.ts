import { describe, expect, it } from 'vitest'
import { monthBreakdown, monthInsights, monthSummary, recurringExpenses, type Expense } from '../../domain'
import { cats, exp } from '../fixtures'

/** Alquiler el día 1 y supermercado 3 veces por mes, de julio a setiembre. */
function history(): Expense[] {
  const data: Expense[] = []
  for (const m of ['07', '08', '09']) {
    data.push(exp({ description: 'ALQUILER', amount: 100000, categoryId: 'fun', date: `2026-${m}-01` }))
    for (const d of ['05', '15', '25']) data.push(exp({ description: 'SUPERMERCADO', amount: 10000, date: `2026-${m}-${d}` }))
    data.push(exp({ description: 'TAXI', amount: 5000, categoryId: 'car', date: `2026-${m}-10` }))
  }
  return data
}

describe('monthSummary · comparación justa', () => {
  it('en el mes en curso compara el mismo período del mes anterior', () => {
    const data = [
      exp({ date: '2026-09-05', amount: 1000 }),
      exp({ date: '2026-09-25', amount: 9000 }), // fuera del período comparable
      exp({ date: '2026-10-03', amount: 1500 }),
    ]
    const s = monthSummary(data, cats, '2026-10', '2026-10-13')
    expect(s.changeVsPrevious).toBe(50)
    expect(s.comparedDays).toBe(13)
  })

  it('en meses cerrados compara meses completos', () => {
    expect(monthSummary(history(), cats, '2026-09', '2026-10-13').comparedDays).toBeNull()
  })
})

describe('recurringExpenses', () => {
  it('detecta los fijos (una vez por mes, monto y día parecidos) e ignora los que se repiten varias veces', () => {
    const keys = [...recurringExpenses(history(), '2026-10').keys()]
    expect(keys).toContain('alquiler')
    expect(keys).toContain('taxi')
    expect(keys).not.toContain('supermercado')
  })

  it('descarta montos muy distintos o días muy separados', () => {
    const data = [
      exp({ description: 'CINE', date: '2026-07-02', amount: 5000 }),
      exp({ description: 'CINE', date: '2026-08-20', amount: 5000 }),
      exp({ description: 'CINE', date: '2026-09-02', amount: 5000 }),
      exp({ description: 'LUZ', date: '2026-07-10', amount: 10000 }),
      exp({ description: 'LUZ', date: '2026-08-10', amount: 30000 }),
      exp({ description: 'LUZ', date: '2026-09-10', amount: 10000 }),
    ]
    expect(recurringExpenses(data, '2026-10').size).toBe(0)
  })
})

describe('monthBreakdown', () => {
  it('separa fijos y variables y proyecta sin multiplicar los fijos', () => {
    const data = [
      ...history(),
      exp({ description: 'ALQUILER', amount: 100000, categoryId: 'fun', date: '2026-10-01' }),
      exp({ description: 'SUPERMERCADO', amount: 15500, date: '2026-10-05' }),
    ]
    const b = monthBreakdown(data, '2026-10', '2026-10-10')
    expect(b.fixedTotal).toBe(100000)
    expect(b.variableTotal).toBe(15500)
    expect(b.pendingFixed.map((p) => p.description)).toEqual(['TAXI'])
    // 100 000 fijos + 5 000 pendientes + 15 500 / 10 días × 31
    expect(b.projectedTotal).toBe(153050)
  })

  it('no proyecta meses cerrados', () => {
    const b = monthBreakdown(history(), '2026-09', '2026-10-10')
    expect(b.projectedTotal).toBeNull()
    expect(b.pendingFixed).toEqual([])
  })
})

describe('monthInsights', () => {
  it('señala la categoría que más subió vs el promedio del mismo período', () => {
    const data = [...history(), exp({ description: 'GASOLINERA', categoryId: 'car', amount: 40000, date: '2026-10-08' })]
    const insights = monthInsights(data, cats, '2026-10', '2026-10-10')
    const change = insights.find((i) => i.kind === 'category-change')
    expect(change).toMatchObject({ kind: 'category-change', change: 700, amount: 40000, baseline: 5000, partial: true })
    expect(change && 'category' in change && change.category.id).toBe('car')
  })

  it('detecta un gasto inusual comparándolo con el mismo comercio', () => {
    // Un restaurante mensual sube el gasto típico de Alimentación: la categoría no "se dispara".
    const restaurant = ['07', '08', '09'].map((m) => exp({ description: 'RESTAURANTE', amount: 50000, date: `2026-${m}-20` }))
    const data = [
      ...history(),
      ...restaurant,
      exp({ description: 'SUPERMERCADO', amount: 60000, date: '2026-10-05' }),
      exp({ description: 'TAXI', amount: 5000, categoryId: 'car', date: '2026-10-06' }),
    ]
    const unusual = monthInsights(data, cats, '2026-10', '2026-10-31').find((i) => i.kind === 'unusual-expense')
    expect(unusual).toMatchObject({ kind: 'unusual-expense', times: 6 })
  })

  it('no repite la historia: si el gasto inusual explica la categoría que más subió, se omite', () => {
    const data = [...history(), exp({ description: 'SUPERMERCADO', amount: 60000, date: '2026-10-05' })]
    const kinds = monthInsights(data, cats, '2026-10', '2026-10-31').map((i) => i.kind)
    expect(kinds).toContain('category-change')
    expect(kinds).not.toContain('unusual-expense')
  })

  it('identifica el mes más caro del año entre los meses cerrados', () => {
    const data = [...history(), exp({ amount: 50000, date: '2026-08-20' })]
    expect(monthInsights(data, cats, '2026-10', '2026-10-10')).toContainEqual({
      kind: 'top-month',
      month: '2026-08',
      total: 185000,
    })
  })

  it('sin historia no inventa observaciones', () => {
    expect(monthInsights([exp({ date: '2026-10-01' })], cats, '2026-10', '2026-10-10')).toEqual([])
  })
})
