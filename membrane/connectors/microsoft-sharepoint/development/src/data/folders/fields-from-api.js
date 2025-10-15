export default function fieldsFromApi({ fields }) {
  if (fields.parentReference) {
    const itemIsInRoot = fields.parentReference.path === '/drive/root:'
    fields.parent_folder_id = itemIsInRoot
      ? undefined
      : fields.parentReference.id
  }
  return fields
}
