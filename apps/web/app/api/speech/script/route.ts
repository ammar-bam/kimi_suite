import { modelForFeature } from "@kimi/config";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { model?: string };
  const model = modelForFeature("speech-script", body.model);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`event: meta\ndata: ${JSON.stringify({ model })}\n\n`);
      controller.enqueue("data: This is a starter script stream from KimiAI Suite.\n\n");
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
