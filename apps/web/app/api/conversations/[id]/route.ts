import { ok, fail } from "../../_lib/response";
import { drizzle } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = drizzle();

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return fail("BAD_INPUT", "Conversation not found", { status: 404 });
    }
    return ok(conversation);
  } catch (error) {
    console.error("GET /api/conversations/[id] failed:", error);
    return fail("INTERNAL", "Failed to fetch conversation", { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const db = drizzle();

    const [updated] = await db
      .update(conversations)
      .set({
        title: body.title,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();

    if (!updated) {
      return fail("BAD_INPUT", "Conversation not found", { status: 404 });
    }
    return ok(updated);
  } catch (error) {
    console.error("PATCH /api/conversations/[id] failed:", error);
    return fail("INTERNAL", "Failed to update conversation", { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = drizzle();

    await db.delete(messages).where(eq(messages.convId, id));
    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();

    if (!deleted) {
      return fail("BAD_INPUT", "Conversation not found", { status: 404 });
    }
    return ok({ deleted: true, id });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] failed:", error);
    return fail("INTERNAL", "Failed to delete conversation", { status: 500 });
  }
}
