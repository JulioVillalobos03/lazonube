const heartbeatIntervalMs = 60_000

function logHeartbeat(): void {
  console.info(
    JSON.stringify({
      event: 'worker.heartbeat',
      timestamp: new Date().toISOString(),
    }),
  )
}

async function startWorker(): Promise<void> {
  console.info('Worker runtime started without processors during Phase 0.')
  logHeartbeat()

  const heartbeat = setInterval(logHeartbeat, heartbeatIntervalMs)

  await new Promise<void>((resolve) => {
    const stop = () => {
      clearInterval(heartbeat)
      console.info('Worker runtime stopped.')
      resolve()
    }

    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}

startWorker().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
