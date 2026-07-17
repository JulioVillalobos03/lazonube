async function main(): Promise<void> {
  console.info('No seed data has been defined yet.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
