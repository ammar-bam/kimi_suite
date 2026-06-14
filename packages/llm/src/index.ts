import { kimi } from "./client";

type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export async function chat(params: {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  json?: boolean;
}) {
  return kimi.chat.completions.create({
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
    response_format: params.json ? { type: "json_object" } : undefined,
    temperature: params.temperature ?? 0.4
  });
}
