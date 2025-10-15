export default async function list({
  apiClient,
  cursor,
  filter,
  parameters: { site_id, drive_id, parent_folder_id },
}) {
  const response = await apiClient.get(
    cursor ??
      `/sites/${site_id}/drives/${drive_id}/items/${
        filter?.parent_folder_id ?? parent_folder_id ?? 'root'
      }/children?$top=100`,
  )
  const drilldowns = response.value
    .filter((item) => item.folder)
    .map((item) => ({
      parameters: { site_id, drive_id, parent_folder_id: item.id },
      filter: {
        parent_folder_id: item.id,
      },
    }))

  return {
    records: response.value.filter((item) => item.folder !== undefined),
    cursor: response['@odata.nextLink'],
    drilldowns,
  }
}
