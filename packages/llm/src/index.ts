import { modelForFeature, type LlmFeature } from "@kimi/config";
import { llm } from "./client";

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
  return llm.chat.completions.create({
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
    response_format: params.json ? { type: "json_object" } : undefined,
    temperature: params.temperature ?? 0.4
  });
}

export async function chatByFeature(params: {
  feature: LlmFeature;
  messages: ChatMessage[];
  modelOverride?: string;
  stream?: boolean;
  temperature?: number;
  json?: boolean;
}) {
  return chat({
    model: modelForFeature(params.feature, params.modelOverride),
    messages: params.messages,
    stream: params.stream,
    temperature: params.temperature,
    json: params.json
  });
}
