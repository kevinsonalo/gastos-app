/** Subconjunto de la Web Storage API que usan los repositorios. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
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
