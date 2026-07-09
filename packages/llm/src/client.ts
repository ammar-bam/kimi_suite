import OpenAI from "openai";
import { env } from "@kimi/config";

export const llm = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL,
  timeout: 60_000,
  maxRetries: 2
});

export const kimi = llm;
