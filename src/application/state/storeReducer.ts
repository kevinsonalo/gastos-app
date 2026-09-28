import { countExpensesInCategory, type Category, type Expense } from '../../domain'

export interface StoreState {
  expenses: Expense[]
  categories: Category[]
}

/** Las acciones llevan entidades ya validadas y normalizadas por los casos de uso. */
export type StoreAction =
  | { type: 'expense/add'; expense: Expense }
  | { type: 'expense/update'; expense: Expense }
  | { type: 'expense/delete'; id: string }
  | { type: 'category/add'; category: Category }
  | { type: 'category/update'; category: Category }
  | { type: 'category/delete'; id: string }
  | { type: 'store/replace'; state: StoreState }

const replaceById = <T extends { id: string }>(items: T[], item: T): T[] =>
  items.map((current) => (current.id === item.id ? item : current))

/** Reducer puro (ADR-003): solo aplica cambios, no valida ni genera ids/fechas. */
export function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'expense/add':
      return { ...state, expenses: [...state.expenses, action.expense] }
    case 'expense/update':
      return { ...state, expenses: replaceById(state.expenses, action.expense) }
    case 'expense/delete':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] }
    case 'category/update':
      return { ...state, categories: replaceById(state.categories, action.category) }
    case 'category/delete':
      // Defensa en profundidad de ADR-008 (el caso de uso ya lo valida).
      if (countExpensesInCategory(state.expenses, action.id) > 0) return state
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) }
    case 'store/replace':
      return action.state
  }
}

export const EMPTY_STATE: StoreState = { categories: [], expenses: [] }
