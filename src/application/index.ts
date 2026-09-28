// API pública de la capa de aplicación: puertos, estado y casos de uso. Depende solo del dominio.
export type * from './ports/dependencies'
export type * from './ports/repository'
export type * from './ports/system'
export * from './result'
export * from './state/storeReducer'
export * from './useCases/backupUseCases'
export * from './useCases/categoryUseCases'
export * from './useCases/expenseUseCases'
