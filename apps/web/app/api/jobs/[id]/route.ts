import { ok } from "../../_lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  return ok({
    id,
    status: "queued",
    progress: 0,
    createdAt: new Date().toISOString()
  });
}
