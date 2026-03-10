import { Router, Request, Response } from 'express'
import { CATEGORIES } from '../types/index.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({ categories: [...CATEGORIES] })
})

export default router
