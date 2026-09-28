import type { AppDependencies, Repositories } from '../application'
import type { Category, Expense } from '../domain'
import { browserStorage, type KeyValueStorage } from './storage/keyValueStorage'
import { LocalStorageRepository } from './storage/localStorageRepository'
import { defaultCategories } from './storage/seed'
import { cryptoIdGenerator, systemClock } from './system/system'

export const STORAGE_KEYS = {
  categories: 'gastos:v1:categories',
  expenses: 'gastos:v1:expenses',
} as const

export function createRepositories(storage: KeyValueStorage = browserStorage()): Repositories {
  return {
    categories: new LocalStorageRepository<Category>(STORAGE_KEYS.categories, storage, defaultCategories),
    expenses: new LocalStorageRepository<Expense>(STORAGE_KEYS.expenses, storage),
  }
}

/** Arma las implementaciones concretas de todos los puertos de la aplicación. */
export function createDependencies(storage?: KeyValueStorage): AppDependencies {
  return {
    repositories: createRepositories(storage),
    ids: cryptoIdGenerator,
    clock: systemClock,
  }
}
