export default async function list({ apiClient, cursor, filter }) {
  if (!filter) {
    const response = await apiClient.get(cursor ?? 'users?$top=100')

    return {
      records: response?.value,
      cursor: response['@odata.nextLink'],
    }
  }
  const filterQuery = Object.keys(filter)
    .map((field) => `"${field}:${filter[field]}"`)
    .join(' AND ')
  const response = await apiClient.get(
    cursor ? cursor + '$search=' + filterQuery : 'users?$search=' + filterQuery,
    {},
    { headers: { ConsistencyLevel: 'eventual' } },
  )

  return {
    records: response.value,
    cursor: response['@odata.nextLink'],
  }
}
