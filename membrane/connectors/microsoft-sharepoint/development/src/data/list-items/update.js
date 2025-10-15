export default async function update({
  apiClient,
  parameters: { site_id, list_id },
  id,
  fields,
}) {
  const response = await apiClient.patch(
    `/sites/${site_id}/lists/${list_id}/items/${id}`,
    fields,
  )

  return { id: response?.id }
}
