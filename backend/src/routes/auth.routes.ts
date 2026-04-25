import { Router } from 'express'
import { login, register, me, selectTenant } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/login', login)
router.post('/select-tenant', selectTenant)
router.post('/register', register)
router.get('/me', authenticate, me)

export default router
