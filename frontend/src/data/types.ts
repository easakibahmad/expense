export type Category =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Shopping'
  | 'Health'
  | 'Entertainment'
  | 'Other'

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  category: Category
  note?: string
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]
