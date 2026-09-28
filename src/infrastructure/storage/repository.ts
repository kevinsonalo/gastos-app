import type { Category, Expense } from '../../domain'

/** Colección guardada como un arreglo completo en un almacenamiento clave → valor (ADR-002). */
export interface Repository<T> {
  getAll(): T[]
  saveAll(items: T[]): void
}

export interface Repositories {
  categories: Repository<Category>
  expenses: Repository<Expense>
}
