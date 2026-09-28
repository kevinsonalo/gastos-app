// Formato para mostrar en pantalla (locale es-CR, ADR-006). No es lógica de negocio.

const crc = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return crc.format(amount)
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function monthLabel(month: string, long = false): string {
  const [y, m] = month.split('-').map(Number)
  if (long) {
    const text = new Date(y, m - 1, 1).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return `${MONTHS_ES[m - 1]} ${String(y).slice(2)}`
}
