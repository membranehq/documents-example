export async function subscribeToWebhook(
  apiClient,
  type,
  id,
  triggers,
  connectorWebhookUri,
) {
  const response = await apiClient.post('webhooks', {
    address: connectorWebhookUri,
    target: {
      id,
      type,
    },
    triggers,
  })

  return { webhookId: response?.id }
}
