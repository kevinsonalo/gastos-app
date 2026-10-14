import type { Category } from './category'

/**
 * Categorías iniciales de la app. Son una regla de negocio (no un detalle de almacenamiento):
 * las usan el primer arranque, "Borrar todo" y la asignación automática de categorías al
 * importar correos. Los ids coinciden con el seed del backend (.NET).
 */
const DEFAULTS: Array<[id: string, name: string, color: string]> = [
  ['cat-1', 'Alimentación', '#e07a5f'],
  ['cat-2', 'Transporte', '#3d85c6'],
  ['cat-3', 'Vivienda', '#81b29a'],
  ['cat-4', 'Servicios', '#f2cc8f'],
  ['cat-5', 'Salud', '#c97cc4'],
  ['cat-6', 'Entretenimiento', '#5bc0be'],
  ['cat-7', 'Educación', '#6a67ce'],
  ['cat-8', 'Otros', '#8d99ae'],
]

export function defaultCategories(): Category[] {
  const createdAt = new Date(0).toISOString()
  return DEFAULTS.map(([id, name, color]) => ({ id, name, color, createdAt }))
}
