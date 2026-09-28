// Textos visibles de la UI para valores del dominio (es-CR). Mantenerlos fuera del dominio
// permite cambiar el idioma o la redacción sin tocar reglas de negocio.
import type { PaymentMethod } from '../domain'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Tarjeta',
  cash: 'Efectivo',
  sinpe: 'SINPE Móvil',
  transfer: 'Transferencia',
}
