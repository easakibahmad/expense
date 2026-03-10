import { Router } from 'express'
import {
  listPlanMonths,
  getPlanSummaries,
  getPlanByMonth,
  savePlanByMonth,
} from '../controllers/planController.js'

const router = Router()

router.get('/months', listPlanMonths)
router.get('/summaries', getPlanSummaries)
router.get('/:yearMonth', getPlanByMonth)
router.put('/:yearMonth', savePlanByMonth)

export default router
