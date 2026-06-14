export async function embedJob(payload: Record<string, unknown>) {
  // TODO: extract text, chunk, embed, and upsert vectors to pgvector.
  return {
    status: "done",
    chunks: 0,
    payload
  };
}
