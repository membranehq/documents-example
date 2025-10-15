export default async function getConnectedAccountDetails({ apiClient }) {
  const rawFields = await apiClient.get('me')
  const { displayName, mail } = rawFields
  return { name: displayName, email: mail, rawFields }
}
