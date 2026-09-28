import type { Category } from '../domain/types'

const SEED: Array<[string, string]> = [
  ['Alimentación', '#e07a5f'],
  ['Transporte', '#3d85c6'],
  ['Vivienda', '#81b29a'],
  ['Servicios', '#f2cc8f'],
  ['Salud', '#c97cc4'],
  ['Entretenimiento', '#5bc0be'],
  ['Educación', '#6a67ce'],
  ['Otros', '#8d99ae'],
]

export function defaultCategories(): Category[] {
  const createdAt = new Date(0).toISOString()
  return SEED.map(([name, color], i) => ({ id: `cat-${i + 1}`, name, color, createdAt }))
}
