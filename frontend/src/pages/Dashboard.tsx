import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAddModal } from '../context/AddModalContext'
import { useGetExpensesQuery, useGetPlanSummariesQuery, useGetPlanQuery } from '../store/api'
import { filterByPeriod, total, byCategory, byDay, byMonth, type Period } from '../lib/aggregate'
import { formatAmount, CURRENCY_SYMBOL } from '../lib/currency'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { PageTitle } from '../components/PageTitle'
import { Spinner } from '../components/Spinner'
import { Plus, ArrowRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Sector,
} from 'recharts'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
]

const CHART_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#6366f1']

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#6366f1']

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
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-amber-400">{formatAmount(value)}</p>
      <p className="text-xs text-zinc-500 mt-0.5">Spent</p>
    </div>
  )
}

export function Dashboard() {
  const { openAddModal } = useAddModal()
  const { data: expenses = [], isLoading, isError } = useGetExpensesQuery()
  const { data: planSummariesData } = useGetPlanSummariesQuery()
  const summaries = planSummariesData?.summaries ?? []
  const [period, setPeriod] = useState<Period>('month')
  const [selectedPlanMonthKey, setSelectedPlanMonthKey] = useState<string | null>(null)

  const planMonths = useMemo(
    () => summaries.map((s) => s.year_month).sort((a, b) => b.localeCompare(a)),
    [summaries]
  )
  const currentYearMonth = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  }, [])
  const effectivePlanMonthKey =
    selectedPlanMonthKey ??
    (planMonths.includes(currentYearMonth) ? currentYearMonth : (planMonths[0] ?? null))
  const { data: planForMonth } = useGetPlanQuery(effectivePlanMonthKey ?? '', {
    skip: !effectivePlanMonthKey,
  })
  const planTotal = planForMonth?.items?.reduce((sum, i) => sum + i.amount, 0) ?? 0
  const planIncome = planForMonth?.monthlyIncome ?? null

  const weekExpenses = filterByPeriod(expenses, 'week')
  const monthExpenses = filterByPeriod(expenses, 'month')
  const yearExpenses = filterByPeriod(expenses, 'year')
  const weekTotal = total(weekExpenses)
  const monthTotal = total(monthExpenses)
  const yearTotal = total(yearExpenses)

  const filtered = useMemo(() => filterByPeriod(expenses, period), [expenses, period])
  const categoryData = useMemo(() => byCategory(filtered), [filtered])

  const barData = useMemo(() => {
    const raw =
      period === 'week' || period === 'month'
        ? byDay(filtered).map((d) => ({
            label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            total: d.total,
          }))
        : byMonth(filtered).map((d) => ({
            label: new Date(d.month + '-01').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            }),
            total: d.total,
          }))
    return raw.map((d, i) => ({
      ...d,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [filtered, period])

  const categoryDataWithColors = useMemo(
    () =>
      categoryData.map((d, i) => ({
        ...d,
        fill: PIE_COLORS[i % PIE_COLORS.length],
        stroke: 'none',
      })),
    [categoryData]
  )

  const availablePlanMonths = useMemo(
    () =>
      planMonths.map((monthKey) => {
        const [y, m] = monthKey.split('-')
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
        return {
          monthKey,
          monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        }
      }),
    [planMonths]
  )

  const selectedMonthExpenses = useMemo(() => {
    if (!effectivePlanMonthKey) return []
    return expenses.filter((e) => e.date.slice(0, 7) === effectivePlanMonthKey)
  }, [expenses, effectivePlanMonthKey])

  const selectedMonthActualTotal = total(selectedMonthExpenses)
  const selectedMonthByCategory = useMemo(
    () => byCategory(selectedMonthExpenses),
    [selectedMonthExpenses]
  )
  const selectedMonthLabel = useMemo(() => {
    if (!effectivePlanMonthKey) return ''
    const [y, m] = effectivePlanMonthKey.split('-')
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [effectivePlanMonthKey])
  const selectedMonthRemainder = planIncome != null ? planIncome - selectedMonthActualTotal : null

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="[&_header]:mb-0">
          <PageTitle title="Dashboard" subtitle="Overview of your spending" />
        </div>
        <Button size="md" className="gap-2 shrink-0" onClick={openAddModal}>
          <Plus aria-hidden size={22} strokeWidth={2.5} />
          Add expense
        </Button>
      </div>
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading && (
          <Card className="p-8 col-span-3 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm text-zinc-500">Loading expenses</span>
          </Card>
        )}
        {isError && !isLoading && (
          <Card className="p-5 col-span-3 text-sm text-red-400">Failed to load expenses.</Card>
        )}
        <Card className="p-5 border-amber-500/20 bg-gradient-to-br from-zinc-900 to-zinc-900/80">
          <p className="text-zinc-500 text-sm font-medium mb-1">This week</p>
          <p className="text-2xl font-bold text-amber-400">{formatAmount(weekTotal)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-zinc-500 text-sm font-medium mb-1">This month</p>
          <p className="text-2xl font-bold text-zinc-100">{formatAmount(monthTotal)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-zinc-500 text-sm font-medium mb-1">This year</p>
          <p className="text-2xl font-bold text-zinc-100">{formatAmount(yearTotal)}</p>
        </Card>
      </div>

      <Link to="/plan" className="block mb-8">
        <Card className="p-5 border-zinc-700/80 hover:border-amber-500/30 transition-colors">
          <p className="text-zinc-500 text-sm font-medium mb-1">Monthly plan</p>
          <p className="text-zinc-200 text-base">
            {summaries.length > 0
              ? `Plans saved for ${summaries.length} month${summaries.length === 1 ? '' : 's'} — view and edit per month`
              : 'Save a plan for each month (income and planned items) to compare with actual spending.'}
          </p>
          <p className="text-amber-400/90 text-sm mt-1 inline-flex items-center gap-1.5 uppercase">
            <span>View and edit plan</span>
            <ArrowRight size={14} aria-hidden className="shrink-0 inline-block align-middle" />
          </p>
        </Card>
      </Link>

      {planMonths.length > 0 && (
        <Card className="p-5 mb-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Monthly plan summary</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Select a month to see that month&apos;s saved plan and actual spending (from expenses).
            Only months with a saved plan are listed.
          </p>

          <div className="mb-6">
            <label
              htmlFor="plan-month-filter"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Month
            </label>
            <select
              id="plan-month-filter"
              value={effectivePlanMonthKey ?? ''}
              onChange={(e) => setSelectedPlanMonthKey(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {availablePlanMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthLabel}
                </option>
              ))}
            </select>
          </div>

          {planForMonth && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="rounded-xl bg-zinc-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    Planned
                  </p>
                  <p className="text-lg font-bold text-amber-400">{formatAmount(planTotal)}</p>
                </div>
                <div className="rounded-xl bg-zinc-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    Income
                  </p>
                  <p className="text-lg font-bold text-zinc-100">
                    {planIncome != null ? formatAmount(planIncome) : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    Actual spent
                  </p>
                  <p className="text-lg font-bold text-zinc-100">
                    {formatAmount(selectedMonthActualTotal)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedMonthLabel} (from expense dates)
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    Remainder
                  </p>
                  <p className="text-lg font-bold">
                    {selectedMonthRemainder != null ? (
                      <span
                        className={
                          selectedMonthRemainder >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }
                      >
                        {formatAmount(selectedMonthRemainder)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                    Planned distribution ({selectedMonthLabel})
                  </h3>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-800/80 text-zinc-400">
                          <th className="py-2.5 px-3 text-left font-medium">Item</th>
                          <th className="py-2.5 px-3 text-right font-medium">Amount</th>
                          {planIncome != null && planIncome > 0 && (
                            <th className="py-2.5 px-3 text-right font-medium">% of income</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {planForMonth.items.map((item) => (
                          <tr key={item.id} className="border-t border-zinc-800/60">
                            <td className="py-2.5 px-3 text-zinc-200">{item.label}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-zinc-100">
                              {formatAmount(item.amount)}
                            </td>
                            {planIncome != null && planIncome > 0 && (
                              <td className="py-2.5 px-3 text-right tabular-nums text-zinc-500">
                                {((item.amount / planIncome) * 100).toFixed(1)}%
                              </td>
                            )}
                          </tr>
                        ))}
                        <tr className="border-t border-zinc-700 bg-zinc-800/30">
                          <td className="py-2.5 px-3 font-medium text-zinc-200">Total planned</td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-medium text-amber-400">
                            {formatAmount(planTotal)}
                          </td>
                          {planIncome != null && planIncome > 0 && (
                            <td className="py-2.5 px-3 text-right tabular-nums text-zinc-500">
                              {((planTotal / planIncome) * 100).toFixed(1)}%
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                    Actual spending by category ({selectedMonthLabel})
                  </h3>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    {selectedMonthByCategory.length === 0 ? (
                      <div className="py-6 px-4 text-center text-zinc-500 text-sm">
                        No expenses in this month
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-800/80 text-zinc-400">
                            <th className="py-2.5 px-3 text-left font-medium">Category</th>
                            <th className="py-2.5 px-3 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMonthByCategory.map((row) => (
                            <tr key={row.category} className="border-t border-zinc-800/60">
                              <td className="py-2.5 px-3 text-zinc-200">{row.category}</td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-zinc-100">
                                {formatAmount(row.total)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-zinc-700 bg-zinc-800/30">
                            <td className="py-2.5 px-3 font-medium text-zinc-200">Total spent</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-medium text-zinc-100">
                              {formatAmount(selectedMonthActualTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

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
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Spending over time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
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
                <Bar dataKey="total" radius={[6, 6, 0, 0]} activeBar={{ stroke: 'none' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5" ref={pieRef}>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">By category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDataWithColors}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                  labelLine={false}
                  activeShape={(props) => <Sector {...props} stroke="none" />}
                  rootTabIndex={-1}
                />
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
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 mb-8" ref={tableRef}>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Category breakdown</h2>
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
                  <span className="text-zinc-400 text-sm">{row.percentage.toFixed(1)}%</span>
                  <span className="font-medium text-zinc-100">{formatAmount(row.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
