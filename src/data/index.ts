import type { Category, Expense } from '../domain/types'
import { LocalStorageRepository, browserStorage } from './localStorageRepository'
import type { KeyValueStorage, Repository } from './repository'
import { defaultCategories } from './seed'

export const STORAGE_KEYS = {
  categories: 'gastos:v1:categories',
  expenses: 'gastos:v1:expenses',
} as const

export interface Repositories {
  categories: Repository<Category>
  expenses: Repository<Expense>
}

export function createRepositories(storage: KeyValueStorage = browserStorage()): Repositories {
  return {
    categories: new LocalStorageRepository(STORAGE_KEYS.categories, storage, defaultCategories),
    expenses: new LocalStorageRepository(STORAGE_KEYS.expenses, storage),
  }
}

export type { Repository, KeyValueStorage }
