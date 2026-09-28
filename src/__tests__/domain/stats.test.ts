import { describe, expect, it } from 'vitest'
import { lastMonths } from '../domain/dates'
import { filterExpenses, monthSummary, monthlyTrend, sortExpenses, total, totalsByCategory } from '../domain/stats'
import { cats, exp } from './fixtures'

describe('total', () => {
  it('suma evitando errores de punto flotante', () => {
    expect(total([exp({ amount: 0.1 }), exp({ amount: 0.2 })])).toBe(0.3)
  })
})

describe('filterExpenses', () => {
  const data = [
    exp({ description: 'Almuerzo soda', date: '2026-09-01' }),
    exp({ description: 'Gasolina', categoryId: 'car', date: '2026-09-15' }),
    exp({ description: 'Cine', categoryId: 'fun', date: '2026-08-20' }),
  ]

  it('filtra por mes', () => {
    expect(filterExpenses(data, { month: '2026-09', categoryId: '', search: '' })).toHaveLength(2)
  })

  it('filtra por categoría y texto (sin distinguir mayúsculas)', () => {
    expect(filterExpenses(data, { month: '', categoryId: 'car', search: 'GASO' })).toHaveLength(1)
  })

  it('sin filtros devuelve todo', () => {
    expect(filterExpenses(data, { month: '', categoryId: '', search: '' })).toHaveLength(3)
  })
})

describe('sortExpenses', () => {
  it('ordena por fecha descendente sin mutar el arreglo original', () => {
    const data = [exp({ date: '2026-01-01' }), exp({ date: '2026-03-01' })]
    const sorted = sortExpenses(data)
    expect(sorted[0].date).toBe('2026-03-01')
    expect(data[0].date).toBe('2026-01-01')
  })
})

describe('totalsByCategory', () => {
  it('agrupa, calcula porcentaje y ordena descendente', () => {
    const result = totalsByCategory(
      [exp({ amount: 300 }), exp({ amount: 100, categoryId: 'car' }), exp({ amount: 600 })],
      cats,
    )
    expect(result.map((r) => r.category.id)).toEqual(['food', 'car'])
    expect(result[0]).toMatchObject({ total: 900, count: 2, percentage: 90 })
  })

  it('omite categorías sin gastos', () => {
    expect(totalsByCategory([], cats)).toEqual([])
  })
})

describe('monthlyTrend / lastMonths', () => {
  it('cruza el cambio de año', () => {
    expect(lastMonths('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('rellena con 0 los meses sin gastos', () => {
    const trend = monthlyTrend([exp({ date: '2026-09-05', amount: 500 })], '2026-09', 3)
    expect(trend).toEqual([
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 0 },
      { month: '2026-09', total: 500 },
    ])
  })
})

describe('monthSummary', () => {
  const data = [
    exp({ date: '2026-08-10', amount: 1000 }),
    exp({ date: '2026-09-02', amount: 1000, categoryId: 'car' }),
    exp({ date: '2026-09-05', amount: 500 }),
  ]

  it('promedia sobre días transcurridos en el mes en curso', () => {
    const s = monthSummary(data, cats, '2026-09', '2026-09-10')
    expect(s.total).toBe(1500)
    expect(s.dailyAverage).toBe(150)
    expect(s.topCategory?.category.id).toBe('car')
    expect(s.changeVsPrevious).toBe(50)
  })

  it('promedia sobre el mes completo en meses pasados', () => {
    expect(monthSummary(data, cats, '2026-08', '2026-09-10').dailyAverage).toBeCloseTo(1000 / 31, 2)
  })

  it('changeVsPrevious es null si el mes anterior no tiene gastos', () => {
    expect(monthSummary(data, cats, '2026-08', '2026-09-10').changeVsPrevious).toBeNull()
  })
})

describe('monthLabel', () => {
  it('capitaliza solo la primera letra del mes largo', async () => {
    const { monthLabel } = await import('../domain/dates')
    expect(monthLabel('2026-09', true)).toMatch(/^Septiembre/)
    expect(monthLabel('2026-09')).toBe('Sep 26')
  })
})
