import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import expensesRouter from './routes/expenses.js'
import categoriesRouter from './routes/categories.js'
import planRouter from './routes/plan.js'
import { errorHandler } from './middleware/errorHandler.js'
import openapi from './docs/openapi.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '512kb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'expense-api' })
})

// OpenAPI / Swagger docs
app.use('/openapi.json', (_req, res) => {
  res.json(openapi)
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi))

app.use('/api/expenses', expensesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/plan', planRouter)

app.use(errorHandler)

export default app
