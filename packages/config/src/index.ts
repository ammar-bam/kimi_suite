import { z } from "zod";

const defaultNvidiaBaseUrl = "https://integrate.api.nvidia.com/v1";

const normalizedEnv = {
  ...process.env,
  LLM_API_KEY: process.env.LLM_API_KEY ?? process.env.NVIDIA_API_KEY ?? process.env.KIMI_API_KEY,
  LLM_BASE_URL: process.env.LLM_BASE_URL ?? process.env.NVIDIA_BASE_URL ?? process.env.KIMI_BASE_URL ?? defaultNvidiaBaseUrl,
  MODEL_CHAT: process.env.MODEL_CHAT ?? process.env.KIMI_DEFAULT_MODEL ?? "meta/llama-3.1-70b-instruct",
  MODEL_SUMMARIZE: process.env.MODEL_SUMMARIZE ?? "meta/llama-3.1-70b-instruct",
  MODEL_TRANSLATE: process.env.MODEL_TRANSLATE ?? "meta/llama-3.1-8b-instruct",
  MODEL_SLIDES: process.env.MODEL_SLIDES ?? "meta/llama-3.1-70b-instruct",
  MODEL_SPEECH_SCRIPT: process.env.MODEL_SPEECH_SCRIPT ?? "meta/llama-3.1-8b-instruct",
  MODEL_CODE: process.env.MODEL_CODE ?? "meta/llama-3.1-70b-instruct"
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  LLM_API_KEY: z.string().min(1),
  LLM_BASE_URL: z.string().url().default(defaultNvidiaBaseUrl),
  MODEL_CHAT: z.string().min(1),
  MODEL_SUMMARIZE: z.string().min(1),
  MODEL_TRANSLATE: z.string().min(1),
  MODEL_SLIDES: z.string().min(1),
  MODEL_SPEECH_SCRIPT: z.string().min(1),
  MODEL_CODE: z.string().min(1),
  KIMI_API_KEY: z.string().optional(),
  KIMI_BASE_URL: z.string().url().optional(),
  KIMI_DEFAULT_MODEL: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_BASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional()
});

export const env = envSchema.parse(normalizedEnv);

export type LlmFeature = "chat" | "summarize" | "translate" | "slides" | "speech-script" | "code";

export function modelForFeature(feature: LlmFeature, override?: string) {
  if (override) {
    return override;
  }

  if (feature === "chat") {
    return env.MODEL_CHAT;
  }

  if (feature === "summarize") {
    return env.MODEL_SUMMARIZE;
  }

  if (feature === "translate") {
    return env.MODEL_TRANSLATE;
  }

  if (feature === "slides") {
    return env.MODEL_SLIDES;
  }

  if (feature === "speech-script") {
    return env.MODEL_SPEECH_SCRIPT;
  }

  return env.MODEL_CODE;
}
