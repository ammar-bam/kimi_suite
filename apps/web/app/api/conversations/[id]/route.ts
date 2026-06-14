import { ok } from "../../_lib/response";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  return ok({ deleted: true, id });
}
