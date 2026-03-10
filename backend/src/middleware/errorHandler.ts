import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error & { code?: string; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err)

  if (err.code === '23505') {
    res.status(409).json({ error: 'Conflict (duplicate)' })
    return
  }
  if (err.code === '23503') {
    res.status(400).json({ error: 'Invalid reference' })
    return
  }
  if (err.code === '22P02') {
    res.status(400).json({ error: 'Invalid UUID or value' })
    return
  }

  const status = err.statusCode ?? 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
