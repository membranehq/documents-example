export default async function handle({ data }) {
  return {
    events: [
      {
        payload: data,
        selector: `user_id:${data.from_user_id}`,
      },
    ],
  }
}
