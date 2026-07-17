import { prisma } from '../../db/prisma'

export default defineEventHandler(async () => {
  await prisma.$queryRaw`SELECT 1`

  return {
    status: 'ready',
    timestamp: new Date().toISOString(),
  }
})
