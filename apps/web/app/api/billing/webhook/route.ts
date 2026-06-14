import { ok } from "../../_lib/response";

export async function POST() {
  // TODO: verify Stripe signature and persist plan changes.
  return ok({ received: true });
}
