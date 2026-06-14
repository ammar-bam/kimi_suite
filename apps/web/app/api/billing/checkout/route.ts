import { fail, ok } from "../../_lib/response";

export async function POST(req: Request) {
  const body = (await req.json()) as { priceId?: string };

  if (!body.priceId) {
    return fail("BAD_INPUT", "priceId is required", { status: 400 });
  }

  return ok({ url: "https://example.com/checkout-placeholder" });
}
