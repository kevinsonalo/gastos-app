/** Mueve el punto decimal `places` posiciones usando notación exponencial (sin error de multiplicación). */
function shift(value: number, places: number): number {
  const [mantissa, exponent = '0'] = String(value).split('e')
  return Number(`${mantissa}e${Number(exponent) + places}`)
}

/**
 * Redondea a 2 decimales (ADR-005). No usa `Math.round(value * 100) / 100`
 * porque, p. ej., 2500.555 * 100 = 250055.49999999997 y redondearía hacia abajo.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return value
  return shift(Math.round(shift(value, 2)), -2)
}
