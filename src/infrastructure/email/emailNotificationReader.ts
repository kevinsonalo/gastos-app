import type { BankNotificationReader, BankTransaction, EmailFile } from '../../application'
import type { PaymentMethod } from '../../domain'
import { BANK_PROFILES, labelsFor, type BankProfile, type NotificationField } from './bankProfiles'
import { parseEmail, type ParsedEmail } from './mimeText'
import { field, parseBankAmount, parseBankDate, senderInfo, senderSlug, stableHash } from './notificationParsing'

export interface EmailReaderOptions {
  /**
   * Leer también correos de remitentes sin perfil (otros bancos, comercios, SINPE).
   * Solo se aceptan si traen un monto y un comercio o remitente reconocibles.
   */
  includeUnknownSenders?: boolean
}

/**
 * Lee notificaciones de pago de cualquier banco o comercio (ADR-014).
 * 1. Si el remitente coincide con un perfil (BAC, BCR, BN…), usa ese banco.
 * 2. Si no, y `includeUnknownSenders` está activo, usa el dominio del remitente como origen
 *    y su nombre como comercio cuando el correo no trae una etiqueta "Comercio".
 */
export class EmailNotificationReader implements BankNotificationReader {
  private readonly profiles: readonly BankProfile[]
  private readonly options: EmailReaderOptions

  constructor(profiles: readonly BankProfile[] = BANK_PROFILES, options: EmailReaderOptions = { includeUnknownSenders: true }) {
    this.profiles = profiles
    this.options = options
  }

  read(file: EmailFile): BankTransaction | null {
    const email = parseEmail(file.content)
    const header = `${email.from}\n${email.subject}`
    // Primero por remitente/asunto; si no, por el texto (correos guardados como .html no traen encabezados).
    const profile =
      this.profiles.find((p) => p.detect.test(header)) ??
      this.profiles.find((p) => p.detect.test(`${header}\n${email.text}`))

    if (profile) return extract(email, profile.bank, labelsFor(profile))
    if (!this.options.includeUnknownSenders) return null

    const sender = senderInfo(email.from)
    if (!sender.domain && !sender.name) return null // sin remitente no hay forma de saber de dónde viene
    return extract(email, senderSlug(sender), labelsFor(), sender.name || undefined)
  }
}

function extract(
  email: ParsedEmail,
  source: string,
  labels: Record<NotificationField, readonly string[]>,
  fallbackMerchant?: string,
): BankTransaction | null {
  const merchant = field(email.text, labels.merchant) ?? fallbackMerchant
  const money = parseBankAmount(field(email.text, labels.amount) ?? '')
  const date = parseBankDate(field(email.text, labels.date) ?? '') ?? parseBankDate(email.date ?? '')
  if (!merchant || !money || !date) return null

  const reference = field(email.text, labels.reference)?.replace(/\W/g, '') || stableHash(`${date}|${merchant}|${money.amount}`)
  const kind = (field(email.text, labels.kind) ?? 'COMPRA').toUpperCase()

  return {
    bank: source,
    reference,
    date,
    amount: money.amount,
    currency: money.currency,
    merchant: merchant.replace(/\s+/g, ' '),
    kind,
    paymentMethod: paymentMethodFor(`${email.subject}\n${kind}`),
  }
}

/** Solo mira el asunto y el tipo: los pies de los correos suelen promocionar SINPE u otros servicios. */
function paymentMethodFor(text: string): PaymentMethod {
  if (/SINPE/i.test(text)) return 'sinpe'
  if (/TRANSFERENCIA/i.test(text)) return 'transfer'
  return 'card'
}
