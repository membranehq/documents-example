import { BadRequestError } from '@integration-app/sdk'

export default async function create({
  apiClient,
  fields,
  parameters: { site_id, folderId },
}) {
  /*
  Uploads a file to the specified drive/folder
  The contents of the request body should be the binary stream of the file to be uploaded.
  If folderId is not provided, the file will be uploaded to the root of the drive.
  */
  if (!fields?.content || !fields?.name) {
    throw new BadRequestError(
      'You should provide content and name fields to create a file.',
    )
  }
  const normalizedFileName = encodeURIComponent(
    fields.name.replace(/[\/\\|:;*`~^]/g, '').trim(),
  )
  const response = await apiClient.put(
    `/sites/${site_id}/drive/items/${
      folderId ?? 'root'
    }:/${normalizedFileName}:/content`,
    fields.content,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  )

  return {
    id: response.id,
  }
}
