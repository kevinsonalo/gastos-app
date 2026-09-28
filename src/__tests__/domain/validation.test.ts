import { describe, expect, it } from 'vitest'
import type { ExpenseInput } from '../domain/types'
import { hasErrors, validateCategory, validateExpense } from '../domain/validation'
import { cats } from './fixtures'

const valid: ExpenseInput = {
  amount: 2500,
  description: 'Almuerzo',
  categoryId: 'food',
  date: '2026-09-27',
  paymentMethod: 'sinpe',
}

describe('validateExpense', () => {
  it('acepta un gasto válido', () => {
    expect(hasErrors(validateExpense(valid, cats))).toBe(false)
  })

  it.each([0, -5, NaN, Infinity])('rechaza monto %s', (amount) => {
    expect(validateExpense({ ...valid, amount }, cats).amount).toBeDefined()
  })

  it('rechaza descripción vacía o solo espacios', () => {
    expect(validateExpense({ ...valid, description: '   ' }, cats).description).toBeDefined()
  })

  it('rechaza descripción de más de 120 caracteres', () => {
    expect(validateExpense({ ...valid, description: 'x'.repeat(121) }, cats).description).toBeDefined()
  })

  it('rechaza categoría inexistente', () => {
    expect(validateExpense({ ...valid, categoryId: 'nope' }, cats).categoryId).toBeDefined()
  })

  it.each(['2026-02-30', '27/09/2026', '', '2026-13-01'])('rechaza fecha inválida %s', (date) => {
    expect(validateExpense({ ...valid, date }, cats).date).toBeDefined()
  })

  it('acepta 29 de febrero en año bisiesto', () => {
    expect(validateExpense({ ...valid, date: '2028-02-29' }, cats).date).toBeUndefined()
  })
})

describe('validateCategory', () => {
  it('rechaza nombre duplicado sin importar mayúsculas', () => {
    expect(validateCategory({ name: ' transporte ', color: '#123456' }, cats).name).toBeDefined()
  })

  it('permite conservar el mismo nombre al editar', () => {
    expect(validateCategory({ name: 'Transporte', color: '#123456' }, cats, 'car').name).toBeUndefined()
  })

  it('rechaza color no hexadecimal', () => {
    expect(validateCategory({ name: 'Nueva', color: 'red' }, cats).color).toBeDefined()
  })
})
