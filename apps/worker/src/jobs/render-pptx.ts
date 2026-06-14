export async function renderPptxJob(payload: Record<string, unknown>) {
  // TODO: call KIMI in JSON mode and render with PptxGenJS.
  return {
    status: "done",
    artifactKey: "slides/mock-deck.pptx",
    payload
  };
}
