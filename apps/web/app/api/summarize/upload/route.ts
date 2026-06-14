import { fail, ok } from "../../_lib/response";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return fail("BAD_INPUT", "Missing file", { status: 400 });
  }

  return ok({
    documentId: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    status: "uploaded"
  });
}
