import { ok, fail } from "../_lib/response";
import { drizzle } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = drizzle();
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
    return ok(rows);
  } catch (error) {
    console.error("GET /api/conversations failed:", error);
    return ok([]);
  }
}

export async function POST(req: Request) {
  let title = "New conversation";
  try {
    const body = (await req.json().catch(() => ({}))) as { title?: string };
    if (body.title && body.title.trim().length > 0) {
      title = body.title.trim();
    }

    const db = drizzle();
    const [newConversation] = await db
      .insert(conversations)
      .values({ title })
      .returning();

    return ok(newConversation);
  } catch (error) {
    console.error("POST /api/conversations failed:", error);
    return fail("INTERNAL", "Failed to create conversation", { status: 500 });
  }
}