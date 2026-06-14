export async function ttsJob(payload: Record<string, unknown>) {
  // TODO: chunk script, call ElevenLabs provider, merge audio, upload to object storage.
  return {
    status: "done",
    artifactKey: "speech/mock-audio.mp3",
    payload
  };
}
