import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import {
  listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
} from '../controllers/customer.controller'

const router = Router()
router.use(authenticate)

router.get('/', listCustomers)
router.get('/:id', getCustomer)
router.post('/', createCustomer)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

export default router
