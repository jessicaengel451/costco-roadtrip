import { awsConfig } from '../auth/amplify'
import { getIdToken } from '../auth/session'

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getIdToken()
  if (!token) throw new Error('not authenticated')
  const res = await fetch(`${awsConfig.apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`)
  }
  return res
}

export async function fetchVisits(): Promise<string[]> {
  const res = await authedFetch('/visits')
  const body = (await res.json()) as { visitedLocationIds: string[] }
  return body.visitedLocationIds ?? []
}

export async function putVisits(visitedLocationIds: string[]): Promise<string[]> {
  const res = await authedFetch('/visits', {
    method: 'PUT',
    body: JSON.stringify({ visitedLocationIds }),
  })
  const body = (await res.json()) as { visitedLocationIds: string[] }
  return body.visitedLocationIds ?? []
}
