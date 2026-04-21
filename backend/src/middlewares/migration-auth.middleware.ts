import { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware'

export const authenticateMigration = (req: Request, _res: Response, next: NextFunction) => {
  const migrationKey = req.headers['x-migration-key']

  if (!migrationKey) {
    throw new AppError('Chave de migration não fornecida.', 401)
  }

  const expectedKey = process.env.MIGRATION_SECRET

  if (!expectedKey || migrationKey !== expectedKey) {
    throw new AppError('Chave de migration inválida.', 403)
  }

  next()
}