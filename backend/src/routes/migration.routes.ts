import { Router } from 'express'
import { migrate } from '../controllers/migration.controller'
import { authenticateMigration } from '../middlewares/migration-auth.middleware'

const router = Router()

router.post('/migrate', authenticateMigration, migrate)

export default router