import { z } from 'zod'

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_NAME: z.string().min(1),
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
  APP_VERSION: z.string().min(1),
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
})

export const serverEnv = serverEnvSchema.parse(process.env)
