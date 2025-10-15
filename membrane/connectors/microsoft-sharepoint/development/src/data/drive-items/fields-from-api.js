export default function fieldsFromApi({ fields }) {
  if (fields.parentReference) {
    const itemIsInRoot = fields.parentReference.path === '/drive/root:'
    fields.folderId = itemIsInRoot ? undefined : fields.parentReference.id
  }

  if (fields.file) {
    fields.itemType = 'file'
  }
  if (fields.folder) {
    fields.itemType = 'folder'
  }
  return {
    ...fields,
    globalId: constructId({ fields }),
    globalFolderId: constructFolderId({ fields: fields.parentReference }),
  }
}

function constructId({ fields }) {
  const { siteId, driveId } = fields.parentReference
  const idObject = {
    fileId: fields.id,
    siteId: siteId,
    driveId: driveId,
  }

  return JSON.stringify(idObject)
}

function constructFolderId({ fields }) {
  const { id, siteId, driveId } = fields
  const idObject = {
    fileId: id ?? 'root',
    siteId: siteId,
    driveId: driveId,
  }

  return JSON.stringify(idObject)
}
