import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { fetchVisits, putVisits } from './client'

vi.mock('../auth/session', () => ({
  getIdToken: vi.fn(async () => 'fake-token'),
}))

const API = 'https://placeholder.execute-api.us-east-1.amazonaws.com'

// aws-config.json varies by environment (CI injects real values), so pin
// apiUrl to keep the MSW handlers deterministic.
vi.mock('../auth/amplify', () => ({
  awsConfig: { apiUrl: 'https://placeholder.execute-api.us-east-1.amazonaws.com' },
}))

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('fetchVisits', () => {
  it('GETs /visits with bearer token', async () => {
    let seenAuth: string | null = null
    server.use(
      http.get(`${API}/visits`, ({ request }) => {
        seenAuth = request.headers.get('authorization')
        return HttpResponse.json({ visitedLocationIds: ['a', 'b'] })
      }),
    )
    const res = await fetchVisits()
    expect(res).toEqual(['a', 'b'])
    expect(seenAuth).toBe('Bearer fake-token')
  })

  it('returns [] when API omits the field', async () => {
    server.use(
      http.get(`${API}/visits`, () => HttpResponse.json({})),
    )
    expect(await fetchVisits()).toEqual([])
  })

  it('throws on non-2xx', async () => {
    server.use(http.get(`${API}/visits`, () => new HttpResponse(null, { status: 500 })))
    await expect(fetchVisits()).rejects.toThrow(/500/)
  })
})

describe('putVisits', () => {
  it('PUTs the array as json with bearer token', async () => {
    let seenBody: unknown
    server.use(
      http.put(`${API}/visits`, async ({ request }) => {
        seenBody = await request.json()
        return HttpResponse.json({ visitedLocationIds: ['a'] })
      }),
    )
    const res = await putVisits(['a'])
    expect(res).toEqual(['a'])
    expect(seenBody).toEqual({ visitedLocationIds: ['a'] })
  })
})
