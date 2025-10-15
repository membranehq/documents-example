import { generateFilterQuery } from 'common'

export default async function match({
  apiClient,
  query,
  parameters: { site_id, drive_id },
}) {
  const filter = generateFilterQuery(query)
  const res = await apiClient.get(
    `/sites/${site_id}/drives/${drive_id}/items/root/children`,
    filter,
  )

  return {
    record: res.value?.[0],
  }
}
