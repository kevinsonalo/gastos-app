import type { StoreAction, StoreState } from '../state/storeReducer'

/**
 * Puerto de persistencia del estado (ADR-011). La aplicación trabaja en memoria y
 * delega aquí cargar los datos y guardar cada acción aceptada.
 * Adaptadores: LocalStorageGateway (sin backend) y HttpGateway (API .NET).
 */
export interface StoreGateway {
  /** Texto para la UI que indica dónde se guardan los datos. */
  readonly label: string
  /** Carga el estado completo al iniciar la app. */
  load(): Promise<StoreState>
  /** Persiste una acción ya aplicada en memoria; `next` es el estado resultante. */
  persist(action: StoreAction, next: StoreState): Promise<void>
}
