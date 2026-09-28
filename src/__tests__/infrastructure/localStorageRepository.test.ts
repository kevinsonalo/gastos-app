import { describe, expect, it } from 'vitest'
import { createRepositories, STORAGE_KEYS } from '../../infrastructure/container'
import { MemoryStorage } from '../../infrastructure/storage/keyValueStorage'
import { exp } from '../fixtures'

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
