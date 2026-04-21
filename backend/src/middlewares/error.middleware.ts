import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  // Erros do Prisma
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'Registro já existe com esses dados únicos.',
      })
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Registro não encontrado.',
      })
    }
  }

  // Erros JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'error', message: 'Token inválido.' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'error', message: 'Token expirado.' })
  }

  console.error('Erro interno:', err)

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor.' : err.message,
  })
}
