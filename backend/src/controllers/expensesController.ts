import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database.js'
import {
  rowToExpense,
  CATEGORIES,
  type ExpenseRow,
  type CreateExpenseBody,
  type UpdateExpenseBody,
} from '../types/index.js'

const isValidCategory = (c: string): boolean =>
  CATEGORIES.includes(c as (typeof CATEGORIES)[number])

export async function listExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, dateFrom, dateTo, search } = req.query as {
      category?: string
      dateFrom?: string
      dateTo?: string
      search?: string
    }

    let sql =
      'SELECT id, date, amount, category, note, created_at FROM expenses WHERE deleted_at IS NULL'
    const params: unknown[] = []
    let i = 1

    if (category && isValidCategory(category)) {
      sql += ` AND category = $${i++}`
      params.push(category)
    }
    if (dateFrom) {
      sql += ` AND date >= $${i++}`
      params.push(dateFrom)
    }
    if (dateTo) {
      sql += ` AND date <= $${i++}`
      params.push(dateTo)
    }
    if (search && search.trim()) {
      sql += ` AND (note IS NOT NULL AND note ILIKE $${i++})`
      params.push(`%${search.trim()}%`)
    }

    sql += ' ORDER BY date DESC, created_at DESC'

    const result = await query<ExpenseRow>(sql, params)
    const expenses = result.rows.map(rowToExpense)
    res.json(expenses)
  } catch (err) {
    next(err)
  }
}

export async function getExpenseById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await query<ExpenseRow>(
      'SELECT id, date, amount, category, note, created_at FROM expenses WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Expense not found' })
      return
    }
    res.json(rowToExpense(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateExpenseBody & { amount?: number | string }
    const { date, category, note } = body
    const amount = typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount

    if (!date || typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0 || !category) {
      res.status(400).json({
        error:
          'Invalid body: date (string), amount (number > 0), and category (string) are required',
      })
      return
    }
    if (!isValidCategory(category)) {
      res.status(400).json({
        error: `category must be one of: ${CATEGORIES.join(', ')}`,
      })
      return
    }

    const result = await query<ExpenseRow>(
      `INSERT INTO expenses (id, date, amount, category, note)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, date, amount, category, note, created_at`,
      [date, amount, category, note?.trim() || null]
    )
    res.status(201).json(rowToExpense(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const body = (req.body ?? {}) as UpdateExpenseBody & { amount?: number | string }

    if (body.category !== undefined && !isValidCategory(body.category)) {
      res.status(400).json({
        error: `category must be one of: ${CATEGORIES.join(', ')}`,
      })
      return
    }
    const amountProvided = body.amount !== undefined && body.amount !== null
    const amountNum =
      amountProvided && typeof body.amount === 'string'
        ? parseFloat(body.amount)
        : Number(body.amount)
    if (body.amount !== undefined && (Number.isNaN(amountNum) || amountNum <= 0)) {
      res.status(400).json({ error: 'amount must be a number greater than 0' })
      return
    }

    const existing = await query<ExpenseRow>(
      'SELECT id, date, amount, category, note, created_at FROM expenses WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Expense not found' })
      return
    }

    const row = existing.rows[0]
    const existingDateStr =
      typeof row.date === 'string' ? row.date.slice(0, 10) : row.date.toISOString().slice(0, 10)

    const date =
      typeof body.date === 'string' && body.date.length >= 10
        ? body.date.slice(0, 10)
        : existingDateStr
    const amount = amountProvided ? amountNum : parseFloat(row.amount)
    const category =
      body.category !== undefined && body.category !== null ? body.category : row.category
    const note = Object.prototype.hasOwnProperty.call(body, 'note')
      ? (typeof body.note === 'string' ? body.note.trim() : body.note) || null
      : row.note

    const result = await query<ExpenseRow>(
      `UPDATE expenses SET date = $1, amount = $2, category = $3, note = $4
       WHERE id = $5
       RETURNING id, date, amount, category, note, created_at`,
      [date, amount, category, note, id]
    )
    res.json(rowToExpense(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await query(
      'UPDATE expenses SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Expense not found' })
      return
    }
    res.status(200).json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
}

export async function bulkDeleteExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { ids?: unknown }
    const ids = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const uuidList = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (uuidList.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const result = await query<{ id: string }>(
      `UPDATE expenses SET deleted_at = NOW()
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL
       RETURNING id`,
      [uuidList]
    )
    const deletedIds = result.rows.map((r) => r.id)
    res.status(200).json({ deleted: deletedIds.length, ids: deletedIds })
  } catch (err) {
    next(err)
  }
}

export async function listTrash(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<ExpenseRow>(
      `SELECT id, date, amount, category, note, created_at
       FROM expenses
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )
    res.json(result.rows.map(rowToExpense))
  } catch (err) {
    next(err)
  }
}

export async function restoreExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await query<ExpenseRow>(
      `UPDATE expenses SET deleted_at = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, date, amount, category, note, created_at`,
      [id]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Expense not found or not deleted' })
      return
    }
    res.status(200).json(rowToExpense(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

export async function bulkRestoreExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { ids?: unknown }
    const ids = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const uuidList = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (uuidList.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const result = await query<{ id: string }>(
      `UPDATE expenses SET deleted_at = NULL
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NOT NULL
       RETURNING id`,
      [uuidList]
    )
    const restoredIds = result.rows.map((r) => r.id)
    res.status(200).json({ restored: restoredIds.length, ids: restoredIds })
  } catch (err) {
    next(err)
  }
}

export async function permanentDeleteExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id',
      [id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Expense not found or not in trash' })
      return
    }
    res.status(200).json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
}

export async function bulkPermanentDeleteExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { ids?: unknown }
    const ids = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const uuidList = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (uuidList.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array of UUIDs' })
      return
    }
    const result = await query<{ id: string }>(
      `DELETE FROM expenses
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NOT NULL
       RETURNING id`,
      [uuidList]
    )
    const deletedIds = result.rows.map((r) => r.id)
    res.status(200).json({ deleted: deletedIds.length, ids: deletedIds })
  } catch (err) {
    next(err)
  }
}

export async function emptyTrash(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<{ id: string }>(
      'DELETE FROM expenses WHERE deleted_at IS NOT NULL RETURNING id'
    )
    const deletedIds = result.rows.map((r) => r.id)
    res.status(200).json({ deleted: deletedIds.length, ids: deletedIds })
  } catch (err) {
    next(err)
  }
}
