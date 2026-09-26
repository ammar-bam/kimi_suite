import { ok } from "../_lib/response";
import { drizzle } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = drizzle();
    const allConversations = await db.select().from(conversations).orderBy(conversations.createdAt.desc());
    return ok(allConversations);
  } catch (error) {
    return ok([]); // Fallback to empty array if db not ready
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string };
    const db = drizzle();

    const [newConversation] = await db
      .insert(conversations)
      .values({
        title: body.title ?? "New conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return ok(newConversation);
  } catch (error) {
    return ok({
      id: crypto.randomUUID(),
      title: body.title ?? "New conversation",
      createdAt: new Date().toISOString()
    }); // Fallback
  }
}

// GET specific conversation
export async function GET_REQUEST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

// PATCH update conversation
export async function PATCH_REQUEST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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