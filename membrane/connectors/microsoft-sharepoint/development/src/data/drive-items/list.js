import { getAllSites } from 'common'

export default async function list({
  apiClient,
  cursor,
  filter,
  parameters: { site_id, drive_id, folderId, itemType, recursive },
}) {
  const driveItemType = filter?.itemType || itemType
  const folder_id = filter?.folderId || folderId

  if (filter?.globalFolderId) {
    return handleGlobalFolderId({
      apiClient,
      filter,
      driveItemType,
      itemType,
      recursive,
    })
  }

  if (!site_id) {
    const sites = await getAllSites(apiClient)
    return {
      drilldowns: sites.map((site) => ({
        parameters: { site_id: site.id, recursive },
        filter: {
          ...filter,
          itemType,
          globalFolderId: filter?.globalFolderId,
        },
      })),
    }
  }

  if (!drive_id) {
    const drives = await getDrives(apiClient, site_id)
    return {
      drilldowns: drives.map((drive) => ({
        parameters: { site_id, drive_id: drive.id, recursive },
        filter: {
          ...filter,
          itemType,
          globalFolderId: filter?.globalFolderId,
        },
      })),
    }
  }

  const response = await apiClient.get(
    cursor ||
      `/sites/${site_id}/drives/${drive_id}/items/${
        folder_id || 'root'
      }/children?$top=100`,
  )

  const records = driveItemType
    ? response.value?.filter((item) => item[driveItemType])
    : response.value

  // Remove a reference to the parent folder if folder_id was not provided -> this is to help with the navigation in the UI
  records.forEach((item) => {
    if (item.parentReference?.id && !folder_id) {
      delete item.parentReference.id
    }
  })

  const drilldowns = generateDrilldowns({
    items: response.value,
    site_id,
    drive_id,
    itemType,
    recursive,
    filter,
  })

  return {
    records,
    cursor: response['@odata.nextLink'],
    drilldowns: recursive ? drilldowns : undefined,
  }
}

function generateDrilldowns({
  items,
  site_id,
  drive_id,
  itemType,
  recursive,
  filter,
}) {
  return items
    .filter((item) => item.folder)
    .map((item) => ({
      parameters: {
        site_id,
        drive_id,
        folderId: item.id,
        itemType,
        recursive,
      },
      filter: {
        ...filter,
        folderId: item.id,
        itemType,
        globalFolderId: filter?.globalFolderId,
      },
    }))
}

async function handleGlobalFolderId({
  apiClient,
  filter,
  driveItemType,
  itemType,
  recursive,
}) {
  const { fileId, driveId, siteId } = JSON.parse(filter.globalFolderId)
  const response = await apiClient.get(
    `/sites/${siteId}/drives/${driveId}/items/${fileId}/children?$top=100`,
  )

  const records = driveItemType
    ? response.value?.filter((item) => item[driveItemType])
    : response.value

  const drilldowns = generateDrilldowns({
    items: response.value,
    site_id: siteId,
    drive_id: driveId,
    itemType,
    recursive,
    filter,
  })

  return {
    records,
    cursor: response['@odata.nextLink'],
    drilldowns,
  }
}

async function getDrives(apiClient, site_id) {
  const response = await apiClient.get(`/sites/${site_id || 'root'}/drives`)
  return response?.value
}
