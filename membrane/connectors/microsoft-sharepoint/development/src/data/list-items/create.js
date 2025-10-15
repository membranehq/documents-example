export default async function create({
  apiClient,
  parameters: { site_id, list_id },
  fields,
}) {
  const response = await apiClient.post(
    `/sites/${site_id}/lists/${list_id}/items`,
    {
      fields: fields?.fields,
    },
  )

  return {
    id: response.id,
  }
}
