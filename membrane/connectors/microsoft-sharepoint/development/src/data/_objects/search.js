export default async function search({
  apiClient,
  query,
  parameters: { path },
  cursor,
}) {
  const response = await apiClient.get(cursor ?? `${path}?$top=100`, {
    search: query,
  })

  return {
    records: response.value,
    cursor: response['@odata.nextLink'],
  }
}
