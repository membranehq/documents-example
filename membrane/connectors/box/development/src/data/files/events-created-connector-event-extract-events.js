export default function extractEvents({ payloads }) {
  const events = []

  for (const payload of payloads) {
    if (
      (payload.event_type === 'created' || payload.event_type === 'uploaded') &&
      payload.item_type === 'file'
    ) {
      events.push({
        type: 'created',
        record: {
          id: payload.item_id ?? payload.new_item_id,
        },
      })
    }
  }

  return { events }
}
