/** Redondea a 2 decimales (ADR-005). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
