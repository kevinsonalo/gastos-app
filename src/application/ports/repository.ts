import type { Category, Expense } from '../../domain'

/**
 * Puerto de persistencia (ADR-002). La infraestructura lo implementa
 * (hoy LocalStorageRepository; en fase 2, un HttpRepository contra la API .NET).
 */
export interface Repository<T> {
  getAll(): T[]
  saveAll(items: T[]): void
}

export interface Repositories {
  categories: Repository<Category>
  expenses: Repository<Expense>
}
