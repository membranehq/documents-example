import { generateFilterQuery } from 'common'

export default async function match({
  apiClient,
  query,
  parameters: { path },
}) {
  const filter = generateFilterQuery(query)
  const res = await apiClient.get(path, filter)

  return {
    record: res.value?.[0],
  }
}

