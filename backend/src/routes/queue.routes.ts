import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import {
  getQueue,
  getQueueMe,
  joinQueue,
  leaveQueue,
  openTicket,
  completeTicket,
  skipUser,
  getQueueConfig,
  updateQueueConfig,
  getQueueSnapshots,
  getQueueSnapshotByDate,
  getQueueSnapshotsWithActions,
  generateQueueSnapshot,
  reconnectQueueUser
} from '../controllers/queue.controller'

const router = Router()
router.use(authenticate)

router.get('/', getQueue)
router.get('/me', getQueueMe)
router.get('/settings', getQueueConfig)
router.get('/settings/config', getQueueConfig)
router.get('/snapshots', getQueueSnapshots)
router.get('/snapshots/:date', getQueueSnapshotByDate)
router.get('/snapshots/:date/full', getQueueSnapshotsWithActions)

router.post('/join', joinQueue)
router.post('/leave', leaveQueue)
router.post('/open-ticket', openTicket)
router.post('/complete-ticket', completeTicket)
router.post('/skip/:userId', skipUser)
router.post('/snapshots/generate', generateQueueSnapshot)
router.post('/reconnect', reconnectQueueUser)

router.put('/settings', updateQueueConfig)

export default router
