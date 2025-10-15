export default async function getEventSelector({ apiClient }) {
  const response = await apiClient.get('users/me')
  return {
    globalWebhookKey: 'all-events',
    globalWebhookEventSelector: `user_id:${response?.id}`,
  }
}
