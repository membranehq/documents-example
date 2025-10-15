export default async function findById({ apiClient, id }) {
  const { id, type } = JSON.parse(id)
  const response = await apiClient.get(
    `${type === 'folder' ? 'folders' : 'files'}/${id}`,
  )

  return {
    record: response,
  }
}
