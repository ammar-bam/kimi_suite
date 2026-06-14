import { fail, ok } from "../_lib/response";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    topic?: string;
    slides?: number;
    template?: string;
    language?: string;
  };

  if (!body.topic || !body.slides || !body.template || !body.language) {
    return fail("BAD_INPUT", "topic, slides, template, and language are required", { status: 400 });
  }

  return ok({ jobId: crypto.randomUUID(), status: "queued" });
}
