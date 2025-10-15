const LIMIT = 100

export default async function search({ apiClient, query, parameters, cursor }) {
  const offset = cursor ? Number(cursor) : '0'
  const q = {
    query: query,
    type: parameters.entityType,
    limit: LIMIT,
    offset,
  }

  const response = await apiClient.get('search', q)
  let nextCursor
  if (response.entries.length === LIMIT) {
    nextCursor = cursor ? Number(cursor) + LIMIT : LIMIT
  }

  return {
    records: response.entries,
    cursor: nextCursor,
  }
}
