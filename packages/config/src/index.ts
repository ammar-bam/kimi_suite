import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  KIMI_API_KEY: z.string().min(1),
  KIMI_BASE_URL: z.string().url().default("https://api.moonshot.ai/v1"),
  KIMI_DEFAULT_MODEL: z.string().default("moonshot-v1-32k"),
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional()
});

export const env = envSchema.parse(process.env);
