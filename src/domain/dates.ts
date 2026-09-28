const pad = (n: number) => String(n).padStart(2, '0')

/** Fecha local de hoy en formato YYYY-MM-DD (evita desfase UTC). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonth(now: Date = new Date()): string {
  return todayISO(now).slice(0, 7)
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Días del mes (YYYY-MM). */
export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Devuelve los últimos `count` meses (YYYY-MM) terminando en `endMonth`, en orden ascendente. */
export function lastMonths(endMonth: string, count: number): string[] {
  const [y, m] = endMonth.split('-').map(Number)
  const result: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    result.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }
  return result
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function monthLabel(month: string, long = false): string {
  const [y, m] = month.split('-').map(Number)
  if (long) {
    return new Date(y, m - 1, 1).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })
  }
  return `${MONTHS_ES[m - 1]} ${String(y).slice(2)}`
}
