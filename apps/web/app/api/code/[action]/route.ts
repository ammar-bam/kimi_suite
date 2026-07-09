import { fail, ok } from "../../_lib/response";
import { modelForFeature } from "@kimi/config";

type Params = { params: Promise<{ action: string }> };

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  const body = (await req.json()) as { code?: string; language?: string; instruction?: string; model?: string };

  if (!body.code || !body.language) {
    return fail("BAD_INPUT", "code and language are required", { status: 400 });
  }

  return ok({
    action,
    model: modelForFeature("code", body.model),
    language: body.language,
    result: `Scaffold action '${action}' executed.`,
    instruction: body.instruction ?? null
  });
}
