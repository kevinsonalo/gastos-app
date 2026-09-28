import { describe, expect, it } from 'vitest'
import { addExpense, updateExpense, type StoreState } from '../../application'
import type { ExpenseInput } from '../../domain'
import { fakeServices } from '../fakes'
import { cats, exp } from '../fixtures'

const base: StoreState = { categories: cats, expenses: [] }
const input: ExpenseInput = {
  amount: 10.555,
  description: '  Café  ',
  categoryId: 'food',
  date: '2026-09-27',
  paymentMethod: 'cash',
}

describe('addExpense', () => {
  it('normaliza y asigna id y fechas desde los servicios inyectados', () => {
    expect(addExpense(base, input, fakeServices('T'))).toMatchObject({
      ok: true,
      action: {
        type: 'expense/add',
        expense: { id: 'id-1', amount: 10.56, description: 'Café', createdAt: 'T', updatedAt: 'T' },
      },
    })
  })

  it('rechaza con errores de validación sin producir acción', () => {
    expect(addExpense(base, { ...input, amount: 0 }, fakeServices())).toEqual({
      ok: false,
      errors: { amount: expect.any(String) },
    })
  })
})

describe('updateExpense', () => {
  it('conserva id y createdAt y actualiza updatedAt', () => {
    const current = exp({ id: 'x', createdAt: 'T1' })
    const decision = updateExpense({ ...base, expenses: [current] }, 'x', { ...input, amount: 99 }, fakeServices('T2'))
    expect(decision).toMatchObject({
      ok: true,
      action: { expense: { id: 'x', amount: 99, createdAt: 'T1', updatedAt: 'T2' } },
    })
  })

  it('falla si el gasto no existe', () => {
    expect(updateExpense(base, 'ghost', input, fakeServices()).ok).toBe(false)
  })
})
