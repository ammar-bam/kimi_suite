import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { env, modelForFeature } from "@kimi/config";

const kimiProvider = createOpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL
});

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    model?: string;
  };

  const result = await streamText({
    model: kimiProvider(modelForFeature("chat", body.model)),
    messages: body.messages,
    onFinish: async () => {
      // TODO: persist messages and usage events in DB.
    }
  });

  return result.toDataStreamResponse();
}
