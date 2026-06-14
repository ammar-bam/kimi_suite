type Params = { params: Promise<{ docId: string }> };

export async function POST(_: Request, { params }: Params) {
  const { docId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`event: progress\ndata: ${JSON.stringify({ docId, stage: "retrieve" })}\n\n`);
      controller.enqueue(
        `event: done\ndata: ${JSON.stringify({
          docId,
          answer: "Scaffold response: implement retrieval and streaming answer here.",
          citations: []
        })}\n\n`
      );
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
