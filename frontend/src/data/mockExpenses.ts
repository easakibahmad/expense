import type { Expense, Category } from './types'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function id(): string {
  return crypto.randomUUID().slice(0, 8)
}

const categories: Category[] = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]

const notes: Record<string, string[]> = {
  Food: ['Lunch', 'Groceries', 'Coffee', 'Restaurant', 'Snacks'],
  Transport: ['Uber', 'Gas', 'Parking', 'Bus pass', 'Train'],
  Bills: ['Rent', 'Electricity', 'Internet', 'Phone', 'Insurance'],
  Shopping: ['Clothes', 'Electronics', 'Household', 'Gifts'],
  Health: ['Pharmacy', 'Gym', 'Doctor', 'Supplements'],
  Entertainment: ['Netflix', 'Concert', 'Games', 'Books'],
  Other: ['Misc', 'Donation', 'Repairs'],
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateExpenses(): Expense[] {
  const expenses: Expense[] = []
  const start = addDays(new Date(), -28)
  for (let i = 0; i < 28; i++) {
    const date = addDays(start, i)
    const count = Math.floor(Math.random() * 4) + 1
    for (let j = 0; j < count; j++) {
      const category = randomItem(categories)
      const amount = Math.round((Math.random() * 120 + 5) * 100) / 100
      expenses.push({
        id: id(),
        date: formatDate(date),
        amount,
        category,
        note: randomItem(notes[category]),
      })
    }
  }
  return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const MOCK_EXPENSES: Expense[] = generateExpenses()
