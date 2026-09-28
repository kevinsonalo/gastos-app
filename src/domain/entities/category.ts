export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
}

export type CategoryInput = Pick<Category, 'name' | 'color'>
