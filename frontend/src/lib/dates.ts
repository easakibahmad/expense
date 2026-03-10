export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - day + (day === 0 ? -6 : 1)
  x.setDate(diff)
  x.setHours(0, 0, 0, 0)
  return x
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

export function startOfYear(d: Date): Date {
  const x = new Date(d)
  x.setMonth(0, 1)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isInRange(dateStr: string, from: Date, to: Date): boolean {
  const d = new Date(dateStr)
  return d >= from && d <= to
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getWeekRange(d: Date): { from: Date; to: Date } {
  const from = startOfWeek(d)
  const to = endOfDay(addDays(from, 6))
  return { from, to }
}

export function getMonthRange(d: Date): { from: Date; to: Date } {
  const from = startOfMonth(d)
  const to = endOfDay(addDays(addMonths(from, 1), -1))
  return { from, to }
}

export function getYearRange(d: Date): { from: Date; to: Date } {
  const from = startOfYear(d)
  const to = endOfDay(addDays(new Date(from.getFullYear(), 11, 31), 0))
  return { from, to }
}
