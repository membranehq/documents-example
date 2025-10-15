export default async function del({ apiClient, id, parameters }) {
  await apiClient.delete(`${parameters.entityName}/${id}`)
}
