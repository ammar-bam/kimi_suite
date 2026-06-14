import { ok } from "../_lib/response";

export async function GET() {
  return ok({
    today: { requests: 0, costUsd: 0 },
    month: { requests: 0, costUsd: 0 },
    byModule: []
  });
}
