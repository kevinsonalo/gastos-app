import { describe, expect, it } from 'vitest'
import { addCategory, deleteCategory, updateCategory, type StoreState } from '../../application'
import { fakeServices } from '../fakes'
import { cats, exp } from '../fixtures'

const base: StoreState = { categories: cats, expenses: [] }

describe('addCategory', () => {
  it('normaliza nombre y color', () => {
    expect(addCategory(base, { name: '  Mascotas ', color: '#ABCDEF' }, fakeServices('T'))).toMatchObject({
      ok: true,
      action: { category: { id: 'id-1', name: 'Mascotas', color: '#abcdef', createdAt: 'T' } },
    })
  })

  it('rechaza nombres duplicados', () => {
    expect(addCategory(base, { name: 'transporte', color: '#000000' }, fakeServices()).ok).toBe(false)
  })
})

describe('updateCategory', () => {
  it('conserva id y createdAt', () => {
    expect(updateCategory(base, 'car', { name: 'Carro', color: '#000000' })).toMatchObject({
      ok: true,
      action: { category: { id: 'car', name: 'Carro', createdAt: cats[1].createdAt } },
    })
  })
})

describe('deleteCategory', () => {
  it('bloquea categorías con gastos (ADR-008)', () => {
    expect(deleteCategory({ ...base, expenses: [exp({ categoryId: 'food' })] }, 'food')).toEqual({
      ok: false,
      errors: { categoryId: expect.stringMatching(/1 gasto/) },
    })
  })

  it('permite eliminar categorías sin gastos', () => {
    expect(deleteCategory(base, 'fun')).toEqual({ ok: true, action: { type: 'category/delete', id: 'fun' } })
  })
})
