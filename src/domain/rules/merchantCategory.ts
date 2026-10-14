import type { Category } from '../entities/category'

/** Quita tildes y pasa a minúsculas para comparar textos de comercios y categorías. */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Palabras clave de comercios frecuentes en Costa Rica → nombre de categoría por defecto.
 * El orden importa: gana la primera regla que coincide.
 */
const RULES: Array<[category: string, keywords: string[]]> = [
  ['Salud', ['farmacia', 'fischel', 'la bomba', 'sucre', 'clinica', 'hospital', 'laboratorio', 'optica']],
  ['Transporte', ['uber', 'didi', 'indriver', 'gasolinera', 'servicentro', 'delta', 'total energies', 'puma', 'uno', 'parqueo', 'peaje', 'riteve', 'compass']],
  ['Alimentación', ['automercado', 'auto mercado', 'walmart', 'mas x menos', 'masxmenos', 'pali', 'maxi pali', 'pricesmart', 'fresh market', 'mega super', 'super', 'soda', 'restaurante', 'rest', 'pizza', 'mcdonald', 'burger', 'kfc', 'subway', 'starbucks', 'cafe', 'panaderia', 'carniceria', 'rappi', 'uber eats', 'pedidos ya']],
  ['Servicios', ['ice', 'kolbi', 'claro', 'liberty', 'tigo', 'cabletica', 'telecable', 'cnfl', 'aya', 'esph', 'jasec', 'coopelesca', 'agua', 'electric']],
  ['Entretenimiento', ['netflix', 'spotify', 'disney', 'hbo', 'max', 'prime video', 'cinepolis', 'cine', 'steam', 'playstation', 'xbox', 'nintendo', 'youtube']],
  ['Educación', ['udemy', 'coursera', 'platzi', 'universidad', 'uned', 'libreria', 'colegio', 'escuela', 'curso']],
  ['Vivienda', ['alquiler', 'condominio', 'ferreteria', 'epa', 'el lagar', 'construplaza', 'pequeño mundo', 'muebles']],
]

/**
 * Sugiere la categoría de un gasto según el nombre del comercio.
 * Busca por NOMBRE (ignorando tildes) para funcionar también con categorías renombradas
 * o creadas por el usuario; si nada coincide usa "Otros" o, en su defecto, la primera.
 */
export function categoryForMerchant(merchant: string, categories: Category[]): Category | undefined {
  const words = normalizeText(merchant).replace(/[^a-z0-9]+/g, ' ')
  const byName = (name: string) => categories.find((c) => normalizeText(c.name) === normalizeText(name))
  // La palabra clave debe empezar una palabra del comercio: "ice" no coincide con "servICEs".
  const startsAWord = (keyword: string) => (` ${words}`).includes(` ${normalizeText(keyword)}`)

  for (const [name, keywords] of RULES) {
    if (keywords.some(startsAWord)) {
      const category = byName(name)
      if (category) return category
    }
  }
  return byName('Otros') ?? categories[0]
}
