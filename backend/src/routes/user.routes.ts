import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import {
  listUsers, getUser, createUser, updateUser, updateRole, updateStatus, resetPassword, deleteUser,
} from '../controllers/user.controller'

const router = Router()
router.use(authenticate)

router.get('/', authorize('ADMIN', 'MANAGER'), listUsers)
router.get('/:id', getUser)
router.post('/', authorize('ADMIN'), createUser)
router.put('/:id', updateUser)
router.patch('/:id/role', authorize('ADMIN'), updateRole)
router.patch('/:id/status', updateStatus)
router.post('/reset-password/:id', authorize('ADMIN'), resetPassword)
router.delete('/:id', authorize('ADMIN'), deleteUser)

export default router
