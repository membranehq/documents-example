export default async function create({ apiClient, fields, parameters }) {
  const response = await apiClient.post(`${parameters.entityName}`, fields)

  return {
    id: response.id,
  }
}
