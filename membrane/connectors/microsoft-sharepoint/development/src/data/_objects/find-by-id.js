export default async function findById({ apiClient, parameters, id }) {
  const response = await apiClient.get(`${parameters.path}/${id}`)

  return {
    record: response,
  }
}
