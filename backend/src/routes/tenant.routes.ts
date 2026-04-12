import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { getTenant, getTenantSettings, updateTenantSettings } from '../controllers/tenant.controller'

const router = Router()
router.use(authenticate)

router.get('/me', getTenant)
router.get('/settings', getTenantSettings)
router.put('/settings', authorize('ADMIN', 'MANAGER'), updateTenantSettings)

export default router
