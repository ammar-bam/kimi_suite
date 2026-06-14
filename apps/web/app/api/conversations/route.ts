import { ok } from "../_lib/response";

export async function GET() {
  return ok([]);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { title?: string };

  return ok({
    id: crypto.randomUUID(),
    title: body.title ?? "New conversation",
    createdAt: new Date().toISOString()
  });
}
