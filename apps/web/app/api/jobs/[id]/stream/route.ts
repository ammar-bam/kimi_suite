type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`event: progress\ndata: ${JSON.stringify({ jobId: id, stage: "queued", percent: 10 })}\n\n`);
      controller.enqueue(`event: progress\ndata: ${JSON.stringify({ jobId: id, stage: "render", percent: 62 })}\n\n`);
      controller.enqueue(`event: done\ndata: ${JSON.stringify({ jobId: id, url: null })}\n\n`);
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache"
    }
  });
}
