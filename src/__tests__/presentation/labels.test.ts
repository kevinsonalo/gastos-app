import { describe, expect, it } from 'vitest'
import { PAYMENT_METHODS } from '../../domain'
import { PAYMENT_METHOD_LABELS } from '../../presentation/labels'

describe('PAYMENT_METHOD_LABELS', () => {
  it('tiene una etiqueta para cada método de pago del dominio', () => {
    expect(Object.keys(PAYMENT_METHOD_LABELS).sort()).toEqual([...PAYMENT_METHODS].sort())
  })
})
