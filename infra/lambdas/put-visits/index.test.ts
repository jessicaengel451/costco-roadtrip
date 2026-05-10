import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

process.env.TABLE_NAME = 'test-table'

const ddbMock = mockClient(DynamoDBDocumentClient)

const { handler } = await import('./index')

function makeEvent(sub: string, body: unknown) {
  return {
    requestContext: { authorizer: { jwt: { claims: { sub } } } },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  } as never
}

beforeEach(() => {
  ddbMock.reset()
})

describe('put-visits handler', () => {
  it('stores the deduped list and returns it', async () => {
    ddbMock.on(PutCommand).resolves({})
    const res = (await handler(
      makeEvent('user-1', { visitedLocationIds: ['a', 'b', 'a'] }),
    )) as { statusCode: number; body: string }
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).visitedLocationIds.sort()).toEqual(['a', 'b'])

    const calls = ddbMock.commandCalls(PutCommand)
    expect(calls).toHaveLength(1)
    const item = calls[0]!.args[0].input.Item as Record<string, unknown>
    expect(item.pk).toBe('USER#user-1')
    expect(item.visitedLocationIds).toEqual(expect.arrayContaining(['a', 'b']))
    expect(item.updatedAt).toEqual(expect.any(String))
  })

  it('rejects invalid JSON', async () => {
    const res = (await handler(makeEvent('user-1', '{not json'))) as { statusCode: number }
    expect(res.statusCode).toBe(400)
  })

  it('rejects when visitedLocationIds is not an array', async () => {
    const res = (await handler(makeEvent('user-1', { visitedLocationIds: 'nope' }))) as {
      statusCode: number
    }
    expect(res.statusCode).toBe(400)
  })

  it('rejects too many ids', async () => {
    const tooMany = Array.from({ length: 5001 }, (_, i) => `id-${i}`)
    const res = (await handler(
      makeEvent('user-1', { visitedLocationIds: tooMany }),
    )) as { statusCode: number }
    expect(res.statusCode).toBe(400)
  })

  it('rejects ids of wrong type or length', async () => {
    const res1 = (await handler(
      makeEvent('user-1', { visitedLocationIds: [123] }),
    )) as { statusCode: number }
    expect(res1.statusCode).toBe(400)

    const res2 = (await handler(
      makeEvent('user-1', { visitedLocationIds: ['x'.repeat(201)] }),
    )) as { statusCode: number }
    expect(res2.statusCode).toBe(400)
  })
})
