import { describe, expect, it } from 'vitest'
import { BacNotificationReader, parseBankAmount, parseBankDate } from '../../infrastructure/email/bacNotificationReader'
import { decodeHeader, parseEmail } from '../../infrastructure/email/mimeText'
import { bacEml, bacSavedHtml, unrelatedEmail } from '../samples/bacEmails'

const reader = new BacNotificationReader()

describe('mimeText', () => {
  it('decodifica quoted-printable UTF-8 y quita el HTML', () => {
    const email = parseEmail(bacEml())
    expect(email.subject).toBe('Notificación de transacción')
    expect(email.text).toContain('Ciudad y país:\tSAN JOSE, Costa Rica')
    expect(email.text).not.toContain('<td>')
  })

  it('decodifica encabezados en base64', () => {
    expect(decodeHeader('=?UTF-8?B?Tm90aWZpY2FjacOzbg==?=')).toBe('Notificación')
  })
})

describe('BacNotificationReader', () => {
  it('lee una notificación .eml de BAC', () => {
    expect(reader.read({ name: 'a.eml', content: bacEml() })).toEqual({
      bank: 'BAC',
      reference: '512345678901',
      date: '2026-10-12',
      amount: 12500,
      currency: 'CRC',
      merchant: 'AUTOMERCADO TRES RIOS',
      kind: 'COMPRA',
    })
  })

  it('lee un correo guardado como .html, en dólares y con fecha dd/mm/aaaa', () => {
    expect(reader.read({ name: 'b.html', content: bacSavedHtml })).toMatchObject({
      date: '2026-10-05',
      amount: 9.5,
      currency: 'USD',
      merchant: 'UBER *TRIP',
    })
  })

  it('ignora correos que no son de BAC', () => {
    expect(reader.read({ name: 'c.eml', content: unrelatedEmail })).toBeNull()
  })
})

describe('parseBankAmount / parseBankDate', () => {
  it.each([
    ['CRC 12,500.00', 12500, 'CRC'],
    ['₡12.500,50', 12500.5, 'CRC'],
    ['USD 15.99', 15.99, 'USD'],
    ['$1,234', 1234, 'USD'],
  ] as const)('%s → %d %s', (text, amount, currency) => {
    expect(parseBankAmount(text)).toEqual({ amount, currency })
  })

  it.each([
    ['Oct 12, 2026, 14:35', '2026-10-12'],
    ['12 de setiembre de 2026', '2026-09-12'],
    ['31/12/2026 10:00', '2026-12-31'],
    ['Mon, 12 Oct 2026 14:36:02 -0600', '2026-10-12'],
    ['30/02/2026', undefined],
  ])('%s → %s', (text, iso) => {
    expect(parseBankDate(text)).toBe(iso)
  })
})
