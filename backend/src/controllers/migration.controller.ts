import { Request, Response } from 'express'
import { execSync } from 'child_process'
import { AppError } from '../middlewares/error.middleware'

export const migrate = async (_req: Request, res: Response) => {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    return res.json({ success: true, message: 'Migration aplicada com sucesso.' })
  } catch (error) {
    console.error('Falha ao executar migration:', error)
    throw new AppError('Falha ao executar migration.', 500)
  }
}