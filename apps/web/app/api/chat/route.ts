import { NextRequest } from "next/server";
import { fail } from "../_lib/response";
import { drizzle } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type IncomingMessage = { role: "user" | "assistant" | "system" | "tool"; content: string };

const apiKey = process.env.LLM_API_KEY;
const baseUrl = process.env.LLM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const chatModel = process.env.MODEL_CHAT ?? "meta/llama-3.1-70b-instruct";

async function callLlmWithRetry(body: Record<string, unknown>, maxAttempts = 3) {
  let lastResponse: Response | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify(body)
    });
    if (response.ok || ![429, 502, 503, 504].includes(response.status)) {
      return response;
    }
    lastResponse = response;
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  return lastResponse!;
}

export async function POST(req: NextRequest) {
  try {
    const { messages: incomingMessages, conversationId } = (await req.json()) as {
      messages: IncomingMessage[];
      conversationId?: string;
    };

    if (!conversationId) {
      return fail("BAD_INPUT", "Conversation ID is required", { status: 400 });
    }
    if (!apiKey) {
      return fail("INTERNAL", "LLM_API_KEY is not configured", { status: 500 });
    }

    const db = drizzle();

    const lastUserMessage = [...incomingMessages].reverse().find((m) => m.role === "user")?.content;
    if (lastUserMessage) {
      await db.insert(messages).values({
        convId: conversationId,
        role: "user",
        content: lastUserMessage
      });
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    const upstream = await callLlmWithRetry({
      model: chatModel,
      messages: incomingMessages,
      max_tokens: 8192,
      temperature: 1.0,
      top_p: 0.95,
      stream: true
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      return fail("UPSTREAM", errText || "LLM request failed", { status: upstream.status });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = "";
        let assistantText = "";

        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const delta = json.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  assistantText += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                /* ignore malformed partial chunk */
              }
            }
          }
        } catch (err) {
          console.error("chat stream error:", err);
          controller.enqueue(encoder.encode("\n\n[stream interrupted]"));
        } finally {
          controller.close();
          if (assistantText) {
            try {
              await db.insert(messages).values({
                convId: conversationId,
                role: "assistant",
                content: assistantText
              });
            } catch (dbErr) {
              console.error("failed to persist assistant reply:", dbErr);
            }
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return fail("INTERNAL", String(error), { status: 500 });
  }
}