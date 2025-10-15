export default async function findById({ apiClient, id, parameters }) {
  const response = await apiClient.get(`${parameters.entityName}/${id}`)

  return {
    record: response,
  }
}
