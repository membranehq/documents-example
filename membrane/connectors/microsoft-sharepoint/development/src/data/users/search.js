export default async function search({ apiClient, cursor, query }) {
  const USER_SEARCHABLE_FIELDS = [
    'userPrincipalName',
    'surname',
    'mailNickname',
    'mail',
    'givenName',
    'displayName',
  ]

  const filterQuery = USER_SEARCHABLE_FIELDS.map(
    (field) => `"${field}:${query}"`,
  ).join(' OR ')
  const response = await apiClient.get(
    cursor
      ? cursor + '$search=' + filterQuery
      : 'users' + '?' + '$search=' + filterQuery,
    {},
    { headers: { ConsistencyLevel: 'eventual' } },
  )

  return {
    records: response.value,
    cursor: response['@odata.nextLink'],
  }
}
