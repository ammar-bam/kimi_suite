export async function POST(_: Request) {
  const stream = new ReadableStream({
    start(controller) {
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
