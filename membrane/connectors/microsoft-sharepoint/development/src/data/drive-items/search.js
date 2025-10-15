export default async function search({
  apiClient,
  parameters: { drive_id, site_id, itemType },
  query,
  cursor,
}) {
  const response = await apiClient.get(
    cursor ??
      `/sites/${site_id}/drives/${drive_id}/root/search(q='${query}')?$top=100`,
  )

  return {
    records: itemType
      ? response.value.filter((item) => item[itemType])
      : response.value,
    cursor: response['@odata.nextLink'],
  }
}
