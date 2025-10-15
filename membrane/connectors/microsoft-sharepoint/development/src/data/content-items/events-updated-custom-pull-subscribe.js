import { getSiteDrives, getAllSites } from 'common'

export default async function customPullSubscribe({
  apiClient,
  currentParameters,
}) {
  let site_ids = []

  if (currentParameters?.site_id) {
    site_ids = [currentParameters?.site_id]
  } else {
    const sites = await getAllSites(apiClient)
    site_ids = sites.map((site) => site.id)
  }

  const subscriptions = {}

  for (const site_id of site_ids) {
    const siteDrives = await getSiteDrives(apiClient, site_id)

    for (const drive of siteDrives) {
      const response = await apiClient.get(
        `sites/${site_id}/drives/${drive.id}/root/delta?token=latest`,
      )
      // saving the delta link and the latest check time for each drive instead of the site
      subscriptions[drive.id] = {
        deltaLink: response['@odata.deltaLink'],
        latestCheckTime: new Date().toISOString(),
      }
    }
  }

  return subscriptions
}
