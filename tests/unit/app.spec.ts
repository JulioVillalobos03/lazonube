import { describe, expect, it } from 'vitest'
import { APP_NAME } from '../../shared/constants/app'

describe('application metadata', () => {
  it('uses the approved product name', () => {
    expect(APP_NAME).toBe('LazoNube')
  })
})
