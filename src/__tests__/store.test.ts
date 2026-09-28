import { describe, expect, it } from 'vitest'
import { createRepositories, STORAGE_KEYS } from '../data'
import { MemoryStorage } from '../data/localStorageRepository'
import { parseBackup } from '../hooks/backup'
import { expenseReducer, type StoreState } from '../hooks/expenseReducer'
import { cats, exp } from './fixtures'

const base: StoreState = { categories: cats, expenses: [] }
const input = { amount: 10.555, description: '  Café  ', categoryId: 'food', date: '2026-09-27', paymentMethod: 'cash' as const }

describe('expenseReducer', () => {
  it('agrega normalizando monto y descripción', () => {
    const s = expenseReducer(base, { type: 'expense/add', id: 'x', now: 'T', input })
    expect(s.expenses[0]).toMatchObject({ id: 'x', amount: 10.56, description: 'Café', createdAt: 'T' })
    expect(base.expenses).toHaveLength(0) // inmutable
  })

  it('actualiza solo el gasto indicado y conserva createdAt', () => {
    const s1 = expenseReducer(base, { type: 'expense/add', id: 'x', now: 'T1', input })
    const s2 = expenseReducer(s1, { type: 'expense/update', id: 'x', now: 'T2', input: { ...input, amount: 99 } })
    expect(s2.expenses[0]).toMatchObject({ amount: 99, createdAt: 'T1', updatedAt: 'T2' })
  })

  it('elimina un gasto', () => {
    const s1 = expenseReducer(base, { type: 'expense/add', id: 'x', now: 'T', input })
    expect(expenseReducer(s1, { type: 'expense/delete', id: 'x' }).expenses).toHaveLength(0)
  })

  it('no elimina una categoría con gastos (ADR-008)', () => {
    const state = { ...base, expenses: [exp({ categoryId: 'food' })] }
    expect(expenseReducer(state, { type: 'category/delete', id: 'food' })).toBe(state)
    expect(expenseReducer(state, { type: 'category/delete', id: 'fun' }).categories).toHaveLength(2)
  })
})

describe('LocalStorageRepository', () => {
  it('siembra categorías por defecto y persiste gastos', () => {
    const storage = new MemoryStorage()
    const repos = createRepositories(storage)
    expect(repos.categories.getAll().length).toBeGreaterThan(0)
    repos.expenses.saveAll([exp({})])
    expect(createRepositories(storage).expenses.getAll()).toHaveLength(1)
  })

  it('tolera JSON corrupto devolviendo el valor por defecto', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.expenses, '{not json')
    expect(createRepositories(storage).expenses.getAll()).toEqual([])
  })
})

describe('parseBackup', () => {
  it('acepta un respaldo válido', () => {
    const json = JSON.stringify({ version: 1, categories: cats, expenses: [exp({})] })
    expect(parseBackup(json).ok).toBe(true)
  })

  it('rechaza JSON inválido', () => {
    expect(parseBackup('nope').ok).toBe(false)
  })

  it('rechaza gastos con categorías inexistentes', () => {
    const json = JSON.stringify({ categories: cats, expenses: [exp({ categoryId: 'ghost' })] })
    expect(parseBackup(json)).toMatchObject({ ok: false })
  })
})
