import { fail, ok } from "../_lib/response";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string;
    target?: string;
    tone?: string;
    action?: "translate" | "rewrite" | "shorten" | "expand" | "fix-grammar";
  };

  if (!body.text || !body.target || !body.action) {
    return fail("BAD_INPUT", "text, target and action are required", { status: 400 });
  }

  return ok({
    result: `[${body.action}/${body.target}${body.tone ? `/${body.tone}` : ""}] ${body.text}`
  });
}
