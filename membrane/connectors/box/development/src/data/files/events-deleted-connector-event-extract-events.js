export default function extractEvents({ payloads }) {
  const events = []

  for (const payload of payloads) {
    if (payload.event_type === 'deleted' && payload.item_type === 'file') {
      events.push({
        type: 'deleted',
        record: { id: payload.item_id },
      })
    }
  }

  return { events }
}
