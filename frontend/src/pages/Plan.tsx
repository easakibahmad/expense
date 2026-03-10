import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { PageTitle } from '../components/PageTitle'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { PlanItemModal } from '../components/PlanItemModal'
import { formatAmount } from '../lib/currency'
import { Spinner } from '../components/Spinner'
import {
  useGetPlanMonthsQuery,
  useGetPlanQuery,
  useSavePlanMutation,
  type PlannedExpenseItem,
} from '../store/api'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50'

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function yearMonthToLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Previous calendar month, e.g. 2026-04 -> 2026-03, 2026-01 -> 2025-12 */
function previousYearMonth(ym: string): string | null {
  const [y, m] = ym.split('-').map(Number)
  if (m < 1 || m > 12) return null
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

/** Next calendar month, e.g. 2026-03 -> 2026-04, 2026-12 -> 2027-01 */
function nextYearMonth(ym: string): string | null {
  const [y, m] = ym.split('-').map(Number)
  if (m < 1 || m > 12) return null
  if (m === 12) return `${y + 1}-01`
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

export function Plan() {
  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth)
  const [localItems, setLocalItems] = useState<PlannedExpenseItem[]>([])
  const [localIncome, setLocalIncome] = useState<string>('')
  const [planItemModal, setPlanItemModal] = useState<'add' | 'edit' | null>(null)
  const [editingItem, setEditingItem] = useState<PlannedExpenseItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<PlannedExpenseItem | null>(null)

  const { data: planMonthsData } = useGetPlanMonthsQuery()
  const planMonths = Array.isArray(planMonthsData) ? planMonthsData : []

  const { data, isLoading, isError, error, isFetching } = useGetPlanQuery(selectedYearMonth, {
    skip: !selectedYearMonth,
  })
  const [savePlan, { isLoading: isSaving }] = useSavePlanMutation()

  const is404 = (error as { status?: number })?.status === 404
  const prevYearMonth = previousYearMonth(selectedYearMonth)
  const { data: previousMonthData } = useGetPlanQuery(prevYearMonth ?? '', {
    skip: !is404 || !prevYearMonth,
  })

  useEffect(() => {
    if (is404) {
      if (previousMonthData) {
        setLocalItems(previousMonthData.items)
        setLocalIncome(
          previousMonthData.monthlyIncome != null ? String(previousMonthData.monthlyIncome) : ''
        )
      } else {
        setLocalItems([])
        setLocalIncome('')
      }
    } else if (data) {
      setLocalItems(data.items)
      setLocalIncome(data.monthlyIncome != null ? String(data.monthlyIncome) : '')
    }
  }, [selectedYearMonth, is404, data, previousMonthData])

  const monthOptions = useMemo(() => {
    const set = new Set(planMonths)
    set.add(currentYearMonth())
    const next = nextYearMonth(currentYearMonth())
    if (next) set.add(next)
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [planMonths])

  const monthlyIncomeNum = localIncome.trim() === '' ? null : parseFloat(localIncome)
  const totalPlanned = localItems.reduce((sum, i) => sum + i.amount, 0)
  const remainder = monthlyIncomeNum != null ? monthlyIncomeNum - totalPlanned : null
  const selectedMonthLabel = yearMonthToLabel(selectedYearMonth)

  const openAddModal = () => {
    setEditingItem(null)
    setPlanItemModal('add')
  }

  const openEditModal = (item: PlannedExpenseItem) => {
    setEditingItem(item)
    setPlanItemModal('edit')
  }

  const closePlanItemModal = () => {
    setPlanItemModal(null)
    setEditingItem(null)
  }

  const handlePlanItemSave = async (label: string, amount: number) => {
    if (planItemModal === 'add') {
      setLocalItems((prev) => [...prev, { id: `new-${Date.now()}`, label, amount }])
    } else if (planItemModal === 'edit' && editingItem) {
      setLocalItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, label, amount } : i))
      )
    }
    closePlanItemModal()
  }

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return
    setLocalItems((prev) => prev.filter((i) => i.id !== itemToDelete.id))
    setItemToDelete(null)
  }

  const handleSavePlan = async () => {
    const income = localIncome.trim() === '' ? null : parseFloat(localIncome)
    if (income !== null && (Number.isNaN(income) || income < 0)) return
    try {
      await savePlan({
        yearMonth: selectedYearMonth,
        body: {
          monthlyIncome: income ?? null,
          items: localItems.map((i) => ({ label: i.label, amount: i.amount })),
        },
      }).unwrap()
    } catch {
      // Error handled by mutation
    }
  }

  if (isError && !is404) {
    return (
      <div>
        <PageTitle title="Monthly plan" subtitle="Planned expenses and income" />
        <Card className="p-8 text-red-400">Failed to load plan.</Card>
      </div>
    )
  }

  return (
    <div>
      <PageTitle
        title="Monthly plan"
        subtitle={
          <>
            Viewing and editing{' '}
            <span className="font-semibold text-amber-400">{selectedMonthLabel}</span> — click Save
            to store this month&apos;s plan
          </>
        }
      />

      <div className="space-y-6 mb-8">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Select month</h2>
          <p className="text-sm text-zinc-500 mb-3">
            Select a month to view or edit. Click Save to store the plan for that month.
          </p>
          <select
            value={selectedYearMonth}
            onChange={(e) => setSelectedYearMonth(e.target.value)}
            className={`${inputClass} max-w-xs`}
            id="plan-month-select"
          >
            {monthOptions.map((ym) => (
              <option key={ym} value={ym}>
                {yearMonthToLabel(ym)}
              </option>
            ))}
          </select>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-3">Monthly income</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Not set"
              value={localIncome}
              onChange={(e) => setLocalIncome(e.target.value)}
              className={`${inputClass} max-w-[200px]`}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            Planned expenses for {selectedMonthLabel}
          </h2>
          {is404 && previousMonthData ? (
            <p className="text-amber-400/90 text-sm mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              No plan saved yet for this month. Shown from {yearMonthToLabel(prevYearMonth!)} as a
              starting point — edit items and click Save to create this month&apos;s plan.
            </p>
          ) : null}
          {isLoading && !data && !is404 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <span className="text-sm text-zinc-500">Loading plan</span>
            </div>
          ) : null}
          <ul className="space-y-2 mb-6">
            {localItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 py-2 border-b border-zinc-800/60 last:border-0"
              >
                <span className="text-zinc-200 flex-1 min-w-0">{item.label}</span>
                <span className="font-medium text-zinc-100 tabular-nums">
                  {formatAmount(item.amount)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(item)}
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setItemToDelete(item)}
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 items-center">
            <Button type="button" size="md" onClick={openAddModal} className="gap-1.5">
              <Plus size={18} /> Add item
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSavePlan}
              disabled={isSaving || isFetching}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" className="shrink-0" />
                  Saving
                </>
              ) : (
                'Save plan'
              )}
            </Button>
          </div>

          {planItemModal !== null && (
            <PlanItemModal
              mode={planItemModal}
              item={editingItem}
              onClose={closePlanItemModal}
              onSave={handlePlanItemSave}
              isLoading={false}
            />
          )}

          {itemToDelete !== null && (
            <DeletePlanItemConfirmModal
              item={itemToDelete}
              onClose={() => setItemToDelete(null)}
              onConfirm={handleDeleteConfirm}
              isLoading={false}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Distribution</h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Total planned
              </p>
              <p className="text-xl font-bold text-amber-400">{formatAmount(totalPlanned)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Monthly income
              </p>
              <p className="text-xl font-bold text-zinc-100">
                {monthlyIncomeNum != null ? formatAmount(monthlyIncomeNum) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Remainder
              </p>
              <p className="text-xl font-bold text-zinc-100">
                {remainder != null ? formatAmount(remainder) : '—'}
              </p>
            </div>
          </div>
          {monthlyIncomeNum != null && monthlyIncomeNum > 0 && localItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-400 mb-2">Share of income</p>
              {localItems.map((item) => {
                const pct = (item.amount / monthlyIncomeNum) * 100
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-zinc-300 truncate">{item.label}</span>
                        <span className="text-zinc-500 tabular-nums">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500/80 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

interface DeletePlanItemConfirmModalProps {
  item: PlannedExpenseItem
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeletePlanItemConfirmModal({
  item,
  onClose,
  onConfirm,
  isLoading,
}: DeletePlanItemConfirmModalProps) {
  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-plan-item-title"
      aria-describedby="delete-plan-item-desc"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-plan-item-title" className="text-lg font-semibold text-zinc-100 mb-2">
          Permanently delete planned item?
        </h2>
        <p id="delete-plan-item-desc" className="text-zinc-400 text-sm mb-4">
          {item.label} · {formatAmount(item.amount)}
        </p>
        <p className="text-zinc-500 text-sm mb-6">
          This will permanently remove this item from your monthly plan. You can&apos;t undo this.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="shrink-0" />
                Deleting
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
  return createPortal(modal, document.body)
}
