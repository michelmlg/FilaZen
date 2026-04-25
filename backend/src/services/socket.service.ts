import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../middlewares/auth.middleware'
import { buildQueueSnapshot, getQueueSettings, isWithinBusinessHours } from './queue.service'
import { prisma } from '../utils/prisma'
import { logger } from '../utils/logger'

let io: SocketServer

const connectedUsers = new Map<string, number>()

const formatData = (data: unknown): string => {
  try {
    const str = JSON.stringify(data)
    return str.length > 200 ? str.substring(0, 200) + '...' : str
  } catch {
    return '[unstringifiable]'
  }
}

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // Carregar lastPing do DB para o Map em memória
  const loadLastQueuePings = async () => {
    try {
      const entriesWithPing = await prisma.queueEntry.findMany({
        where: {
          lastPing: { not: null },
          position: { not: null }
        },
        include: { tenantUser: { select: { user: { select: { id: true } } } } }
      })
      for (const entry of entriesWithPing) {
        if (entry.lastPing) {
          connectedUsers.set(entry.tenantUser.user.id, entry.lastPing.getTime())
        }
      }
      logger.info(`Carregados ${connectedUsers.size} lastPings do DB`, { module: 'WS' })
    } catch (error) {
      logger.error(`Erro ao carregar lastPings`, { module: 'WS', error })
    }
  }
  loadLastQueuePings()

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Token não fornecido.'))

    try {
      const secret = process.env.JWT_SECRET || ''
      const payload = jwt.verify(token, secret) as JwtPayload
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Token inválido.'))
    }
  })

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as JwtPayload
    logger.success(`Usuário conectado`, { module: 'WS', socket: socket.id, user: user.name, userId: user.userId, tenant: user.tenantSlug })

    socket.join(`tenant:${user.tenantId}`)
    socket.join(`user:${user.userId}`)

    connectedUsers.set(user.userId, Date.now())

    // Enviar estado completo da fila ao conectar
    try {
      const [users, settings] = await Promise.all([
        buildQueueSnapshot(user.tenantId),
        getQueueSettings(user.tenantId)
      ])

      const isLocked = settings.locked || (settings.businessHoursEnabled && !isWithinBusinessHours(settings))
      const lockReason = settings.locked
        ? { type: 'MANUAL' as const, message: 'Fila travada pelo administrador' }
        : (settings.businessHoursEnabled && !isWithinBusinessHours(settings))
          ? { type: 'BUSINESS_HOURS' as const, message: 'Fora do horário comercial' }
          : { type: null, message: null }

      socket.emit('queue:init', {
        users,
        settings,
        isLocked,
        lockReason
      })
    } catch (error) {
      logger.error(`Erro ao enviar queue:init`, { module: 'WS', user: user.name, error })
    }

    socket.on('disconnect', (reason) => {
      logger.warn(`Usuário desconectado`, { module: 'WS', user: user.name, reason })
      connectedUsers.delete(user.userId)
    })

// Heartbeat para manter usuário como ativo
    socket.on('user:heartbeat', async () => {
      const now = Date.now()
      connectedUsers.set(user.userId, now)
      try {
        // Buscar tenantUser e atualizar queueEntry
        const membership = await prisma.tenantUser.findFirst({
          where: { tenantId: user.tenantId, userId: user.userId },
          select: { id: true }
        })
        if (membership) {
          await prisma.queueEntry.upsert({
            where: { tenantUserId: membership.id },
            create: {
              tenantUserId: membership.id,
              lastPing: new Date(now)
            },
            update: {
              lastPing: new Date(now)
            }
          })
        }
      } catch (error) {
        logger.error(`Erro ao salvar heartbeat ping`, { module: 'WS', user: user.name, error })
      }
    })

    // Usuário indica que está Indo offline (mudança de rota/fechar)
    socket.on('user:offline', async () => {
      logger.warn(`Usuário está Indo offline`, { module: 'WS', user: user.name })
      connectedUsers.delete(user.userId)
      try {
        const membership = await prisma.tenantUser.findFirst({
          where: { tenantId: user.tenantId, userId: user.userId },
          select: { id: true }
        })
        if (membership) {
          await prisma.queueEntry.upsert({
            where: { tenantUserId: membership.id },
            create: {
              tenantUserId: membership.id
            },
            update: {
              lastPing: null
            }
          })
        }
      } catch (error) {
        logger.error(`Erro ao salvar heartbeat ping`, { module: 'WS', user: user.name, error })
      }
    })

    // Usuário indica que está Indo offline (mudança de rota/fechar)
    socket.on('user:offline', async () => {
      logger.warn(`Usuário está indo offline`, { module: 'WS', user: user.name })
      connectedUsers.delete(user.userId)
      try {
        const membership = await prisma.tenantUser.findFirst({
          where: { tenantId: user.tenantId, userId: user.userId },
          select: { id: true }
        })
        if (membership) {
          await prisma.queueEntry.update({
            where: { tenantUserId: membership.id },
            data: { lastPing: null }
          })
        }
      } catch (error) {
        logger.error(`Erro ao limpar ping`, { module: 'WS', user: user.name, error })
      }
    })

    socket.onAny((event, ...args) => {
      logger.debug(`RECV Event: ${event}`, { module: 'WS', user: user.name, data: formatData(args) })
    })

    socket.on('error', (error) => {
      logger.error(`Erro no socket`, { module: 'WS', user: user.name, message: error.message })
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io não inicializado.')
  return io
}

export const emitToTenant = (tenantId: string, event: string, data: unknown) => {
  logger.debug(`EMIT to Tenant: ${event}`, { module: 'WS', tenantId, data: formatData(data) })
  getIO().to(`tenant:${tenantId}`).emit(event, data)
}

export const emitToUser = (userId: string, event: string, data: unknown) => {
  logger.debug(`EMIT to User: ${event}`, { module: 'WS', userId, data: formatData(data) })
  getIO().to(`user:${userId}`).emit(event, data)
}

export const getConnectedUsers = () => connectedUsers

export const updateUserConnection = (userId: string) => {
  connectedUsers.set(userId, Date.now())
}
