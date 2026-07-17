import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { toTypedSchema } from '../../app/utils/zod-form-schema'

describe('toTypedSchema', () => {
  const schema = z.object({
    profile: z.object({
      email: z.string().email(),
    }),
  })

  it('returns parsed Zod output for valid values', async () => {
    const result = await toTypedSchema(schema).parse({
      profile: { email: 'hello@example.com' },
    })

    expect(result).toEqual({
      value: { profile: { email: 'hello@example.com' } },
      errors: [],
    })
  })

  it('maps Zod issue paths to VeeValidate field paths', async () => {
    const result = await toTypedSchema(schema).parse({
      profile: { email: 'invalid' },
    })

    expect(result.errors).toEqual([
      {
        path: 'profile.email',
        errors: ['Invalid email address'],
      },
    ])
  })
})
