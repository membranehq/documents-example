export default async function downloadFile({
  apiClient,
  input,
  engineApiClient,
}) {
  const path = `/files/${input.fileId}/content`

  const fileResponse = await apiClient.makeApiRequest({
    path,
    method: 'get',
    responseType: 'stream',
    returnFullResponse: true,
  })

  const response = await engineApiClient.post('/files', fileResponse.data, {
    headers: {
      'Content-Length': fileResponse.headers['content-length'],
      'Content-Type': fileResponse.headers['content-type'],
    },
    // Without this, we load the whole file into memory (which can be several GB).
    // https://github.com/axios/axios/issues/1045
    maxRedirects: 0,
  })
  return {
    downloadUri: response.downloadUri,
  }
}
