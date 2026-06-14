import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { env } from "@kimi/config";

const kimiProvider = createOpenAI({
  apiKey: env.KIMI_API_KEY,
  baseURL: env.KIMI_BASE_URL
});

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    model?: string;
  };

  const result = await streamText({
    model: kimiProvider(body.model ?? env.KIMI_DEFAULT_MODEL),
    messages: body.messages,
    onFinish: async () => {
      // TODO: persist messages and usage events in DB.
    }
  });

  return result.toDataStreamResponse();
}
