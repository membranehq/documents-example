export default function fieldsFromApi({ fields }) {
  const newFields = { ...fields }

  if (fields.file) {
    newFields.itemType = 'file'
  }
  if (fields.folder) {
    newFields.itemType = 'folder'
  }

  /**
   * Inside `list`, we added metadata to the fields object to help us identify the type of item we are dealing with.
   */
  if (fields?.__itemType) {
    newFields.itemType = fields.__itemType
    delete newFields.__itemType
  }

  if (fields?.__folderId) {
    newFields.folderId = fields.__folderId
    delete newFields.__folderId
  }

  return {
    ...newFields,
    globalId: constructId(newFields.itemType, { fields: newFields }),
    ...(newFields.itemType &&
    ['folder', 'file', 'drive'].includes(newFields.itemType)
      ? {
          globalFolderId: constructFolderId(newFields.itemType, {
            fields: newFields,
          }),
        }
      : {}),
  }
}

function constructId(itemType, { fields }) {
  let idObject

  if (itemType === 'site') {
    idObject = {
      siteId: fields.id,
    }
  }

  if (itemType === 'drive') {
    idObject = {
      id: 'root',
      siteId: fields.parentReference.id,
      driveId: fields.id,
    }
  }

  if (itemType === 'file' || itemType === 'folder') {
    idObject = {
      fileId: fields.id,
      siteId: fields.parentReference.siteId,
      driveId: fields.parentReference.driveId,
    }
  }

  return JSON.stringify(idObject)
}

function constructFolderId(itemType, { fields }) {
  let idObject

  if (itemType === 'site') {
    throw new Error('Site is in Root and should not have a globalFolderId')
  }

  if (itemType === 'drive') {
    idObject = {
      siteId: fields.parentReference.id,
    }
  }

  if (itemType === 'file' || itemType === 'folder') {
    if (fields.parentReference?.path?.endsWith('/root:')) {
      idObject = {
        id: 'root',
        siteId: fields.parentReference.siteId,
        driveId: fields.parentReference.driveId,
      }
    } else {
      idObject = {
        fileId: fields.parentReference.id,
        siteId: fields.parentReference.siteId,
        driveId: fields.parentReference.driveId,
      }
    }
  }

  return JSON.stringify(idObject)
}
