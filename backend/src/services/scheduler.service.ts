import cron from 'node-cron'
import { prisma } from '../utils/prisma'
import { getQueueSettings, updateQueueSettings, checkIdleUsers } from './queue.service'
import { generateSnapshot } from './snapshot.service'
import { emitToTenant } from './socket.service'

let schedulerRunning = false

export function startScheduler(): void {
  if (schedulerRunning) {
    console.log('[Scheduler] Já está em execução')
    return
  }

  schedulerRunning = true
  console.log('[Scheduler] Iniciado')

  cron.schedule('* * * * *', async () => {
    await checkBusinessHours()
  })

  cron.schedule('* * * * *', async () => {
    await processAllTenantsIdleCheck()
  })
}

export function stopScheduler(): void {
  schedulerRunning = false
  console.log('[Scheduler] Parado')
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
    console.error('[Scheduler] Erro ao verificar horários:', error)
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
      console.log(`[Scheduler] Fechando fila do tenant ${tenantId}`)

      await generateSnapshot(tenantId, 'SCHEDULE')

      await updateQueueSettings(tenantId, { locked: true })

      emitToTenant(tenantId, 'queue:locked', {
        locked: true,
        reason: { type: 'BUSINESS_HOURS', message: 'Horário de fechamento' }
      })



      console.log(`[Scheduler] Snapshot gerado e fila travada para tenant ${tenantId}`)
    }

    if (settings.businessHoursEnabled && currentTime === settings.businessHoursStart && settings.locked) {
      console.log(`[Scheduler] Abrindo fila do tenant ${tenantId}`)

      if (settings.clearOnStart) {
        await clearQueue(tenantId)
        console.log(`[Scheduler] Fila limpa para tenant ${tenantId}`)
      }

      await updateQueueSettings(tenantId, { locked: false })

      emitToTenant(tenantId, 'queue:locked', {
        locked: false,
        reason: { type: null, message: null }
      })

      console.log(`[Scheduler] Fila destravada para tenant ${tenantId}`)
    }
  } catch (error) {
    console.error(`[Scheduler] Erro ao processar tenant ${tenantId}:`, error)
  }
}

async function clearQueue(tenantId: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      tenantId,
      queuePosition: { not: null }
    },
    data: {
      queuePosition: null,
      queueEnteredAt: null,
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
    console.error('[Scheduler] Erro ao verificar usuários idle:', error)
  }
}
