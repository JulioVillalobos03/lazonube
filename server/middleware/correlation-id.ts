import { randomUUID } from 'node:crypto'

export default defineEventHandler((event) => {
  const incomingId = getHeader(event, 'x-correlation-id')
  const correlationId = incomingId?.trim() || randomUUID()

  event.context.correlationId = correlationId
  setHeader(event, 'x-correlation-id', correlationId)
})
