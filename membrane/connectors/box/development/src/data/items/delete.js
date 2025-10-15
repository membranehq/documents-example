export default async function del({ apiClient, id, parameters }) {
  const entityName = parameters?.type ? parameters.type + 's' : undefined
  if (entityName) {
    await apiClient.delete(`${entityName}/${id}`)
  } else {
    try {
      await apiClient.delete(`files/${id}`)
    } catch (error) {
      await apiClient.delete(`folders/${id}`)
    }
  }
}
