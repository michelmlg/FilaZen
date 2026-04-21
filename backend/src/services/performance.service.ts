import { prisma } from '../utils/prisma'

export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL'

export interface PerformanceMetrics {
  totalTickets: number
  completedTickets: number
  cancelledTickets: number
  totalRevenue: number
  conversionRate: number
  score: number
}

const COMPLETED_WEIGHT = 10
const CONVERSION_WEIGHT = 50
const REVENUE_WEIGHT = 0.001

export function calculateScore(metrics: Omit<PerformanceMetrics, 'score'>): number {
  const completedScore = metrics.completedTickets * COMPLETED_WEIGHT
  const conversionScore = metrics.conversionRate * CONVERSION_WEIGHT
  const revenueScore = metrics.totalRevenue * REVENUE_WEIGHT
  
  return completedScore + conversionScore + revenueScore
}

export function getPeriodBounds(periodType: PeriodType, date: Date = new Date()): { start: Date; end: Date } {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  switch (periodType) {
    case 'MONTHLY':
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59)
      }
    
    case 'QUARTERLY':
      const quarter = Math.floor(month / 3)
      const quarterStartMonth = quarter * 3
      return {
        start: new Date(year, quarterStartMonth, 1),
        end: new Date(year, quarterStartMonth + 3, 0, 23, 59, 59)
      }
    
    case 'SEMIANNUAL':
      const half = Math.floor(month / 6)
      const halfStartMonth = half * 6
      return {
        start: new Date(year, halfStartMonth, 1),
        end: new Date(year, halfStartMonth + 6, 0, 23, 59, 59)
      }
    
    default:
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59)
      }
  }
}

export async function calculateUserPerformance(
  userId: string,
  tenantId: string,
  periodType: PeriodType = 'MONTHLY'
): Promise<PerformanceMetrics> {
  const { start, end } = getPeriodBounds(periodType)
  
  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      userId,
      createdAt: {
        gte: start,
        lte: end
      }
    }
  })
  
  const totalTickets = tickets.length
  const completedTickets = tickets.filter(t => t.status === 'DONE').length
  const cancelledTickets = tickets.filter(t => t.status === 'CANCELLED').length
  const totalRevenue = tickets
    .filter(t => t.finalValue)
    .reduce((sum, t) => sum + Number(t.finalValue || 0), 0)
  
  const conversionRate = totalTickets > 0 ? completedTickets / totalTickets : 0
  
  const score = calculateScore({
    totalTickets,
    completedTickets,
    cancelledTickets,
    totalRevenue,
    conversionRate
  })
  
  return {
    totalTickets,
    completedTickets,
    cancelledTickets,
    totalRevenue,
    conversionRate,
    score
  }
}

export async function updateUserPerformance(
  userId: string,
  tenantId: string,
  periodType: PeriodType = 'MONTHLY'
): Promise<void> {
  const metrics = await calculateUserPerformance(userId, tenantId, periodType)
  const { start } = getPeriodBounds(periodType)
  
  await prisma.userPerformance.upsert({
    where: {
      userId_periodStart_periodType: {
        userId,
        periodStart: start,
        periodType
      }
    },
    create: {
      userId,
      periodStart: start,
      periodEnd: getPeriodBounds(periodType, start).end,
      periodType,
      totalTickets: metrics.totalTickets,
      completedTickets: metrics.completedTickets,
      cancelledTickets: metrics.cancelledTickets,
      totalRevenue: metrics.totalRevenue,
      conversionRate: metrics.conversionRate,
      score: metrics.score
    },
    update: {
      totalTickets: metrics.totalTickets,
      completedTickets: metrics.completedTickets,
      cancelledTickets: metrics.cancelledTickets,
      totalRevenue: metrics.totalRevenue,
      conversionRate: metrics.conversionRate,
      score: metrics.score
    }
  })
}

export async function getUserPerformanceScore(
  userId: string,
  periodType: PeriodType = 'MONTHLY'
): Promise<number> {
  const { start } = getPeriodBounds(periodType)
  
  const performance = await prisma.userPerformance.findUnique({
    where: {
      userId_periodStart_periodType: {
        userId,
        periodStart: start,
        periodType
      }
    }
  })
  
  if (!performance) {
    return 0
  }
  
  return Number(performance.score)
}

export async function calculatePositionByScore(
  tenantId: string,
  userScore: number,
  excludeUserId?: string
): Promise<number> {
  const { start } = getPeriodBounds('MONTHLY')
  
  const higherScores = await prisma.userPerformance.count({
    where: {
      user: {
        tenantId,
        active: true,
        queuePosition: { not: null },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {})
      },
      periodStart: start,
      periodType: 'MONTHLY',
      score: { gt: userScore }
    }
  })
  
  return higherScores + 1
}

export async function getAllUserScores(
  tenantId: string
): Promise<{ userId: string; score: number }[]> {
  const { start } = getPeriodBounds('MONTHLY')
  
  const performances = await prisma.userPerformance.findMany({
    where: {
      user: {
        tenantId,
        active: true,
        queuePosition: { not: null }
      },
      periodStart: start,
      periodType: 'MONTHLY'
    },
    select: {
      userId: true,
      score: true
    }
  })
  
  return performances.map(p => ({
    userId: p.userId,
    score: Number(p.score)
  }))
}
