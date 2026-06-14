import { fail, ok } from "../../_lib/response";

type Params = { params: Promise<{ action: string }> };

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  const body = (await req.json()) as { code?: string; language?: string; instruction?: string };

  if (!body.code || !body.language) {
    return fail("BAD_INPUT", "code and language are required", { status: 400 });
  }

  return ok({
    action,
    language: body.language,
    result: `Scaffold action '${action}' executed.`,
    instruction: body.instruction ?? null
  });
}
