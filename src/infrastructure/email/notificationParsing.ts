import { isValidISODate } from '../../domain'

/**
 * Utilidades para leer notificaciones de pago por correo, sin importar el banco o comercio
 * (ADR-012, ADR-014). Los campos se buscan por etiqueta, no por la estructura HTML.
 */

const MONTHS: Record<string, number> = {
  jan: 1, ene: 1, feb: 2, mar: 3, apr: 4, abr: 4, may: 5, jun: 6, jul: 7,
  aug: 8, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dec: 12, dic: 12,
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Valor que sigue a una etiqueta, en la misma celda/línea o en la siguiente.
 * Prueba las etiquetas EN ORDEN: la primera que aparece en el correo gana, aunque otra
 * esté antes en el texto (p. ej. "Referencia" tiene prioridad sobre "Autorización").
 */
export function field(text: string, labels: readonly string[]): string | undefined {
  for (const label of labels) {
    const match = new RegExp(`(?:^|[\\n\\t])\\s*(?:${label})\\s*:?[ \\t]*\\n?[ \\t]*([^\\n\\t]+)`, 'i').exec(text)
    const value = match?.[1].trim()
    if (value) return value
  }
  return undefined
}

/** Acepta "Oct 12, 2026, 14:35", "12 oct 2026", "12/10/2026" y "2026-10-12". */
export function parseBankDate(value: string): string | undefined {
  let y: number | undefined, m: number | undefined, d: number | undefined
  const named = /([a-záé]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i.exec(value)
  const namedDayFirst = /(\d{1,2})\s+(?:de\s+)?([a-záé]{3})[a-z]*\.?\s+(?:de\s+)?(\d{4})/i.exec(value)
  const slashed = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value)
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(value)

  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else if (named) [m, d, y] = [MONTHS[named[1].toLowerCase()], Number(named[2]), Number(named[3])]
  else if (namedDayFirst) [d, m, y] = [Number(namedDayFirst[1]), MONTHS[namedDayFirst[2].toLowerCase()], Number(namedDayFirst[3])]
  else if (slashed) [d, m, y] = [Number(slashed[1]), Number(slashed[2]), Number(slashed[3])]

  if (!y || !m || !d) return undefined
  const iso8601 = `${y}-${pad(m)}-${pad(d)}`
  return isValidISODate(iso8601) ? iso8601 : undefined
}

/** "CRC 12,500.00", "₡12.500,00", "USD 15.99", "$15.99" → { amount, currency }. */
export function parseBankAmount(value: string): { amount: number; currency: 'CRC' | 'USD' } | undefined {
  const currency: 'CRC' | 'USD' = /USD|US\$|\$|DOLAR/i.test(value) ? 'USD' : 'CRC'
  const number = /\d[\d.,]*/.exec(value)?.[0]
  if (!number) return undefined
  // El último separador seguido de 1-2 dígitos es el decimal; el resto son miles.
  const decimal = /[.,](\d{1,2})$/.exec(number)
  const integerPart = decimal ? number.slice(0, decimal.index) : number
  const amount = Number(`${integerPart.replace(/[.,]/g, '')}${decimal ? `.${decimal[1]}` : ''}`)
  return Number.isFinite(amount) && amount > 0 ? { amount, currency } : undefined
}

/** Hash corto y estable para correos sin número de referencia (evita duplicados al reimportar). */
export function stableHash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** 'Uber Receipts <noreply@uber.com>' → { name: 'Uber Receipts', domain: 'uber.com' }. */
export function senderInfo(from: string): { name: string; domain: string } {
  const domain = /@([^\s<>"]+)/.exec(from)?.[1].toLowerCase() ?? ''
  const name = from.replace(/<[^>]*>/g, '').replace(/"/g, '').trim()
  return { name: name.includes('@') ? '' : name, domain }
}

/** Segundos niveles comunes en dominios de país: 'bncr.fi.cr', 'tienda.co.cr', 'shop.com.mx'. */
const SECOND_LEVEL = new Set(['com', 'co', 'fi', 'go', 'ac', 'or', 'ed', 'net', 'org', 'gob'])

/** Identificador corto del remitente para el id del gasto: 'mail.uber.com' → 'uber'. */
export function senderSlug(sender: { name: string; domain: string }): string {
  const parts = sender.domain.split('.').filter(Boolean)
  const base =
    parts.length >= 3 && SECOND_LEVEL.has(parts.at(-2) ?? '') ? parts.at(-3) : parts.length >= 2 ? parts.at(-2) : sender.name
  return (base ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'correo'
}
