import type { StoreAction, StoreGateway, StoreState } from '../../application'
import type { Repositories } from './repository'

/** Adaptador sin backend: guarda cada colección como JSON en localStorage. */
export class LocalStorageGateway implements StoreGateway {
  readonly label = 'Datos guardados en este navegador'
  private readonly repositories: Repositories

  constructor(repositories: Repositories) {
    this.repositories = repositories
  }

  async load(): Promise<StoreState> {
    return {
      categories: this.repositories.categories.getAll(),
      expenses: this.repositories.expenses.getAll(),
    }
  }

  async persist(action: StoreAction, next: StoreState): Promise<void> {
    // Solo se reescribe la colección que cambió.
    const replaceAll = action.type === 'store/replace'
    if (replaceAll || action.type.startsWith('expense/')) this.repositories.expenses.saveAll(next.expenses)
    if (replaceAll || action.type.startsWith('category/')) this.repositories.categories.saveAll(next.categories)
  }
}
