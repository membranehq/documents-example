export default async function update({ apiClient, id, fields, parameters }) {
  const response = await apiClient.put(`${parameters.entityName}/${id}`, fields)

  return {
    id: response.id,
  }
}
