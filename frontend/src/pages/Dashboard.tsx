import { useState, useMemo, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useAddModal } from '../context/AddModalContext'
import { useGetExpensesQuery } from '../store/api'
import {
  filterByPeriod,
  total,
  byCategory,
  byDay,
  byMonth,
  type Period,
} from '../lib/aggregate'
import { formatAmount, CURRENCY_SYMBOL } from '../lib/currency'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { PageTitle } from '../components/PageTitle'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
]

const CHART_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#6366f1',
]

const PIE_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#6366f1',
]

function BarChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length || label == null) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-amber-400">
        {formatAmount(value)}
      </p>
      <p className="text-xs text-zinc-500 mt-0.5">Spent</p>
    </div>
  )
}

export function Dashboard() {
  const { openAddModal } = useAddModal()
  const { data: expenses = [], isLoading, isError } = useGetExpensesQuery()
  const [period, setPeriod] = useState<Period>('month')

  const weekExpenses = filterByPeriod(expenses, 'week')
  const monthExpenses = filterByPeriod(expenses, 'month')
  const yearExpenses = filterByPeriod(expenses, 'year')
  const weekTotal = total(weekExpenses)
  const monthTotal = total(monthExpenses)
  const yearTotal = total(yearExpenses)

  const filtered = useMemo(
    () => filterByPeriod(expenses, period),
    [expenses, period]
  )
  const categoryData = useMemo(() => byCategory(filtered), [filtered])

  const barData = useMemo(() => {
    if (period === 'week' || period === 'month') {
      return byDay(filtered).map((d) => ({
        label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        total: d.total,
      }))
    }
    return byMonth(filtered).map((d) => ({
      label: new Date(d.month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      total: d.total,
    }))
  }, [filtered, period])

  const cardsRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const pieRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        }
      )
    }
  }, [])

  useEffect(() => {
    if (chartRef.current) {
      gsap.fromTo(
        chartRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [period])

  useEffect(() => {
    if (pieRef.current) {
      gsap.fromTo(
        pieRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' }
      )
    }
  }, [period])

  useEffect(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.children,
        { opacity: 0, x: -8 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: 'power2.out',
        }
      )
    }
  }, [categoryData])

  return (
    <div>
      <PageTitle
        title="Dashboard"
        subtitle="Overview of your spending"
      />
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading && (
          <Card className="p-5 col-span-3 text-sm text-zinc-400">
            Loading expenses...
          </Card>
        )}
        {isError && !isLoading && (
          <Card className="p-5 col-span-3 text-sm text-red-400">
            Failed to load expenses.
          </Card>
        )}
        <Card className="p-5 border-amber-500/20 bg-gradient-to-br from-zinc-900 to-zinc-900/80">
          <p className="text-zinc-500 text-sm font-medium mb-1">This week</p>
          <p className="text-2xl font-bold text-amber-400">
            {formatAmount(weekTotal)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-zinc-500 text-sm font-medium mb-1">This month</p>
          <p className="text-2xl font-bold text-zinc-100">
            {formatAmount(monthTotal)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-zinc-500 text-sm font-medium mb-1">This year</p>
          <p className="text-2xl font-bold text-zinc-100">
            {formatAmount(yearTotal)}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              period === p.value
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-5" ref={chartRef}>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            Spending over time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${CURRENCY_SYMBOL}${v}`}
                />
                <Tooltip
                  content={<BarChartTooltip />}
                  cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5" ref={pieRef}>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            By category
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '12px',
                  }}
                  formatter={(value, name, props) => [
                    `${formatAmount(Number(value))} (${(props?.payload as { percentage?: number })?.percentage?.toFixed(1) ?? 0}%)`,
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 mb-8" ref={tableRef}>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Category breakdown
        </h2>
        <div className="space-y-2">
          {categoryData.length === 0 ? (
            <p className="text-zinc-500 text-sm">No expenses in this period.</p>
          ) : (
            categoryData.map((row, i) => (
              <div
                key={row.category}
                className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-zinc-200">{row.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400 text-sm">
                    {row.percentage.toFixed(1)}%
                  </span>
                  <span className="font-medium text-zinc-100">
                    {formatAmount(row.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="flex justify-center sm:justify-start">
        <Button size="lg" className="gap-2" onClick={openAddModal}>
          <span aria-hidden>+</span>
          Add expense
        </Button>
      </div>
    </div>
  )
}
