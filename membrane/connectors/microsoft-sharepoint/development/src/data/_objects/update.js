export default async function update({ apiClient, id, fields, parameters: { path } }) {
  await apiClient.patch(`${path}/${id}`, fields)

  return { id }
}
