export default async function list({ apiClient, cursor }) {
  const response = await apiClient.get(cursor ?? '/sites?$top=100&search=*')

  return {
    records: response.value,
    cursor: response['@odata.nextLink'],
  }
}
