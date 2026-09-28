import type { KeyValueStorage, Repository } from './repository'

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

/** Storage en memoria: usado en pruebas y cuando localStorage no está disponible. */
export class MemoryStorage implements KeyValueStorage {
  private data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

export function browserStorage(): KeyValueStorage {
  try {
    const probe = '__gastos_probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return new MemoryStorage()
  }
}
