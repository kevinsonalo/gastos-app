import type { Category, Expense } from '../domain'

export const cats: Category[] = [
  { id: 'food', name: 'Alimentación', color: '#ff0000', createdAt: '' },
  { id: 'car', name: 'Transporte', color: '#00ff00', createdAt: '' },
  { id: 'fun', name: 'Ocio', color: '#0000ff', createdAt: '' },
]

let seq = 0
export function exp(partial: Partial<Expense>): Expense {
  seq++
  return {
    id: `e${seq}`,
    amount: 1000,
    description: `Gasto ${seq}`,
    categoryId: 'food',
    date: '2026-09-10',
    paymentMethod: 'card',
    createdAt: `2026-09-10T00:00:${String(seq).padStart(2, '0')}Z`,
    updatedAt: '',
    ...partial,
  }
}
