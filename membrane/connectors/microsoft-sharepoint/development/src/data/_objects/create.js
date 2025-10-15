export default async function create({ apiClient, parameters: { path }, fields }) {
  const response = await apiClient.post(path, fields)

  return {
    id: response.id,
  }
}
