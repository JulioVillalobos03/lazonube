import type { TypedSchema } from 'vee-validate'
import type { z } from 'zod'

type FormValues = Record<string, unknown>

function formatPath(path: PropertyKey[]): string | undefined {
  if (path.length === 0) {
    return undefined
  }

  return path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${segment}]`
        : index === 0
          ? String(segment)
          : `.${String(segment)}`,
    )
    .join('')
}

/**
 * Adapts Zod 4 schemas to VeeValidate's stable TypedSchema contract.
 * It keeps Zod as the shared contract source without relying on the Zod 3-only
 * @vee-validate/zod adapter.
 */
export function toTypedSchema<
  TInput extends FormValues,
  TOutput extends FormValues,
>(schema: z.ZodType<TOutput, TInput>): TypedSchema<TInput, TOutput> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)

      if (result.success) {
        return {
          value: result.data,
          errors: [],
        }
      }

      return {
        errors: result.error.issues.map((issue) => ({
          path: formatPath(issue.path),
          errors: [issue.message],
        })),
      }
    },
  }
}
