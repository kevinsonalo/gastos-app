import { roundMoney } from '../domain/format'
import type { Category, CategoryInput, Expense, ExpenseInput } from '../domain/types'

export interface StoreState {
  expenses: Expense[]
  categories: Category[]
}

export type StoreAction =
  | { type: 'expense/add'; id: string; now: string; input: ExpenseInput }
  | { type: 'expense/update'; id: string; now: string; input: ExpenseInput }
  | { type: 'expense/delete'; id: string }
  | { type: 'category/add'; id: string; now: string; input: CategoryInput }
  | { type: 'category/update'; id: string; input: CategoryInput }
  | { type: 'category/delete'; id: string }
  | { type: 'store/replace'; state: StoreState }

const normalizeExpense = (input: ExpenseInput): ExpenseInput => ({
  ...input,
  amount: roundMoney(input.amount),
  description: input.description.trim(),
})

const normalizeCategory = (input: CategoryInput): CategoryInput => ({
  name: input.name.trim(),
  color: input.color.toLowerCase(),
})

/** Reducer puro (ADR-003). La validación ocurre antes de despachar. */
export function expenseReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'expense/add':
      return {
        ...state,
        expenses: [
          ...state.expenses,
          { id: action.id, ...normalizeExpense(action.input), createdAt: action.now, updatedAt: action.now },
        ],
      }
    case 'expense/update':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, ...normalizeExpense(action.input), updatedAt: action.now } : e,
        ),
      }
    case 'expense/delete':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'category/add':
      return {
        ...state,
        categories: [
          ...state.categories,
          { id: action.id, ...normalizeCategory(action.input), createdAt: action.now },
        ],
      }
    case 'category/update':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.id ? { ...c, ...normalizeCategory(action.input) } : c,
        ),
      }
    case 'category/delete':
      // ADR-008: no eliminar categorías en uso.
      if (state.expenses.some((e) => e.categoryId === action.id)) return state
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) }
    case 'store/replace':
      return action.state
  }
}

export function categoryInUse(state: StoreState, categoryId: string): number {
  return state.expenses.filter((e) => e.categoryId === categoryId).length
}
