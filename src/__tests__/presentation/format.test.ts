import { describe, expect, it } from 'vitest'
import { monthLabel } from '../../presentation/format'

describe('monthLabel', () => {
  it('capitaliza solo la primera letra del mes largo', () => {
    expect(monthLabel('2026-09', true)).toMatch(/^Septiembre/)
    expect(monthLabel('2026-09')).toBe('Sep 26')
  })
})
