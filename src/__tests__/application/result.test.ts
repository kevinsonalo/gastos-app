import { describe, expect, it } from 'vitest'
import { fail } from '../../application'

describe('fail', () => {
  it('descarta campos sin mensaje', () => {
    expect(fail({ amount: 'Requerido', date: undefined })).toEqual({ ok: false, errors: { amount: 'Requerido' } })
  })
})
