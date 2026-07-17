import { prisma } from '../../db/prisma'
import { withTimeout } from '../../utils/timeout'

export default defineEventHandler(async () => {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 1_000)
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service unavailable',
    })
  }

  return {
    status: 'ready',
    timestamp: new Date().toISOString(),
  }
})
