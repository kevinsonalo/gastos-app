/**
 * Abstracción de persistencia (ADR-002). Una futura HttpRepository
 * implementará esta misma interfaz contra la API .NET.
 */
export interface Repository<T> {
  getAll(): T[]
  saveAll(items: T[]): void
}

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
