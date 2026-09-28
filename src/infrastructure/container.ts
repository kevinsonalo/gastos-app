import type { AppDependencies, StoreGateway } from '../application'
import type { Category, Expense } from '../domain'
import { HttpGateway } from './http/httpGateway'
import { browserStorage, type KeyValueStorage } from './storage/keyValueStorage'
import { LocalStorageGateway } from './storage/localStorageGateway'
import { LocalStorageRepository } from './storage/localStorageRepository'
import type { Repositories } from './storage/repository'
import { defaultCategories } from './storage/seed'
import { cryptoIdGenerator, systemClock } from './system/system'

export const STORAGE_KEYS = {
  categories: 'gastos:v1:categories',
  expenses: 'gastos:v1:expenses',
} as const

export const DEFAULT_API_URL = 'http://localhost:5080'

/** Origen de datos elegido por variables de entorno de Vite (ver `.env.example`). */
export interface DataConfig {
  /** 'api' usa el backend .NET; cualquier otro valor usa localStorage. */
  dataSource?: string
  apiUrl?: string
  storage?: KeyValueStorage
}

export function createRepositories(storage: KeyValueStorage = browserStorage()): Repositories {
  return {
    categories: new LocalStorageRepository<Category>(STORAGE_KEYS.categories, storage, defaultCategories),
    expenses: new LocalStorageRepository<Expense>(STORAGE_KEYS.expenses, storage),
  }
}

export function createGateway({ dataSource, apiUrl, storage }: DataConfig = {}): StoreGateway {
  if (dataSource === 'api') return new HttpGateway(apiUrl || DEFAULT_API_URL)
  return new LocalStorageGateway(createRepositories(storage))
}

/** Arma las implementaciones concretas de todos los puertos de la aplicación. */
export function createDependencies(config: DataConfig = {}): AppDependencies {
  return {
    gateway: createGateway(config),
    ids: cryptoIdGenerator,
    clock: systemClock,
  }
}
