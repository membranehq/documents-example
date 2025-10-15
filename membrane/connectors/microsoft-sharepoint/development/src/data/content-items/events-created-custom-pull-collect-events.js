export default async function customPullCollectEvents({
  apiClient,
  state,
  parameters: { itemType },
}) {
  const records = []
  const events = []
  const subscriptionsState = {}

  for (const resource in state) {
    // the resource is either a driveId or a siteId
    const { deltaLink, latestCheckTime } = state[resource]
    let cursor = false
    while (true) {
      const response = await apiClient.get(`${cursor || deltaLink}`)
      response.value.forEach((item) => {
        if (
          (!itemType || item[itemType]) && // if itemType is not provided, we will collect both files and folders events
          !item.root &&
          item.deleted?.state !== 'deleted' &&
          item.createdDateTime >= latestCheckTime
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
  records.forEach((contentItem) => {
    events.push({
      type: 'created',
      record: contentItem,
    })
  })
  events.sort((a, b) => {
    return (
      new Date(a.record.createdDateTime) - new Date(b.record.createdDateTime)
    )
  })
  return {
    events,
    state: subscriptionsState,
  }
}
