import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.TABLE_NAME!

const MAX_LOCATIONS = 5_000

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  const sub = event.requestContext.authorizer.jwt.claims.sub as string

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: 'invalid json' }
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as { visitedLocationIds?: unknown }).visitedLocationIds)
  ) {
    return { statusCode: 400, body: 'visitedLocationIds must be an array' }
  }

  const ids = (body as { visitedLocationIds: unknown[] }).visitedLocationIds
  if (ids.length > MAX_LOCATIONS) {
    return { statusCode: 400, body: 'too many locations' }
  }
  if (!ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200)) {
    return { statusCode: 400, body: 'invalid id in list' }
  }
  const unique = Array.from(new Set(ids as string[]))

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: `USER#${sub}`,
        visitedLocationIds: unique,
        updatedAt: new Date().toISOString(),
      },
    }),
  )

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ visitedLocationIds: unique }),
  }
}
