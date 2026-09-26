import { ok } from "../../../_lib/response";
import { drizzle } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = drizzle();

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.convId, id))
      .orderBy(messages.createdAt.asc());

    return ok(conversationMessages);
  } catch (error) {
    return ok([]); // Fallback to empty array
  }
}