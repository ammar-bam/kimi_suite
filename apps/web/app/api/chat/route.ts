import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const api_key = process.env.LLM_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages: incomingMessages, conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Store the last user message
    const lastUserMessage = incomingMessages.find(
      (msg: any) => msg.role === "user"
    )?.content;

    if (lastUserMessage) {
      const db = drizzle();

      // Store user message
      await db.insert(messages).values({
        convId: conversationId,
        role: "user",
        content: lastUserMessage,
        createdAt: new Date().toISOString()
      });

      // Update conversation's updatedAt timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(conversations.id, conversationId));
    }

    // Get AI response
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${api_key}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "minimaxai/minimax-m3",
        messages: incomingMessages,
        max_tokens: 8192,
        temperature: 1.0,
        top_p: 0.95,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    // Store AI response
    if (text && conversationId) {
      const db = drizzle();
      await db.insert(messages).values({
        convId: conversationId,
        role: "assistant",
        content: text,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}