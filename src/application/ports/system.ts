/** Puertos para efectos no deterministas: los casos de uso los reciben inyectados. */
export interface IdGenerator {
  next(): string
}

export interface Clock {
  /** Instante actual en ISO-8601. */
  now(): string
}

export interface Services {
  ids: IdGenerator
  clock: Clock
}
