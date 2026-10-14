import { describe, expect, it } from 'vitest'
import { EmailNotificationReader } from '../../infrastructure/email/emailNotificationReader'
import { senderInfo, senderSlug } from '../../infrastructure/email/notificationParsing'
import { bacEml, unrelatedEmail } from '../samples/bacEmails'
import { bcrEmail, bnSinpeEmail, merchantReceipt, promoEmail } from '../samples/otherEmails'

const reader = new EmailNotificationReader()

describe('EmailNotificationReader (ADR-014)', () => {
  it('mantiene el mismo resultado para BAC: los ids ya importados no cambian', () => {
    expect(reader.read({ name: 'bac.eml', content: bacEml() })).toMatchObject({
      bank: 'BAC',
      reference: '512345678901',
      amount: 12500,
      paymentMethod: 'card',
    })
  })

  it('lee un correo de BCR con otras etiquetas', () => {
    expect(reader.read({ name: 'bcr.eml', content: bcrEmail })).toEqual({
      bank: 'BCR',
      reference: '000123456',
      date: '2026-10-13',
      amount: 8750,
      currency: 'CRC',
      merchant: 'FARMACIA FISCHEL CARTAGO',
      kind: 'COMPRA',
      paymentMethod: 'card',
    })
  })

  it('detecta un pago SINPE Móvil del BN y usa el beneficiario como comercio', () => {
    expect(reader.read({ name: 'bn.eml', content: bnSinpeEmail })).toMatchObject({
      bank: 'BN',
      merchant: 'VERDULERIA DON PEPE',
      amount: 3200,
      date: '2026-10-11',
      paymentMethod: 'sinpe',
    })
  })

  it('lee el recibo de un comercio sin perfil con el remitente como origen y comercio', () => {
    expect(reader.read({ name: 'uber.eml', content: merchantReceipt })).toMatchObject({
      bank: 'uber',
      merchant: 'Uber Receipts',
      amount: 4300,
      date: '2026-10-13',
    })
  })

  it('ignora correos sin monto, aunque vengan de un remitente conocido', () => {
    expect(reader.read({ name: 'promo.eml', content: promoEmail })).toBeNull()
    expect(reader.read({ name: 'news.eml', content: unrelatedEmail })).toBeNull()
  })

  it('con includeUnknownSenders en false solo lee bancos con perfil', () => {
    const banksOnly = new EmailNotificationReader(undefined, { includeUnknownSenders: false })
    expect(banksOnly.read({ name: 'uber.eml', content: merchantReceipt })).toBeNull()
    expect(banksOnly.read({ name: 'bcr.eml', content: bcrEmail })).not.toBeNull()
  })
})

describe('senderSlug', () => {
  it.each([
    ['Uber Receipts <noreply@uber.com>', 'uber'],
    ['BN <notificaciones@bncr.fi.cr>', 'bncr'],
    ['Tienda <ventas@mail.tiendaxyz.co.cr>', 'tiendaxyz'],
    ['Sin correo', 'sincorreo'],
  ])('%s → %s', (from, slug) => {
    expect(senderSlug(senderInfo(from))).toBe(slug)
  })
})
