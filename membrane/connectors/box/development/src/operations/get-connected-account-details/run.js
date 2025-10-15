export default async function getConnectedAccountDetails({ apiClient }) {
  const rawFields = await apiClient.get('users/me')
  const { name, login } = rawFields
  return { name, email: login, rawFields }
}
