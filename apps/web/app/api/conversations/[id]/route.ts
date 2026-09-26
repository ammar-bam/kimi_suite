import { ok } from "../../../_lib/response";
import { drizzle } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET_REQUEST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = drizzle();

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return new Response(JSON.stringify({ ok: false, error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return ok(conversation);
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: "Failed to fetch conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function PATCH_REQUEST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { title?: string };
    const db = drizzle();

    const [updatedConversation] = await db
      .update(conversations)
      .set({
        title: body.title,
        updatedAt: new Date().toISOString()
      })
      .where(eq(conversations.id, id))
      .returning();

    if (!updatedConversation) {
      return new Response(JSON.stringify({ ok: false, error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return ok(updatedConversation);
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: "Failed to update conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function DELETE_REQUEST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = drizzle();

    // Delete associated messages first (due to foreign key constraint)
    await db.delete(messages).where(eq(messages.convId, id));

    // Delete the conversation
    const [deletedConversation] = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();

    if (!deletedConversation) {
      return new Response(JSON.stringify({ ok: false, error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return ok({ deleted: true, id });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: "Failed to delete conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}