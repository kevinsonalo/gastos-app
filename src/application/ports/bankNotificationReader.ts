import type { PaymentMethod } from '../../domain'

/** Transacción extraída de un correo de notificación bancaria, antes de convertirla en gasto. */
export interface BankTransaction {
  /** Origen: banco ('BAC', 'BCR'…) o remitente ('uber'). Forma parte del id del gasto. */
  bank: string
  /** Referencia o número de autorización: identifica la transacción para no importarla dos veces. */
  reference: string
  /** Fecha local YYYY-MM-DD. */
  date: string
  amount: number
  currency: 'CRC' | 'USD'
  merchant: string
  /** Tipo informado por el banco (COMPRA, DEVOLUCIÓN…), en mayúsculas. */
  kind: string
  /** Medio de pago detectado; si falta, se asume tarjeta. */
  paymentMethod?: PaymentMethod
}

/** Archivo de correo leído por la UI (.eml, .html o .txt). */
export interface EmailFile {
  name: string
  content: string
}

/**
 * Puerto para leer correos de un banco (ADR-012). Devuelve null si el archivo no es una
 * notificación de transacción reconocible. Lo implementa `EmailNotificationReader` con perfiles por banco (ADR-014).
 */
export interface BankNotificationReader {
  read(file: EmailFile): BankTransaction | null
}
