/**
 * Perfiles de los bancos que la app reconoce por nombre (ADR-014). Agregar un banco es
 * agregar un perfil aquí: no hace falta otra clase. Los correos de remitentes sin perfil
 * (otros bancos, comercios, SINPE) se leen con las mismas etiquetas genéricas.
 */

export type NotificationField = 'merchant' | 'amount' | 'date' | 'reference' | 'kind'

export interface BankProfile {
  /** Nombre corto. Forma parte del id del gasto ("bac-<referencia>"): no cambiarlo después de importar. */
  bank: string
  /** Reconoce el correo por remitente, asunto o texto. */
  detect: RegExp
  /** Etiquetas propias del banco; se prueban antes que las genéricas. */
  labels?: Partial<Record<NotificationField, readonly string[]>>
}

/** Etiquetas usadas por bancos y comercios en Costa Rica, en orden de prioridad (fuentes de regex). */
export const DEFAULT_LABELS: Record<NotificationField, readonly string[]> = {
  merchant: ['Comercio', 'Nombre del comercio', 'Establecimiento', 'Beneficiario', 'Destinatario', 'Lugar', 'Descripci[oó]n'],
  amount: ['Monto', 'Importe', 'Total a pagar', 'Total cobrado', 'Total', 'Valor'],
  date: ['Fecha de (?:la )?transacci[oó]n', 'Fecha y hora', 'Fecha'],
  reference: [
    'Referencia',
    'N[uú]mero de referencia',
    'Comprobante',
    'N[uú]mero de comprobante',
    'Autorizaci[oó]n',
    'C[oó]digo de autorizaci[oó]n',
    'Documento',
  ],
  kind: ['Tipo de transacci[oó]n', 'Tipo de movimiento', 'Tipo de operaci[oó]n'],
}

export const BANK_PROFILES: readonly BankProfile[] = [
  { bank: 'BAC', detect: /\bBAC\b|Credomatic/i },
  { bank: 'BCR', detect: /\bBCR\b|Banco de Costa Rica/i },
  { bank: 'BN', detect: /Banco Nacional|\bbncr\b|\bBN (?:Costa Rica|Servicios|Notificaciones)/i },
  { bank: 'Popular', detect: /Banco Popular|bancopopular/i },
  { bank: 'Davivienda', detect: /Davivienda/i },
  { bank: 'Promerica', detect: /Promerica/i },
  { bank: 'Lafise', detect: /Lafise/i },
]

/** Combina las etiquetas del banco con las genéricas, sin repetir. */
export function labelsFor(profile?: BankProfile): Record<NotificationField, readonly string[]> {
  const merge = (key: NotificationField) => [...new Set([...(profile?.labels?.[key] ?? []), ...DEFAULT_LABELS[key]])]
  return { merchant: merge('merchant'), amount: merge('amount'), date: merge('date'), reference: merge('reference'), kind: merge('kind') }
}
