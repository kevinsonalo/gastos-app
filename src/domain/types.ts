export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'sinpe'

export const PAYMENT_METHODS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'sinpe', label: 'SINPE Móvil' },
  { value: 'transfer', label: 'Transferencia' },
]

export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  categoryId: string
  /** Fecha local en formato YYYY-MM-DD (ver ADR-005). */
  date: string
  paymentMethod: PaymentMethod
  createdAt: string
  updatedAt: string
}

export type ExpenseInput = Pick<Expense, 'amount' | 'description' | 'categoryId' | 'date' | 'paymentMethod'>
export type CategoryInput = Pick<Category, 'name' | 'color'>

export interface ExpenseFilters {
  /** YYYY-MM o '' para todos los meses */
  month: string
  categoryId: string
  search: string
}

export type ValidationErrors<T> = Partial<Record<keyof T, string>>
