import { existsSync } from 'node:fs'

const forbiddenLockfiles = [
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
]

const found = forbiddenLockfiles.filter((file) => existsSync(file))

if (!existsSync('package-lock.json')) {
  console.error('package-lock.json is required.')
  process.exitCode = 1
}

if (found.length > 0) {
  console.error(`Forbidden lockfiles found: ${found.join(', ')}`)
  process.exitCode = 1
}
