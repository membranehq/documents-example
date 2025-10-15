export default async function customPullCollectEvents({
  apiClient,
  state,
  parameters: { itemType },
}) {
  const records = []
  const events = []
  const subscriptionsState = {}
  let cursor = false

  for (const resource in state) {
    const { deltaLink } = state[resource]
    while (true) {
      const response = await apiClient.get(`${cursor || deltaLink}`)
      response.value.forEach((item) => {
        if (
          (!itemType || item[itemType]) && // if itemType is not provided, we will collect both files and folders events
          !item.root &&
          item.deleted?.state !== 'deleted' &&
          item.lastModifiedDateTime !== item.createdDateTime
        ) {
          records.push(item)
        }
      })

      if (response['@odata.deltaLink']) {
        subscriptionsState[resource] = {
          deltaLink: response['@odata.deltaLink'],
          latestCheckTime: new Date().toISOString(),
        }
        break
      } else {
        cursor = response['@odata.nextLink']
      }
    }
  }
  records.forEach((driveItem) => {
    events.push({
      type: 'updated',
      record: driveItem,
    })
  })
  events.sort((a, b) => {
    return (
      new Date(a.record.lastModifiedDateTime) -
      new Date(b.record.lastModifiedDateTime)
    )
  })

  return {
    events,
    state: subscriptionsState,
  }
}
