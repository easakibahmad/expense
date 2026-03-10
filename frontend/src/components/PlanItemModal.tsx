import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CURRENCY_SYMBOL } from '../lib/currency'
import { Card } from './Card'
import { Button } from './Button'
import { Spinner } from './Spinner'
import type { PlannedExpenseItem } from '../store/api'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50'

interface PlanItemModalProps {
  mode: 'add' | 'edit'
  item?: PlannedExpenseItem | null
  onClose: () => void
  onSave: (label: string, amount: number) => Promise<void>
  isLoading?: boolean
}

export function PlanItemModal({
  mode,
  item,
  onClose,
  onSave,
  isLoading = false,
}: PlanItemModalProps) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'edit' && item) {
      setLabel(item.label)
      setAmount(String(item.amount))
    } else {
      setLabel('')
      setAmount('')
    }
    setError(null)
  }, [mode, item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedLabel = label.trim()
    const num = parseFloat(amount)
    if (!trimmedLabel) {
      setError('Please enter a label.')
      return
    }
    if (Number.isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }
    try {
      await onSave(trimmedLabel, num)
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const title = mode === 'add' ? 'Add planned item' : 'Edit planned item'
  const submitLabel = mode === 'add' ? 'Add item' : 'Save'

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-item-modal-title"
      style={{ minHeight: '100dvh' }}
    >
      <Card className="p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="plan-item-modal-title" className="text-lg font-semibold text-zinc-100 mb-4">
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="plan-item-label"
              className="block text-sm font-medium text-zinc-400 mb-1"
            >
              Label
            </label>
            <input
              id="plan-item-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Rent, Food"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="plan-item-amount"
              className="block text-sm font-medium text-zinc-400 mb-1"
            >
              Amount ({CURRENCY_SYMBOL})
            </label>
            <input
              id="plan-item-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
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
                submitLabel
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
