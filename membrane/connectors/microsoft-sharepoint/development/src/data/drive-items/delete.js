export default async function del({
  apiClient,
  id,
  parameters: { site_id, drive_id },
}) {
  const { fileId, siteId, driveId } = JSON.parse(id) // record Id is a JSON string (see record-from-fields.map.yml and fields-from-api.js)
  await apiClient.delete(
    `/sites/${site_id ?? siteId}/drives/${drive_id ?? driveId}/items/${fileId}`,
  )
}
