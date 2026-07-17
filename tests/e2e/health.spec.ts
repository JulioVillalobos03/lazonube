import { expect, test } from '@playwright/test'

test('application is available', async ({ request }) => {
  const response = await request.get('/up')

  expect(response.ok()).toBe(true)
  await expect(response.json()).resolves.toMatchObject({ status: 'ok' })
})
