/** Métodos de pago válidos. Las etiquetas visibles viven en `presentation/labels.ts`. */
export const PAYMENT_METHODS = ['card', 'cash', 'sinpe', 'transfer'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'card'

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
