export default function fieldsFromApi({ fields }) {
  if (fields.parent) {
    fields.folder_id =
      fields.parent.id === '0'
        ? undefined
        : constructItemId({
            id: fields.parent.id,
            type: 'folder',
          })
  }

  fields.id = constructItemId({
    id: fields.id,
    type: fields.type,
  })

  return fields
}

function constructItemId(fields) {
  const { id, type } = fields
  return JSON.stringify({ id, type })
}
