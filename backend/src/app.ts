import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './middlewares/error.middleware'
import { requestLogger } from './middlewares/logger.middleware'
import routes from './routes'

const app = express()

// ── Segurança e Parsing ────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Logger de Requisições ─────────────────────────────────
app.use(requestLogger)

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Rotas da API ──────────────────────────────────────────
app.use('/api/v1', routes)

// ── Tratador de Erros (deve ser o último middleware) ──────
app.use(errorHandler)

export default app
