export default async function list({
  apiClient,
  cursor,
  filter,
  requestedLocation,
}) {
  const fields = Object.keys(
    requestedLocation.fieldsSchema?.properties ?? {},
  ).join(',')
  const response = await apiClient.get(
    `/folders/${filter?.parent_folder_id ?? 0}/items`,
    {
      ...(fields ? { fields } : {}),
      usemarker: true,
      limit: 100,
      marker: cursor,
    },
  )
  const drilldowns = response.entries
    .filter((entry) => entry.type === 'folder')
    .map((entry) => ({
      filter: {
        parent_folder_id: entry.id,
      },
    }))

  return {
    records: response.entries.filter((entry) => entry.type === 'folder'),
    cursor: response.next_marker,
    drilldowns,
  }
}
