import { fail, ok } from "../_lib/response";
import { modelForFeature } from "@kimi/config";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string;
    target?: string;
    tone?: string;
    action?: "translate" | "rewrite" | "shorten" | "expand" | "fix-grammar";
    model?: string;
  };

  if (!body.text || !body.target || !body.action) {
    return fail("BAD_INPUT", "text, target and action are required", { status: 400 });
  }

  return ok({
    model: modelForFeature("translate", body.model),
    result: `[${body.action}/${body.target}${body.tone ? `/${body.tone}` : ""}] ${body.text}`
  });
}
