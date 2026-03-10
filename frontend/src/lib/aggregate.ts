import type { Expense } from '../data/types'
import type { Category } from '../data/types'
import { isInRange, getWeekRange, getMonthRange, getYearRange } from './dates'

export type Period = 'week' | 'month' | 'year'

export function filterByPeriod(
  expenses: Expense[],
  period: Period,
  refDate: Date = new Date()
): Expense[] {
  let from: Date
  let to: Date
  if (period === 'week') {
    const r = getWeekRange(refDate)
    from = r.from
    to = r.to
  } else if (period === 'month') {
    const r = getMonthRange(refDate)
    from = r.from
    to = r.to
  } else {
    const r = getYearRange(refDate)
    from = r.from
    to = r.to
  }
  return expenses.filter((e) => isInRange(e.date, from, to))
}

export function total(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export interface CategorySummary {
  category: Category
  total: number
  percentage: number
}

export function byCategory(expenses: Expense[]): CategorySummary[] {
  const byCat = new Map<Category, number>()
  const sum = total(expenses)
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)
  }
  return Array.from(byCat.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: sum > 0 ? (total / sum) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export interface DaySummary {
  date: string
  total: number
}

export function byDay(expenses: Expense[]): DaySummary[] {
  const byDate = new Map<string, number>()
  for (const e of expenses) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount)
  }
  return Array.from(byDate.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function byMonth(expenses: Expense[]): { month: string; total: number }[] {
  const byMonth = new Map<string, number>()
  for (const e of expenses) {
    const month = e.date.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + e.amount)
  }
  return Array.from(byMonth.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
