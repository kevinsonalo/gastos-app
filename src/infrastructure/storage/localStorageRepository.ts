import type { Repository } from './repository'
import type { KeyValueStorage } from './keyValueStorage'

export class LocalStorageRepository<T> implements Repository<T> {
  private readonly key: string
  private readonly storage: KeyValueStorage
  private readonly fallback: () => T[]

  constructor(key: string, storage: KeyValueStorage, fallback: () => T[] = () => []) {
    this.key = key
    this.storage = storage
    this.fallback = fallback
  }

  getAll(): T[] {
    try {
      const raw = this.storage.getItem(this.key)
      if (raw === null) return this.fallback()
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as T[]) : this.fallback()
    } catch {
      // Datos corruptos o storage bloqueado: no romper la app.
      return this.fallback()
    }
  }

  saveAll(items: T[]): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(items))
    } catch (err) {
      console.error(`No se pudo guardar "${this.key}"`, err)
    }
  }
}
