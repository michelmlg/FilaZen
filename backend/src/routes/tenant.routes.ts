import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { checkSlug, getTenant, getTenantSettings, updateTenantSettings } from '../controllers/tenant.controller'

const router = Router()

// Rota pública (antes do authenticate) — usada no wizard de registro
router.get('/check-slug/:slug', checkSlug)

router.use(authenticate)
router.get('/me', getTenant)
router.get('/settings', getTenantSettings)
router.put('/settings', authorize('ADMIN', 'MANAGER'), updateTenantSettings)

export default router
