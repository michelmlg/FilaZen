import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import {
  listTickets, getTicket, createTicket, updateTicket,
  acceptTicket, closeTicket, addEvent,
} from '../controllers/ticket.controller'

const router = Router()
router.use(authenticate)

router.get('/', listTickets)
router.get('/:id', getTicket)
router.post('/', createTicket)
router.put('/:id', updateTicket)
router.patch('/:id/accept', acceptTicket)
router.patch('/:id/close', closeTicket)
router.post('/:id/events', addEvent)

export default router
