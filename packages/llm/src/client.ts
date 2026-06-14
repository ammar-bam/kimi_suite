import OpenAI from "openai";
import { env } from "@kimi/config";

export const kimi = new OpenAI({
  apiKey: env.KIMI_API_KEY,
  baseURL: env.KIMI_BASE_URL,
  timeout: 60_000,
  maxRetries: 2
});
