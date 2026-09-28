import { describe, expect, it } from 'vitest'
import { storeReducer, type StoreState } from '../../application'
import { createGateway, STORAGE_KEYS } from '../../infrastructure/container'
import { MemoryStorage } from '../../infrastructure/storage/keyValueStorage'
import { exp } from '../fixtures'

describe('LocalStorageGateway', () => {
  it('carga las categorías por defecto cuando no hay datos', async () => {
    const state = await createGateway({ storage: new MemoryStorage() }).load()
    expect(state.categories.length).toBeGreaterThan(0)
    expect(state.expenses).toEqual([])
  })

  it('persiste solo la colección afectada por la acción', async () => {
    const storage = new MemoryStorage()
    const gateway = createGateway({ storage })
    const initial = await gateway.load()
    const action = { type: 'expense/add', expense: exp({ id: 'x' }) } as const

    await gateway.persist(action, storeReducer(initial, action))

    expect(storage.getItem(STORAGE_KEYS.categories)).toBeNull()
    expect((await createGateway({ storage }).load()).expenses.map((e) => e.id)).toEqual(['x'])
  })

  it('store/replace guarda ambas colecciones', async () => {
    const storage = new MemoryStorage()
    const gateway = createGateway({ storage })
    const next: StoreState = { categories: [], expenses: [exp({ id: 'y' })] }

    await gateway.persist({ type: 'store/replace', state: next }, next)

    const reloaded = await createGateway({ storage }).load()
    expect(reloaded.expenses.map((e) => e.id)).toEqual(['y'])
    expect(storage.getItem(STORAGE_KEYS.categories)).toBe('[]')
  })
})
