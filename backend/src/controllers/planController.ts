import { Request, Response, NextFunction } from 'express'
import { query, pool } from '../config/database.js'
import {
  type PlanItemRow,
  type MonthlyPlanResponse,
  type PlanSummaryItem,
  type SavePlanBody,
  rowToPlanItem,
} from '../types/index.js'

const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

function parseYearMonth(yearMonth: string): { valid: boolean; year?: number; month?: number } {
  if (!YEAR_MONTH_REGEX.test(yearMonth)) return { valid: false }
  const [y, m] = yearMonth.split('-').map(Number)
  if (m < 1 || m > 12) return { valid: false }
  return { valid: true, year: y, month: m }
}

export async function listPlanMonths(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<{ year_month: string }>(
      'SELECT year_month FROM monthly_plans ORDER BY year_month DESC'
    )
    res.json({ months: result.rows.map((r) => r.year_month) })
  } catch (err) {
    next(err)
  }
}

export async function getPlanSummaries(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<{
      year_month: string
      monthly_income: string | null
      planned_total: string
    }>(
      `SELECT p.year_month, p.monthly_income,
       COALESCE(SUM(i.amount), 0)::DECIMAL AS planned_total
       FROM monthly_plans p
       LEFT JOIN monthly_plan_items i ON i.plan_id = p.id
       GROUP BY p.id, p.year_month, p.monthly_income
       ORDER BY p.year_month DESC`
    )
    const summaries: PlanSummaryItem[] = result.rows.map((r) => ({
      year_month: r.year_month,
      planned_total: parseFloat(r.planned_total),
      monthly_income: r.monthly_income != null ? parseFloat(r.monthly_income) : null,
    }))
    res.json({ summaries })
  } catch (err) {
    next(err)
  }
}

export async function getPlanByMonth(req: Request, res: Response, next: NextFunction) {
  try {
    const { yearMonth } = req.params
    const { valid } = parseYearMonth(yearMonth)
    if (!valid) {
      res.status(400).json({ error: 'Invalid year_month; use YYYY-MM' })
      return
    }

    const planResult = await query<{ id: string; monthly_income: string | null }>(
      'SELECT id, monthly_income FROM monthly_plans WHERE year_month = $1',
      [yearMonth]
    )
    if (planResult.rows.length === 0) {
      res.status(404).json({ error: 'Plan not found for this month' })
      return
    }
    const planId = planResult.rows[0].id
    const monthlyIncome =
      planResult.rows[0].monthly_income != null
        ? parseFloat(planResult.rows[0].monthly_income)
        : null

    const itemsResult = await query<PlanItemRow>(
      'SELECT id, label, amount, position FROM monthly_plan_items WHERE plan_id = $1 ORDER BY position ASC, created_at ASC',
      [planId]
    )
    const items = itemsResult.rows.map(rowToPlanItem)
    const body: MonthlyPlanResponse = { items, monthlyIncome }
    res.json(body)
  } catch (err) {
    next(err)
  }
}

export async function savePlanByMonth(req: Request, res: Response, next: NextFunction) {
  try {
    const { yearMonth } = req.params
    const { valid } = parseYearMonth(yearMonth)
    if (!valid) {
      res.status(400).json({ error: 'Invalid year_month; use YYYY-MM' })
      return
    }

    const body = req.body as SavePlanBody & { items?: { label: string; amount: number | string }[] }
    const rawIncome = body.monthlyIncome
    const monthlyIncome =
      rawIncome === undefined || rawIncome === null
        ? undefined
        : typeof rawIncome === 'string'
          ? parseFloat(rawIncome)
          : rawIncome
    if (
      monthlyIncome !== undefined &&
      monthlyIncome !== null &&
      (Number.isNaN(monthlyIncome) || monthlyIncome < 0)
    ) {
      res.status(400).json({ error: 'monthlyIncome must be a non-negative number or null' })
      return
    }

    const rawItems = body.items
    if (!Array.isArray(rawItems)) {
      res.status(400).json({ error: 'items must be an array of { label, amount }' })
      return
    }
    const items = rawItems.map((item) => {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      if (!item.label || typeof item.label !== 'string' || !item.label.trim()) {
        throw new Error('Each item must have a non-empty label')
      }
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('Each item must have amount > 0')
      }
      return { label: item.label.trim(), amount }
    })
    if (items.length === 0 && (monthlyIncome === undefined || monthlyIncome === null)) {
      res.status(400).json({ error: 'Provide at least monthlyIncome or at least one item' })
      return
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let planId: string | null = null
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM monthly_plans WHERE year_month = $1',
        [yearMonth]
      )
      if (existing.rows.length > 0) {
        planId = existing.rows[0].id
        if (monthlyIncome !== undefined) {
          await client.query(
            'UPDATE monthly_plans SET monthly_income = $1, updated_at = NOW() WHERE id = $2',
            [monthlyIncome, planId]
          )
        }
      } else {
        const insert = await client.query<{ id: string }>(
          `INSERT INTO monthly_plans (id, year_month, monthly_income, updated_at)
           VALUES (gen_random_uuid(), $1, $2, NOW())
           RETURNING id`,
          [yearMonth, monthlyIncome ?? null]
        )
        planId = insert.rows[0].id
      }

      await client.query('DELETE FROM monthly_plan_items WHERE plan_id = $1', [planId])

      for (let i = 0; i < items.length; i++) {
        await client.query(
          `INSERT INTO monthly_plan_items (id, plan_id, label, amount, position)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [planId, items[i].label, items[i].amount, i + 1]
        )
      }

      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    const updated = await query<{ id: string; monthly_income: string | null }>(
      'SELECT id, monthly_income FROM monthly_plans WHERE year_month = $1',
      [yearMonth]
    )
    const savedPlanId = updated.rows[0].id
    const itemsResult = await query<PlanItemRow>(
      'SELECT id, label, amount, position FROM monthly_plan_items WHERE plan_id = $1 ORDER BY position ASC',
      [savedPlanId]
    )
    const response: MonthlyPlanResponse = {
      items: itemsResult.rows.map(rowToPlanItem),
      monthlyIncome:
        updated.rows[0].monthly_income != null ? parseFloat(updated.rows[0].monthly_income) : null,
    }
    res.json(response)
  } catch (err) {
    next(err)
  }
}
