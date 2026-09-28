import type { Repositories } from './repository'
import type { Services } from './system'

/** Todo lo que la aplicación necesita del exterior; lo arma el composition root (main.tsx). */
export interface AppDependencies extends Services {
  repositories: Repositories
}
