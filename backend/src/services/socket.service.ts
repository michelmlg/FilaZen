import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../middlewares/auth.middleware'
import { buildQueueSnapshot, getQueueSettings, isWithinBusinessHours } from './queue.service'
import { prisma } from '../utils/prisma'

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

  // Carregar lastQueuePing do DB para o Map em memória
  const loadLastQueuePings = async () => {
    try {
      const usersWithPing = await prisma.user.findMany({
        where: {
          lastQueuePing: { not: null },
          queuePosition: { not: null }
        },
        select: { id: true, lastQueuePing: true }
      })
      for (const user of usersWithPing) {
        if (user.lastQueuePing) {
          connectedUsers.set(user.id, user.lastQueuePing.getTime())
        }
      }
      console.log(`[WS] Carregados ${connectedUsers.size} lastQueuePings do DB`)
    } catch (error) {
      console.error(`[WS] Erro ao carregar lastQueuePings`, error)
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
    console.log(`[WS] CONN user:${user.userId} tenant:${user.tenantId} socket:${socket.id}`)

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
      console.error(`[WS] Erro ao enviar queue:init para user:${user.userId}`, error)
    }

    socket.on('disconnect', (reason) => {
      console.log(`[WS] DISCONN user:${user.userId} socket:${socket.id} reason:${reason}`)
      connectedUsers.delete(user.userId)
    })

    // Heartbeat para manter usuário como ativo
    socket.on('user:heartbeat', async () => {
      const now = Date.now()
      connectedUsers.set(user.userId, now)
      try {
        await prisma.user.update({
          where: { id: user.userId },
          data: { lastQueuePing: new Date(now) }
        })
      } catch (error) {
        console.error(`[WS] Erro ao salvar lastQueuePing`, error)
      }
    })

    // Usuário indica que está Indo offline (mudança de rota/fechar)
    socket.on('user:offline', async () => {
      console.log(`[WS] OFFLINE user:${user.userId}`)
      connectedUsers.delete(user.userId)
      try {
        await prisma.user.update({
          where: { id: user.userId },
          data: { lastQueuePing: null }
        })
      } catch (error) {
        console.error(`[WS] Erro ao limpar lastQueuePing`, error)
      }
    })

    socket.onAny((event, ...args) => {
      console.log(`[WS] RECV user:${user.userId} tenant:${user.tenantId} socket:${socket.id} event:${event} data:${formatData(args)}`)
    })

    socket.on('error', (error) => {
      console.log(`[WS] ERROR socket:${socket.id} user:${user.userId} message:${error.message}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io não inicializado.')
  return io
}

export const emitToTenant = (tenantId: string, event: string, data: unknown) => {
  console.log(`[WS] EMIT tenant:${tenantId} event:${event} data:${formatData(data)}`)
  getIO().to(`tenant:${tenantId}`).emit(event, data)
}

export const emitToUser = (userId: string, event: string, data: unknown) => {
  console.log(`[WS] EMIT user:${userId} event:${event} data:${formatData(data)}`)
  getIO().to(`user:${userId}`).emit(event, data)
}

export const getConnectedUsers = () => connectedUsers

export const updateUserConnection = (userId: string) => {
  connectedUsers.set(userId, Date.now())
}
