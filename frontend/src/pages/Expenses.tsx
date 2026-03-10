import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAddModal } from '../context/AddModalContext'
import { gsap } from 'gsap'
import { formatDisplayDate, startOfWeek } from '../lib/dates'
import { formatAmount, CURRENCY_SYMBOL } from '../lib/currency'
import type { Category, Expense } from '../data/types'
import { CATEGORIES } from '../data/types'
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { PageTitle } from '../components/PageTitle'
import { Spinner } from '../components/Spinner'
import {
  useGetExpensesQuery,
  useGetTrashQuery,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useBulkDeleteExpensesMutation,
  useRestoreExpenseMutation,
  useBulkRestoreExpensesMutation,
  usePermanentDeleteExpenseMutation,
  useBulkPermanentDeleteExpensesMutation,
  useEmptyTrashMutation,
} from '../store/api'

export function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchNote, setSearchNote] = useState('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'expenses' | 'trash'>('expenses')
  const [trashSelectedIds, setTrashSelectedIds] = useState<Set<string>>(new Set())
  const [permanentDeleteSingle, setPermanentDeleteSingle] = useState<Expense | null>(null)
  const [showBulkPermanentConfirm, setShowBulkPermanentConfirm] = useState(false)
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const trashSelectAllRef = useRef<HTMLInputElement>(null)

  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()
  const [bulkDeleteExpenses, { isLoading: isBulkDeleting }] = useBulkDeleteExpensesMutation()
  const [restoreExpense, { isLoading: isRestoring }] = useRestoreExpenseMutation()
  const [bulkRestoreExpenses, { isLoading: isBulkRestoring }] = useBulkRestoreExpensesMutation()
  const [permanentDeleteExpense, { isLoading: isPermanentDeleting }] =
    usePermanentDeleteExpenseMutation()
  const [bulkPermanentDeleteExpenses, { isLoading: isBulkPermanentDeleting }] =
    useBulkPermanentDeleteExpensesMutation()
  const [emptyTrash, { isLoading: isEmptyingTrash }] = useEmptyTrashMutation()
  const { openAddModal } = useAddModal()

  const {
    data: expenses = [],
    isLoading,
    isError,
  } = useGetExpensesQuery(
    {
      category: categoryFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: searchNote || undefined,
    },
    { refetchOnMountOrArgChange: true }
  )

  const {
    data: trashList = [],
    isLoading: isTrashLoading,
    isError: isTrashError,
  } = useGetTrashQuery(undefined, { skip: activeTab !== 'trash' })

  const filtered = useMemo(() => [...expenses], [expenses])

  const sortedByDateDesc = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  )

  function weekKey(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    return startOfWeek(d).toISOString().slice(0, 10)
  }

  async function handleConfirmDelete(exp: Expense) {
    try {
      await deleteExpense(exp.id).unwrap()
      setDeletingExpense(null)
    } catch {
      // Error toast or inline message could go here
    }
  }

  const selectedCount = selectedIds.size
  const allIds = useMemo(() => sortedByDateDesc.map((e) => e.id), [sortedByDateDesc])
  const allSelected = allIds.length > 0 && selectedCount === allIds.length

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(allIds))
  }

  async function handleConfirmBulkDelete() {
    if (selectedCount === 0) return
    try {
      await bulkDeleteExpenses(Array.from(selectedIds)).unwrap()
      setSelectedIds(new Set())
      setShowBulkDeleteConfirm(false)
    } catch {
      // Error handling
    }
  }

  const trashSelectedCount = trashSelectedIds.size
  const trashAllIds = useMemo(() => trashList.map((e) => e.id), [trashList])
  const trashAllSelected = trashList.length > 0 && trashSelectedCount === trashList.length

  function toggleTrashSelect(id: string) {
    setTrashSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTrashSelectAll() {
    if (trashAllSelected) setTrashSelectedIds(new Set())
    else setTrashSelectedIds(new Set(trashAllIds))
  }

  async function handleRestore(exp: Expense) {
    try {
      await restoreExpense(exp.id).unwrap()
    } catch {
      // Error handling
    }
  }

  async function handleBulkRestore() {
    if (trashSelectedCount === 0) return
    try {
      await bulkRestoreExpenses(Array.from(trashSelectedIds)).unwrap()
      setTrashSelectedIds(new Set())
    } catch {
      // Error handling
    }
  }

  async function handlePermanentDeleteSingle(exp: Expense) {
    try {
      await permanentDeleteExpense(exp.id).unwrap()
      setPermanentDeleteSingle(null)
    } catch {
      // Error handling
    }
  }

  async function handleBulkPermanentDelete() {
    if (trashSelectedCount === 0) return
    try {
      await bulkPermanentDeleteExpenses(Array.from(trashSelectedIds)).unwrap()
      setTrashSelectedIds(new Set())
      setShowBulkPermanentConfirm(false)
    } catch {
      // Error handling
    }
  }

  async function handleEmptyTrash() {
    try {
      await emptyTrash().unwrap()
      setShowEmptyTrashConfirm(false)
    } catch {
      // Error handling
    }
  }

  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, x: -12 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out',
        }
      )
    }
  }, [filtered])

  useEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = selectedCount > 0 && !allSelected
  }, [selectedCount, allSelected])

  useEffect(() => {
    const el = trashSelectAllRef.current
    if (el) el.indeterminate = trashSelectedCount > 0 && !trashAllSelected
  }, [trashSelectedCount, trashAllSelected])

  return (
    <div>
      <PageTitle title="Expenses" subtitle="Browse and filter your expense history" />

      <div className="flex gap-1 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'expenses'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'trash'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Trash
        </button>
      </div>

      {activeTab === 'trash' ? (
        <>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <p className="text-zinc-500 text-sm">
              {isTrashLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  Loading
                </span>
              ) : (
                `${trashList.length} deleted expense${trashList.length !== 1 ? 's' : ''}`
              )}
            </p>
            {trashList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
                  <input
                    ref={trashSelectAllRef}
                    type="checkbox"
                    checked={trashAllSelected}
                    onChange={toggleTrashSelectAll}
                    className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  Select all
                </label>
                {trashSelectedCount > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleBulkRestore}
                      disabled={isBulkRestoring}
                    >
                      {isBulkRestoring ? 'Restoring...' : `Restore ${trashSelectedCount} selected`}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setShowBulkPermanentConfirm(true)}
                      disabled={isBulkPermanentDeleting}
                    >
                      Delete {trashSelectedCount} permanently
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowEmptyTrashConfirm(true)}
                  disabled={isEmptyingTrash}
                  className="gap-2"
                >
                  {isEmptyingTrash ? (
                    <>
                      <Spinner size="sm" className="shrink-0" />
                      Deleting
                    </>
                  ) : (
                    'Empty trash'
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {isTrashLoading ? (
              <Card className="p-8 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <span className="text-sm text-zinc-500">Loading trash</span>
              </Card>
            ) : isTrashError ? (
              <Card className="p-8 text-center text-red-400">Failed to load trash.</Card>
            ) : trashList.length === 0 ? (
              <Card className="p-8 text-center text-zinc-500">
                No deleted expenses. Deleted items appear here and can be restored.
              </Card>
            ) : (
              trashList.map((exp) => (
                <Card key={exp.id} className="p-4 flex flex-nowrap items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={trashSelectedIds.has(exp.id)}
                      onChange={() => toggleTrashSelect(exp.id)}
                      className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50 shrink-0"
                      aria-label={`Select ${exp.category} ${formatAmount(exp.amount)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-100">{formatAmount(exp.amount)}</p>
                      <p className="text-sm text-zinc-500 break-words">
                        {formatDisplayDate(exp.date)} · {exp.category}
                        {exp.note ? ` · ${exp.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(exp)}
                      disabled={isRestoring}
                      aria-label="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setPermanentDeleteSingle(exp)}
                      disabled={isPermanentDeleting}
                      aria-label="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <Card className="p-4 sm:p-5 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter((e.target.value || '') as Category | '')}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[130px]">
                <label className="block text-xs font-medium text-zinc-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="date-input-dark w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="min-w-[130px]">
                <label className="block text-xs font-medium text-zinc-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="date-input-dark w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Search note</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchNote}
                  onChange={(e) => setSearchNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <p className="text-zinc-500 text-sm">
                {isLoading
                  ? 'Loading...'
                  : `${filtered.length} expense${filtered.length !== 1 ? 's' : ''}`}
              </p>
              {filtered.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  Select all
                </label>
              )}
            </div>
            <Button type="button" size="sm" onClick={openAddModal}>
              <Plus aria-hidden size={16} strokeWidth={2.5} /> Add
            </Button>
          </div>

          {selectedCount > 0 && (
            <Card className="mb-4 p-3 flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border-amber-500/20">
              <span className="text-sm text-zinc-200">{selectedCount} selected</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkDeleting}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkDeleting}
                >
                  Delete selected
                </Button>
              </div>
            </Card>
          )}
          <div ref={listRef} className="space-y-2">
            {isLoading ? (
              <Card className="p-8 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <span className="text-sm text-zinc-500">Loading expenses</span>
              </Card>
            ) : isError ? (
              <Card className="p-8 text-center text-red-400">Failed to load expenses.</Card>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center text-zinc-500">No expenses match your filters.</Card>
            ) : (
              sortedByDateDesc.map((exp, index) => {
                const currentWeek = weekKey(exp.date)
                const prevWeek = index > 0 ? weekKey(sortedByDateDesc[index - 1].date) : null

                return (
                  <div key={exp.id}>
                    {prevWeek && prevWeek !== currentWeek && (
                      <div className="border-t border-zinc-800 my-3" />
                    )}
                    <Card className="p-4 flex flex-nowrap items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(exp.id)}
                          onChange={() => toggleSelect(exp.id)}
                          className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50 shrink-0"
                          aria-label={`Select ${exp.category} ${formatAmount(exp.amount)}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-100">{formatAmount(exp.amount)}</p>
                          <p className="text-sm text-zinc-500 break-words">
                            {formatDisplayDate(exp.date)} · {exp.category}
                            {exp.note ? ` · ${exp.note}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingExpense(exp)}
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingExpense(exp)}
                          disabled={isDeleting}
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={async (payload) => {
            try {
              await updateExpense({ id: editingExpense.id, ...payload }).unwrap()
              setEditingExpense(null)
            } catch {
              // Error handling could show in modal
            }
          }}
          isLoading={isUpdating}
        />
      )}

      {deletingExpense && (
        <DeleteConfirmModal
          expense={deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={() => handleConfirmDelete(deletingExpense)}
          isLoading={isDeleting}
        />
      )}

      {showBulkDeleteConfirm && (
        <BulkDeleteConfirmModal
          count={selectedCount}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleConfirmBulkDelete}
          isLoading={isBulkDeleting}
        />
      )}

      {permanentDeleteSingle && (
        <PermanentDeleteConfirmModal
          mode="single"
          expense={permanentDeleteSingle}
          onClose={() => setPermanentDeleteSingle(null)}
          onConfirm={() => handlePermanentDeleteSingle(permanentDeleteSingle)}
          isLoading={isPermanentDeleting}
        />
      )}
      {showBulkPermanentConfirm && (
        <PermanentDeleteConfirmModal
          mode="bulk"
          count={trashSelectedCount}
          onClose={() => setShowBulkPermanentConfirm(false)}
          onConfirm={handleBulkPermanentDelete}
          isLoading={isBulkPermanentDeleting}
        />
      )}
      {showEmptyTrashConfirm && (
        <PermanentDeleteConfirmModal
          mode="empty"
          count={trashList.length}
          onClose={() => setShowEmptyTrashConfirm(false)}
          onConfirm={handleEmptyTrash}
          isLoading={isEmptyingTrash}
        />
      )}
    </div>
  )
}

interface EditExpenseModalProps {
  expense: Expense
  onClose: () => void
  onSave: (payload: {
    date: string
    amount: number
    category: Category
    note?: string
  }) => Promise<void>
  isLoading: boolean
}

function EditExpenseModal({ expense, onClose, onSave, isLoading }: EditExpenseModalProps) {
  const [date, setDate] = useState(expense.date)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [category, setCategory] = useState<Category>(expense.category)
  const [note, setNote] = useState(expense.note ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDate(expense.date)
    setAmount(expense.amount.toString())
    setCategory(expense.category)
    setNote(expense.note ?? '')
  }, [expense])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const num = parseFloat(amount)
    if (!date) {
      setError('Please select a date.')
      return
    }
    if (Number.isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }
    await onSave({
      date,
      amount: Math.round(num * 100) / 100,
      category,
      note: note.trim() || undefined,
    })
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-title"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="edit-expense-title" className="text-lg font-semibold text-zinc-100 mb-4">
          Edit expense
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input-dark w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Amount ({CURRENCY_SYMBOL})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 resize-y min-h-[80px]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" className="flex-1 gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="shrink-0" />
                  Saving
                </>
              ) : (
                'Save'
              )}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )

  return createPortal(modal, document.body)
}

interface DeleteConfirmModalProps {
  expense: Expense
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ expense, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-desc"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-confirm-title" className="text-lg font-semibold text-zinc-100 mb-2">
          Delete expense?
        </h2>
        <p id="delete-confirm-desc" className="text-zinc-400 text-sm mb-4">
          {formatAmount(expense.amount)} · {expense.category}
          {expense.note ? ` · ${expense.note}` : ''} ({formatDisplayDate(expense.date)})
        </p>
        <p className="text-zinc-500 text-sm mb-6">
          This will remove the expense from your list. You can&apos;t undo this.
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

interface BulkDeleteConfirmModalProps {
  count: number
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function BulkDeleteConfirmModal({
  count,
  onClose,
  onConfirm,
  isLoading,
}: BulkDeleteConfirmModalProps) {
  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
      aria-describedby="bulk-delete-desc"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="bulk-delete-title" className="text-lg font-semibold text-zinc-100 mb-2">
          Delete {count} expense{count !== 1 ? 's' : ''}?
        </h2>
        <p id="bulk-delete-desc" className="text-zinc-400 text-sm mb-6">
          This will remove the selected expense{count !== 1 ? 's' : ''} from your list. You
          can&apos;t undo this.
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
              `Delete ${count}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
  return createPortal(modal, document.body)
}

interface PermanentDeleteConfirmModalProps {
  mode: 'single' | 'bulk' | 'empty'
  expense?: Expense
  count: number
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function PermanentDeleteConfirmModal({
  mode,
  expense,
  count,
  onClose,
  onConfirm,
  isLoading,
}: PermanentDeleteConfirmModalProps) {
  const title =
    mode === 'single' && expense
      ? 'Delete this expense permanently?'
      : mode === 'empty'
        ? 'Empty trash?'
        : `Delete ${count} expense${count !== 1 ? 's' : ''} permanently?`
  const description =
    mode === 'single' && expense
      ? `${expense.category} · ${formatAmount(expense.amount)}${expense.note ? ` · ${expense.note}` : ''} (${formatDisplayDate(expense.date)}). This cannot be undone.`
      : mode === 'empty'
        ? `This will permanently delete all ${count} item${count !== 1 ? 's' : ''} in trash. This cannot be undone.`
        : `This will permanently delete the selected ${count} item${count !== 1 ? 's' : ''}. This cannot be undone.`

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="permanent-delete-title"
      aria-describedby="permanent-delete-desc"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="permanent-delete-title" className="text-lg font-semibold text-zinc-100 mb-2">
          {title}
        </h2>
        <p id="permanent-delete-desc" className="text-zinc-400 text-sm mb-6">
          {description}
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
              <>
                <Trash2 className="w-4 h-4" aria-hidden />
                Delete
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
  return createPortal(modal, document.body)
}
