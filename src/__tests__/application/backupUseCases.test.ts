import { describe, expect, it } from 'vitest'
import { exportBackup, importBackup, parseBackup } from '../../application'
import { fakeServices } from '../fakes'
import { cats, exp } from '../fixtures'

describe('parseBackup', () => {
  it('acepta un respaldo válido', () => {
    const json = JSON.stringify({ version: 1, categories: cats, expenses: [exp({})] })
    expect(parseBackup(json).ok).toBe(true)
  })

  it('rechaza JSON inválido', () => {
    expect(parseBackup('nope').ok).toBe(false)
  })

  it('rechaza gastos con categorías inexistentes', () => {
    const json = JSON.stringify({ categories: cats, expenses: [exp({ categoryId: 'ghost' })] })
    expect(parseBackup(json)).toMatchObject({ ok: false })
  })
})

describe('exportBackup / importBackup', () => {
  it('un respaldo exportado se puede volver a importar', () => {
    const state = { categories: cats, expenses: [exp({})] }
    const json = exportBackup(state, fakeServices('T').clock)
    expect(JSON.parse(json)).toMatchObject({ version: 1, exportedAt: 'T' })
    expect(importBackup(json)).toEqual({ ok: true, action: { type: 'store/replace', state } })
  })

  it('reporta el error bajo la clave file', () => {
    expect(importBackup('nope')).toEqual({ ok: false, errors: { file: expect.any(String) } })
  })
})
