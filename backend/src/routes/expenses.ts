import { Router } from 'express'
import {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  listTrash,
  restoreExpense,
  bulkRestoreExpenses,
  permanentDeleteExpense,
  bulkPermanentDeleteExpenses,
  emptyTrash,
} from '../controllers/expensesController.js'

const router = Router()

router.get('/', listExpenses)
router.get('/trash', listTrash)
router.delete('/trash', emptyTrash)
router.post('/bulk-delete', bulkDeleteExpenses)
router.post('/bulk-restore', bulkRestoreExpenses)
router.post('/bulk-permanent-delete', bulkPermanentDeleteExpenses)
router.get('/:id', getExpenseById)
router.post('/:id/restore', restoreExpense)
router.delete('/:id/permanent', permanentDeleteExpense)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

export default router
