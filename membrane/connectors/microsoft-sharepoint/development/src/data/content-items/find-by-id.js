export default async function findById({ apiClient, id }) {
  /**
   * The id passed here could be the globalId of a site , drive, or file
   * e.g:
   * site -  {siteId: 'siteId'}
   * drive - {id:"root", siteId: 'siteId', driveId: 'driveId'}
   * file/folder - {siteId: 'siteId', driveId: 'driveId', fileId: 'fileId'}
   */
  const parsedId = JSON.parse(id)
  let response

  // Handle site fetch
  if (parsedId.siteId && !parsedId.driveId && !parsedId.fileId) {
    response = await apiClient.get(`/sites/${parsedId.siteId}`)
  }
  // Handle drive fetch
  else if (parsedId.siteId && parsedId.driveId && !parsedId.fileId) {
    response = await apiClient.get(
      `/sites/${parsedId.siteId}/drives/${parsedId.driveId}`,
    )
  }
  // Handle file/folder fetch
  else if (parsedId.siteId && parsedId.driveId && parsedId.fileId) {
    response = await apiClient.get(
      `/sites/${parsedId.siteId}/drives/${parsedId.driveId}/items/${parsedId.fileId}`,
    )
  } else {
    throw new Error('Invalid ID structure provided')
  }

  return {
    record: response,
  }
}
