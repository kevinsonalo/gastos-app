import type { StoreGateway } from './storeGateway'
import type { Services } from './system'

/** Todo lo que la aplicación necesita del exterior; lo arma el composition root (main.tsx). */
export interface AppDependencies extends Services {
  gateway: StoreGateway
}
