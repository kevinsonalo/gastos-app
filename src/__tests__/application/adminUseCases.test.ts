import { describe, expect, it } from 'vitest'
import { importBankEmails, resetData, storeReducer, type BankNotificationReader, type BankTransaction, type StoreState } from '../../application'
import { categoryForMerchant, defaultCategories } from '../../domain'
import { BacNotificationReader } from '../../infrastructure/email/bacNotificationReader'
import { EmailNotificationReader } from '../../infrastructure/email/emailNotificationReader'
import { bcrEmail, bnSinpeEmail, merchantReceipt, promoEmail } from '../samples/otherEmails'
import { fakeServices } from '../fakes'
import { exp } from '../fixtures'
import { bacEml, bacSavedHtml, unrelatedEmail } from '../samples/bacEmails'

const base: StoreState = { categories: defaultCategories(), expenses: [] }
const reader = new BacNotificationReader()
const services = fakeServices('2026-10-13T12:00:00.000Z')

describe('resetData', () => {
  it('deja las categorías por defecto y ningún gasto', () => {
    const decision = resetData()
    expect(decision.ok).toBe(true)
    if (!decision.ok) return
    const next = storeReducer({ categories: [], expenses: [exp({})] }, decision.action)
    expect(next.expenses).toEqual([])
    expect(next.categories.map((c) => c.id)).toEqual(defaultCategories().map((c) => c.id))
  })
})

describe('categoryForMerchant', () => {
  it.each([
    ['AUTOMERCADO TRES RIOS', 'Alimentación'],
    ['UBER *TRIP', 'Transporte'],
    ['FARMACIA FISCHEL', 'Salud'],
    ['NETFLIX.COM', 'Entretenimiento'],
    ['KOLBI ICE', 'Servicios'],
    ['SERVICES INC', 'Otros'],
    ['VERDULERIA', 'Alimentación'],
    ['TAXI', 'Transporte'],
    ['MEDICINAS', 'Salud'],
    ['LUZ', 'Servicios'],
    ['INTERNET', 'Servicios'],
    ['STREAMING', 'Entretenimiento'],
    ['MATRICULA UNIVERSIDAD', 'Educación'],
    ['ARTICULOS HOGAR', 'Vivienda'],
    ['ROPA', 'Otros'],
  ])('%s → %s', (merchant, category) => {
    expect(categoryForMerchant(merchant, defaultCategories())?.name).toBe(category)
  })
})

describe('importBankEmails', () => {
  it('importa compras, categoriza y genera el id desde la referencia', () => {
    const { decision, report } = importBankEmails(base, [{ name: 'a.eml', content: bacEml() }], reader, services)
    expect(report).toMatchObject({ read: 1, imported: 1, duplicates: 0, skipped: [] })
    if (!decision.ok || decision.action.type !== 'expense/import') throw new Error('esperaba expense/import')
    expect(decision.action.expenses[0]).toMatchObject({
      id: 'bac-512345678901',
      amount: 12500,
      description: 'AUTOMERCADO TRES RIOS',
      categoryId: 'cat-1',
      date: '2026-10-12',
      paymentMethod: 'card',
    })
  })

  it('importa una carpeta con varios bancos y comercios y cuenta por origen (ADR-014)', () => {
    const files = [
      { name: 'bac.eml', content: bacEml() },
      { name: 'bcr.eml', content: bcrEmail },
      { name: 'bn.eml', content: bnSinpeEmail },
      { name: 'uber.eml', content: merchantReceipt },
      { name: 'promo.eml', content: promoEmail },
    ]
    const { decision, report } = importBankEmails(base, files, new EmailNotificationReader(), services)
    expect(report).toMatchObject({ read: 5, imported: 4, bySource: { BAC: 1, BCR: 1, BN: 1, uber: 1 } })
    expect(report.skipped.map((s) => s.file)).toEqual(['promo.eml'])
    if (!decision.ok || decision.action.type !== 'expense/import') throw new Error('esperaba expense/import')
    expect(decision.action.expenses.find((e) => e.id.startsWith('bn-'))?.paymentMethod).toBe('sinpe')
  })

  it('no duplica al reimportar la misma carpeta', () => {
    const first = importBankEmails(base, [{ name: 'a.eml', content: bacEml() }], reader, services)
    if (!first.decision.ok) throw new Error()
    const state = storeReducer(base, first.decision.action)
    const again = importBankEmails(state, [{ name: 'a.eml', content: bacEml() }, { name: 'copia.eml', content: bacEml() }], reader, services)
    expect(again.report).toMatchObject({ imported: 0, duplicates: 2 })
  })

  it('convierte dólares solo con tipo de cambio', () => {
    const files = [{ name: 'b.html', content: bacSavedHtml }]
    expect(importBankEmails(base, files, reader, services).report.skipped[0].reason).toMatch(/sin tipo de cambio/)
    const withRate = importBankEmails(base, files, reader, services, { usdRate: 510 })
    if (!withRate.decision.ok || withRate.decision.action.type !== 'expense/import') throw new Error()
    expect(withRate.decision.action.expenses[0]).toMatchObject({ amount: 4845, description: 'UBER *TRIP (USD 9.5)', categoryId: 'cat-2' })
  })

  it('omite devoluciones y correos que no son notificaciones, con el motivo', () => {
    const files = [
      { name: 'devolucion.eml', content: bacEml({ kind: 'DEVOLUCION', reference: '1' }) },
      { name: 'newsletter.eml', content: unrelatedEmail },
    ]
    const { report } = importBankEmails(base, files, reader, services)
    expect(report.imported).toBe(0)
    expect(report.skipped.map((s) => s.file)).toEqual(['devolucion.eml', 'newsletter.eml'])
  })

  it('usa el lector inyectado (puerto), no un banco fijo', () => {
    const tx: BankTransaction = { bank: 'X', reference: 'r1', date: '2026-10-01', amount: 100, currency: 'CRC', merchant: 'Comercio', kind: 'COMPRA' }
    const fake: BankNotificationReader = { read: () => tx }
    const { report } = importBankEmails(base, [{ name: 'z', content: '' }], fake, services)
    expect(report.imported).toBe(1)
  })
})
