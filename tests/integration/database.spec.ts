import 'dotenv/config'
import { Pool } from 'pg'
import { afterAll, describe, expect, it } from 'vitest'

const connectionString = process.env.DATABASE_URL
const pool = connectionString ? new Pool({ connectionString }) : undefined

describe.skipIf(!pool)('PostgreSQL connectivity', () => {
  afterAll(async () => {
    await pool?.end()
  })

  it('executes a real database query', async () => {
    const result = await pool!.query<{ value: number }>('SELECT 1 AS value')

    expect(result.rows[0]?.value).toBe(1)
  })
})
