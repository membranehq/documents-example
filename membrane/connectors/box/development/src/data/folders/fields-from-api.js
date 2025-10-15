export default function fieldsFromApi({ fields }) {
  if (fields.parent) {
    const itemIsInRoot = fields?.parent?.id === '0'

    if (!itemIsInRoot) {
      fields.parent_folder_id = fields.parent.id
    }
  }
  return fields
}
