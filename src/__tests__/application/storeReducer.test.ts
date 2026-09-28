import { describe, expect, it } from 'vitest'
import { storeReducer, type StoreState } from '../../application'
import { cats, exp } from '../fixtures'

const base: StoreState = { categories: cats, expenses: [] }

describe('storeReducer', () => {
  it('agrega sin mutar el estado anterior', () => {
    const expense = exp({ id: 'x' })
    const s = storeReducer(base, { type: 'expense/add', expense })
    expect(s.expenses).toEqual([expense])
    expect(base.expenses).toHaveLength(0)
  })

  it('reemplaza solo el gasto indicado', () => {
    const a = exp({ id: 'a' })
    const b = exp({ id: 'b' })
    const s = storeReducer({ ...base, expenses: [a, b] }, { type: 'expense/update', expense: { ...a, amount: 99 } })
    expect(s.expenses.map((e) => e.amount)).toEqual([99, b.amount])
  })

  it('elimina un gasto', () => {
    const s1 = storeReducer(base, { type: 'expense/add', expense: exp({ id: 'x' }) })
    expect(storeReducer(s1, { type: 'expense/delete', id: 'x' }).expenses).toHaveLength(0)
  })

  it('no elimina una categoría con gastos (ADR-008)', () => {
    const state = { ...base, expenses: [exp({ categoryId: 'food' })] }
    expect(storeReducer(state, { type: 'category/delete', id: 'food' })).toBe(state)
    expect(storeReducer(state, { type: 'category/delete', id: 'fun' }).categories).toHaveLength(2)
  })
})
