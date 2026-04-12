import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error.middleware'
import { Role } from '@prisma/client'

export interface JwtPayload {
  userId: string
  tenantId: string
  role: Role
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação não fornecido.', 401)
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_SECRET

  if (!secret) throw new AppError('Configuração inválida do servidor.', 500)

  const payload = jwt.verify(token, secret) as JwtPayload
  req.user = payload
  next()
}

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('Não autenticado.', 401)
    if (!roles.includes(req.user.role)) {
      throw new AppError('Sem permissão para esta ação.', 403)
    }
    next()
  }
}
