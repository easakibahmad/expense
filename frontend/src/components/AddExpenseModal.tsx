import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORIES, type Category } from '../data/types'
import { CURRENCY_SYMBOL } from '../lib/currency'
import { Card } from './Card'
import { Button } from './Button'
import { useCreateExpenseMutation } from '../store/api'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface AddExpenseModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function AddExpenseModal({ onClose, onSuccess }: AddExpenseModalProps) {
  const [createExpense, { isLoading }] = useCreateExpenseMutation()
  const [date, setDate] = useState(todayStr())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('Food')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

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
    try {
      await createExpense({
        date,
        amount: Math.round(num * 100) / 100,
        category,
        note: note.trim() || undefined,
      }).unwrap()
      onSuccess?.()
      onClose()
    } catch {
      setError('Failed to save expense. Please try again.')
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
      style={{ minHeight: '100dvh' }}
    >
      <Card
        className="p-6 max-w-lg w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-expense-title" className="text-lg font-semibold text-zinc-100 mb-4">
          Add expense
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="add-date" className="block text-sm font-medium text-zinc-400 mb-1">
              Date
            </label>
            <input
              id="add-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input-dark w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label htmlFor="add-amount" className="block text-sm font-medium text-zinc-400 mb-1">
              Amount ({CURRENCY_SYMBOL})
            </label>
            <input
              id="add-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label htmlFor="add-category" className="block text-sm font-medium text-zinc-400 mb-1">
              Category
            </label>
            <select
              id="add-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-note" className="block text-sm font-medium text-zinc-400 mb-1">
              Note (optional)
            </label>
            <textarea
              id="add-note"
              rows={3}
              placeholder="e.g. Lunch at cafe"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Add expense'}
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
