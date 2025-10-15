export default async function findById({
  apiClient,
  parameters: { site_id, list_id },
  id,
}) {
  const response = await apiClient.get(
    `/sites/${site_id}/lists/${list_id}/items/${id}`,
  )

  return {
    record: response,
  }
}
