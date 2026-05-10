import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

process.env.TABLE_NAME = 'test-table'

const ddbMock = mockClient(DynamoDBDocumentClient)

const { handler } = await import('./index')

function makeEvent(sub: string) {
  return {
    requestContext: { authorizer: { jwt: { claims: { sub } } } },
  } as never
}

beforeEach(() => {
  ddbMock.reset()
})

describe('get-visits handler', () => {
  it('returns visited ids for the user', async () => {
    ddbMock.on(GetCommand).resolves({ Item: { visitedLocationIds: ['a', 'b'] } })
    const res = (await handler(makeEvent('user-1'))) as { statusCode: number; body: string }
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ visitedLocationIds: ['a', 'b'] })
  })

  it('returns an empty list when the user has no record', async () => {
    ddbMock.on(GetCommand).resolves({})
    const res = (await handler(makeEvent('user-1'))) as { statusCode: number; body: string }
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ visitedLocationIds: [] })
  })

  it('keys the lookup by USER#<sub>', async () => {
    ddbMock.on(GetCommand).resolves({ Item: { visitedLocationIds: [] } })
    await handler(makeEvent('abc-123'))
    const calls = ddbMock.commandCalls(GetCommand)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.args[0].input).toEqual({
      TableName: 'test-table',
      Key: { pk: 'USER#abc-123' },
    })
  })
})
