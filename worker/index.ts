async function startWorker(): Promise<void> {
  console.info('No worker processors have been defined yet.')
}

startWorker().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
