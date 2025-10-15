export default async function customFieldsSchema({
  apiClient,
  parameters: { site_id, list_id },
}) {
  // Fetch the list's columns/fields
  const response = await apiClient.get(
    `/sites/${site_id}/lists/${list_id}/columns`,
  )

  const schema = {
    type: 'object',
    properties: {
      fields: {
        type: 'object',
        properties: {},
      },
    },
  }

  if (Array.isArray(response.value)) {
    for (const field of response.value) {
      // Skip system fields
      if (field.readOnly) continue

      schema.properties.fields.properties[field.name] = {
        title: field.displayName,
        description: field.description,
        ...getFieldSchemaProps(field),
      }
    }
  }

  return schema
}

function getFieldSchemaProps(field) {
  switch (field.columnGroup) {
    case 'Number':
      return {
        type: 'number',
      }
    case 'DateTime':
      return {
        type: 'string',
        format: 'date-time',
      }
    case 'Boolean':
      return {
        type: 'boolean',
      }
    case 'Choice':
      return {
        type: 'string',
        enum: field.choice?.choices || [],
      }
    case 'MultiChoice':
      return {
        type: 'array',
        items: {
          type: 'string',
          enum: field.choice?.choices || [],
        },
      }
    case 'User':
      return {
        type: 'object',
        properties: {
          email: { type: 'string' },
          id: { type: 'string' },
          displayName: { type: 'string' },
        },
      }
    case 'Person':
      return {
        type: 'object',
        properties: {
          email: { type: 'string' },
          id: { type: 'string' },
          displayName: { type: 'string' },
        },
      }
    case 'Lookup':
      return {
        type: 'string',
        referenceCollection: {
          key: 'list-items',
        },
      }
    default:
      return {
        type: 'string',
      }
  }
}
