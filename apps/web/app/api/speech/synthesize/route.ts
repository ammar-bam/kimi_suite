import { fail, ok } from "../../_lib/response";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    script?: string;
    voiceId?: string;
    format?: "mp3" | "wav";
  };

  if (!body.script || !body.voiceId || !body.format) {
    return fail("BAD_INPUT", "script, voiceId and format are required", { status: 400 });
  }

  return ok({ jobId: crypto.randomUUID(), status: "queued" });
}
