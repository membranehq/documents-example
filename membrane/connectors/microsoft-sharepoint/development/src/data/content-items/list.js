import { getAllSites, getSiteDrives } from 'common'

export default async function list(params) {
  const { apiClient, cursor, filter, parameters } = params
  const driveItemType = filter?.itemType || parameters?.itemType // filter field should take precedence

  const parsedId = filter?.globalFolderId
    ? JSON.parse(filter?.globalFolderId)
    : {}

  const site_id = parameters?.site_id || parsedId?.siteId
  const drive_id = parameters?.drive_id || parsedId?.driveId
  const folder_id = parameters?.folderId || parsedId?.id || parsedId?.fileId
  const recursive =
    parameters?.recursive === undefined ? true : parameters?.recursive

  if (!site_id && !drive_id && !folder_id) {
    return handleSites({ apiClient, filter, recursive, driveItemType })
  }

  if (site_id && !drive_id && !folder_id) {
    return handleDrives({
      apiClient,
      site_id,
      filter,
      recursive,
      driveItemType
    })
  }

  return handleDefault({
    apiClient,
    site_id,
    drive_id,
    folder_id,
    driveItemType,
    itemType: parameters?.itemType,
    filter,
    cursor,
    recursive,
  })
}

async function handleSites({ apiClient, filter, recursive }) {
  const sites = await getAllSites(apiClient)
  const records = sites.map((site) => {
    const { id, ...rest } = site
    return { ...rest, id: id.split(',')[1], __itemType: 'site' }
  })

  if (!recursive) {
    return {
      records,
    }
  }

  const drilldowns = sites.map((site) => ({
    parameters: { site_id: site.id },
    filter,
  }))

  return { records, drilldowns }
}

async function handleDrives({ apiClient, site_id, filter, recursive }) {
  const drives = await getSiteDrives(apiClient, site_id)

  // in some cases site_id would have a comma, if it does, the second part is the site id
  const siteId = site_id.split(',')[1] ? site_id.split(',')[1] : site_id

  const records = drives.map((drive) => ({
    ...drive,
    parentReference: { id: siteId },
    __folderId: siteId,
    __itemType: 'drive',
  }))

  if (!recursive) {
    return {
      records,
    }
  }

  const drilldowns = drives.map((drive) => ({
    parameters: { site_id, drive_id: drive.id },
    filter,
  }))

  return { records, drilldowns }
}

async function handleDefault({
  apiClient,
  site_id,
  drive_id,
  folder_id,
  driveItemType,
  itemType,
  cursor,
  recursive,
}) {
  const response = await apiClient.get(
    cursor ||
      `/sites/${site_id}/drives/${drive_id}/items/${
        folder_id || 'root'
      }/children?$top=100`,
  )
  const records = driveItemType
    ? response?.value?.filter((item) => item[driveItemType])
    : response?.value

  const drilldowns = response?.value
    ?.filter((item) => item.folder)
    .map((item) => ({
      parameters: { site_id, drive_id, folderId: item.id, itemType },
    }))
  return {
    records: records?.map((record) => ({
      ...record,
      __folderId: record.parentReference?.id,
    })),
    cursor: response['@odata.nextLink'],
    drilldowns: recursive ? drilldowns: undefined,
  }
}
