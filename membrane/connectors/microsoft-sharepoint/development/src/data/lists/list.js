export default async function list({ apiClient, cursor, parameters: { site_id } }) {
  const response = await apiClient.get(cursor ?? `sites/${site_id ?? 'root'}/lists?$top=100`)

  return {
    records: response.value,
    cursor: response['@odata.nextLink'],
  }
}
