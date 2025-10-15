export default async function list({
  apiClient,
  cursor,
  filter,
  parameters: { type, recursive = true },
  requestedLocation,
}) {
  const itemType = filter?.type ?? type // filter field should take precedence
  const fields = Object.keys(
    requestedLocation.fieldsSchema?.properties ?? {},
  ).join(',')
  const { id: folderIdfilter, type } = JSON.parse(filter?.folder_id || '{}')

  const response = await apiClient.get(
    `/folders/${folderIdfilter ?? 0}/items`,
    {
      ...(fields ? { fields } : {}),
      usemarker: true,
      limit: 100,
      marker: cursor,
    },
  )

  const records = itemType
    ? response.entries.filter((entry) => entry.type === itemType)
    : response.entries

  const base = {
    records,
    cursor: response.next_marker,
  }

  if (recursive) {
    const drilldowns = response.entries
      .filter((entry) => entry.type === 'folder')
      .map((entry) => ({
        parameters: { type, recursive },
        filter: {
          folder_id: constructItemId({
            id: entry.id,
            type: filter?.type,
          }),
        },
      }))

    return {
      ...base,
      drilldowns,
    }
  } else {
    return base
  }
}

function constructItemId(fields) {
  const { id, type } = fields
  return JSON.stringify({ id, type })
}
