export default async function findById({
  apiClient,
  id,
  parameters: { site_id, drive_id },
}) {
  const { fileId, siteId, driveId } = JSON.parse(id) // record Id is a JSON string (see record-from-fields.map.yml and fields-from-api.js)
  const response = await apiClient.get(
    `/sites/${site_id ?? siteId}/drives/${drive_id ?? driveId}/items/${fileId}`,
  )

  return {
    record: response,
  }
}
