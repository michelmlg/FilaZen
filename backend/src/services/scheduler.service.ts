import cron from 'node-cron'
import { prisma } from '../utils/prisma'
import { getQueueSettings, updateQueueSettings, checkIdleUsers } from './queue.service'
import { generateSnapshot } from './snapshot.service'
import { emitToTenant } from './socket.service'
import { logger } from '../utils/logger'

let schedulerRunning = false

export function startScheduler(): void {
  if (schedulerRunning) {
    logger.info('Já está em execução', { module: 'Scheduler' })
    return
  }

  schedulerRunning = true
  logger.info('Iniciado', { module: 'Scheduler' })

  cron.schedule('* * * * *', async () => {
    await checkBusinessHours()
  })

  cron.schedule('* * * * *', async () => {
    await processAllTenantsIdleCheck()
  })
}

export function stopScheduler(): void {
  schedulerRunning = false
  logger.info('Parado', { module: 'Scheduler' })
}

async function checkBusinessHours(): Promise<void> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { active: true },
      select: { id: true }
    })

    for (const tenant of tenants) {
      await processTenantSchedule(tenant.id)
    }
  } catch (error) {
    logger.error('Erro ao verificar horários', { module: 'Scheduler', error })
  }
}

async function processTenantSchedule(tenantId: string): Promise<void> {
  try {
    const settings = await getQueueSettings(tenantId)

    if (!settings.autoSnapshot) {
      return
    }

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const currentTime = formatter.format(now)

    if (settings.businessHoursEnabled && currentTime === settings.businessHoursEnd && !settings.locked) {
      logger.info(`Fechando fila do tenant`, { module: 'Scheduler', tenantId })

      await generateSnapshot(tenantId, 'SCHEDULE')

      await updateQueueSettings(tenantId, { locked: true })

      emitToTenant(tenantId, 'queue:locked', {
        locked: true,
        reason: { type: 'BUSINESS_HOURS', message: 'Horário de fechamento' }
      })



      logger.success(`Snapshot gerado e fila travada`, { module: 'Scheduler', tenantId })
    }

    if (settings.businessHoursEnabled && currentTime === settings.businessHoursStart && settings.locked) {
      logger.info(`Abrindo fila do tenant`, { module: 'Scheduler', tenantId })

      if (settings.clearOnStart) {
        await clearQueue(tenantId)
        logger.info(`Fila limpa`, { module: 'Scheduler', tenantId })
      }

      await updateQueueSettings(tenantId, { locked: false })

      emitToTenant(tenantId, 'queue:locked', {
        locked: false,
        reason: { type: null, message: null }
      })

      logger.success(`Fila destravada`, { module: 'Scheduler', tenantId })
    }
  } catch (error) {
    logger.error(`Erro ao processar tenant`, { module: 'Scheduler', tenantId, error })
  }
}

async function clearQueue(tenantId: string): Promise<void> {
  await prisma.queueEntry.updateMany({
    where: {
      AND: [
        { tenantUser: { tenant: { id: tenantId } } },
        { tenantUser: { tenantId: tenantId } }
      ],
      position: { not: null }
    },
    data: {
      position: null,
      enteredAt: null,
      wasSkipped: false,
      skippedAt: null
    }
  })
}

export function getSchedulerStatus(): { running: boolean } {
  return { running: schedulerRunning }
}

async function processAllTenantsIdleCheck(): Promise<void> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { active: true },
      select: { id: true }
    })

    for (const tenant of tenants) {
      await checkIdleUsers(tenant.id)
    }
  } catch (error) {
    logger.error('Erro ao verificar usuários idle', { module: 'Scheduler', error })
  }
}
