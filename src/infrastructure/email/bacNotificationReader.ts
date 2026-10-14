import { BANK_PROFILES } from './bankProfiles'
import { EmailNotificationReader } from './emailNotificationReader'

/**
 * Lector solo de BAC Credomatic (ADR-012). Se mantiene por compatibilidad: la app usa
 * `EmailNotificationReader`, que reconoce cualquier banco o comercio (ADR-014).
 */
export class BacNotificationReader extends EmailNotificationReader {
  constructor() {
    super(BANK_PROFILES.filter((p) => p.bank === 'BAC'), { includeUnknownSenders: false })
  }
}

export { parseBankAmount, parseBankDate } from './notificationParsing'
