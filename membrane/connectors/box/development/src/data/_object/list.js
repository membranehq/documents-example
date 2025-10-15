const LIMIT = 100

export default async function list({ apiClient, cursor, parameters }) {
  const offset = cursor ? Number(cursor) : '0'

  const response = await apiClient.get(parameters.entityName, {
    limit: LIMIT,
    offset,
  })
  let nextCursor
  if (response.entries.length === LIMIT) {
    nextCursor = cursor ? Number(cursor) + LIMIT : LIMIT
  }

  return {
    records: response.entries,
    cursor: nextCursor,
  }
}
