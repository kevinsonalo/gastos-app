/** Transacción extraída de un correo de notificación bancaria, antes de convertirla en gasto. */
export interface BankTransaction {
  /** Banco emisor, p. ej. 'BAC'. */
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
}

/** Archivo de correo leído por la UI (.eml, .html o .txt). */
export interface EmailFile {
  name: string
  content: string
}

/**
 * Puerto para leer correos de un banco (ADR-012). Devuelve null si el archivo no es una
 * notificación de transacción reconocible. Hoy lo implementa el lector de BAC Credomatic.
 */
export interface BankNotificationReader {
  read(file: EmailFile): BankTransaction | null
}
