import app from './app'
import { createServer } from 'http'
import { initSocket } from './services/socket.service'
import { startScheduler } from './services/scheduler.service'

const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

initSocket(httpServer)

if (process.env.NODE_ENV !== 'test') {
  startScheduler()
}

httpServer.listen(PORT, () => {
  console.log(`FilaZen API rodando na porta ${PORT}`)
  console.log(`WebSocket (Socket.io) inicializado`)
  console.log(`Scheduler de fila iniciado`)
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
})
