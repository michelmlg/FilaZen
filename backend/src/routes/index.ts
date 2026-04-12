import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import customerRoutes from './customer.routes'
import ticketRoutes from './ticket.routes'
import tenantRoutes from './tenant.routes'
import queueRoutes from './queue.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/customers', customerRoutes)
router.use('/tickets', ticketRoutes)
router.use('/tenants', tenantRoutes)
router.use('/queue', queueRoutes)

export default router
