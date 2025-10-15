export function generateFilterQuery(filter) {
  if (!filter) {
    return {}
  }
  // the output of this function should be something like this: { $filter: key eq 'value' and key2 eq 'value2' }
  if (Object.keys(filter).length == 1) {
    const queryKey = Object.keys(filter)[0]
    return { $filter: `${queryKey} eq '${Object.values(filter)[0]}'` }
  }
  const filterQuery = Object.entries(filter)
    .map(([key, value]) => `${key} eq '${value}'`)
    .join(' and ')
  return { $filter: filterQuery }
}

export async function getAllSites(apiClient) {
  const response = await apiClient.get('/sites?search=*')
  return response?.value
}

export async function getSiteDrives(apiClient, siteId) {
  let drives = []

  try {
    const drivesResponse = await apiClient.get(
      `sites/${siteId || 'root'}/drives`,
    )
    drives = drivesResponse.value
  } catch (e) {
    // SharePoint returns 403 if the site can't be accessed
    if (e.data?.data?.response?.status === 403) {
      console.error(`Unable to access site:${siteId}`)
    } else {
      throw e
    }
  }

  return drives
}
