export default async function search({
  apiClient,
  parameters: { itemType },
  query,
}) {
  const response = await apiClient.post('/search/query', {
    requests: [
      {
        entityTypes: ['driveItem'],
        query: {
          queryString: query,
        },
      },
    ],
  })

  const hits = response.value?.[0]?.hitsContainers?.[0]?.hits || []
  const records = hits.map((hit) => hit.resource)

  return {
    records: itemType ? records.filter((item) => item[itemType]) : records,
  }
}
