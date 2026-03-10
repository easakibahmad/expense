// Matches frontend Expense type
export const CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  category: Category
  note?: string
}

export interface CreateExpenseBody {
  date: string
  amount: number
  category: string
  note?: string
}

export interface UpdateExpenseBody {
  date?: string
  amount?: number
  category?: string
  note?: string
}

export interface ExpenseRow {
  id: string
  date: Date
  amount: string
  category: string
  note: string | null
  created_at: Date
}

export function rowToExpense(row: ExpenseRow): Expense {
  const date =
    typeof row.date === 'string' ? row.date.slice(0, 10) : row.date.toISOString().slice(0, 10)
  return {
    id: row.id,
    date,
    amount: parseFloat(row.amount),
    category: row.category as Category,
    note: row.note ?? undefined,
  }
}
