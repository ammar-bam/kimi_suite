import { modelForFeature } from "@kimi/config";

type Params = { params: Promise<{ docId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { docId } = await params;
  const body = (await req.json().catch(() => ({}))) as { model?: string };
  const model = modelForFeature("summarize", body.model);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`event: progress\ndata: ${JSON.stringify({ docId, model, stage: "retrieve" })}\n\n`);
      controller.enqueue(
        `event: done\ndata: ${JSON.stringify({
          docId,
          model,
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
