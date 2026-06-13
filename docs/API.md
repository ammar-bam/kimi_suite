# API — Internal Endpoints & KIMI Integration

## 1. KIMI / Moonshot Integration

KIMI exposes an **OpenAI-compatible** REST API, so the official `openai` Node SDK works directly.

### Base configuration

```ts
// packages/llm/src/client.ts
import OpenAI from 'openai';
import { env } from '@kimi/config';

export const kimi = new OpenAI({
  apiKey:  env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1', // or https://api.moonshot.cn/v1 for China
  timeout: 60_000,
  maxRetries: 2,
});
```

### Available models (as of writing — verify in KIMI dashboard before launch)

| Model id | Context | Best for |
|---|---|---|
| `moonshot-v1-8k`   | 8 k    | Short prompts, translation, quick chat |
| `moonshot-v1-32k`  | 32 k   | Slides, code, medium documents |
| `moonshot-v1-128k` | 128 k  | Long-document summarization & RAG fallback |
| `kimi-k2-…`        | varies | Newer general model — use when GA |

### Wrapper with usage logging

```ts
export async function chat(params: ChatParams, ctx: Ctx) {
  const res = await kimi.chat.completions.create({
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
    response_format: params.json ? { type: 'json_object' } : undefined,
    temperature: params.temperature ?? 0.4,
  });
  // for non-stream — record usage
  if (!params.stream) await recordUsage(ctx.userId, params.model, res.usage);
  return res;
}
```

### Streaming with Vercel AI SDK

```ts
// apps/web/app/api/chat/route.ts
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const kimiProvider = createOpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1',
});

export async function POST(req: Request) {
  const { messages, model = 'moonshot-v1-32k' } = await req.json();
  const result = await streamText({
    model: kimiProvider(model),
    messages,
    onFinish: ({ usage }) => recordUsage(/* … */),
  });
  return result.toDataStreamResponse();
}
```

### JSON-mode example (Slide Creator)

```ts
const completion = await kimi.chat.completions.create({
  model: 'moonshot-v1-32k',
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: SLIDE_SYSTEM_PROMPT }, // describes the schema
    { role: 'user',   content: JSON.stringify({ topic, slides, audience }) },
  ],
  temperature: 0.3,
});
const deck = Deck.parse(JSON.parse(completion.choices[0].message.content!));
```

---

## 2. Internal REST API

All routes live under `/api/*`. Auth via session cookie (Clerk) — middleware injects `req.userId`.

| Method | Path | Body | Returns | Streaming |
|---|---|---|---|---|
| POST | `/api/chat`                    | `{ conversationId?, messages, model }` | SSE tokens                          | ✅ |
| GET  | `/api/conversations`           | —                                       | `Conversation[]`                    |   |
| POST | `/api/conversations`           | `{ title? }`                            | `Conversation`                      |   |
| DELETE | `/api/conversations/:id`     | —                                       | `204`                               |   |
| POST | `/api/summarize/upload`        | multipart `file`                        | `{ documentId }`                    |   |
| POST | `/api/summarize/:docId/ask`    | `{ question }`                          | SSE answer + `citations[]`          | ✅ |
| POST | `/api/translate`               | `{ text, target, tone?, action }`       | `{ result }`                        |   |
| POST | `/api/code/:action`            | `{ code, language, instruction? }`      | `{ result, diff? }`                 |   |
| POST | `/api/slides`                  | `{ topic, slides, template, language }` | `{ jobId }`                         |   |
| GET  | `/api/jobs/:id`                | —                                       | `Job`                               |   |
| GET  | `/api/jobs/:id/stream`         | —                                       | SSE progress events                 | ✅ |
| POST | `/api/speech/script`           | `{ topic, style, language }`            | SSE script                          | ✅ |
| POST | `/api/speech/synthesize`       | `{ script, voiceId, format }`           | `{ jobId }`                         |   |
| GET  | `/api/usage`                   | —                                       | `{ today, month, byModule }`        |   |
| POST | `/api/billing/checkout`        | `{ priceId }`                           | `{ url }`                           |   |
| POST | `/api/billing/webhook`         | Stripe payload                          | `200`                               |   |

### Standard response envelope (non-stream)

```json
{ "ok": true,  "data": { /* … */ } }
{ "ok": false, "error": { "code": "RATE_LIMITED", "message": "…", "retryAfter": 12 } }
```

### SSE event format (job progress)

```
event: progress
data: {"jobId":"abc","stage":"render","percent":62}

event: done
data: {"jobId":"abc","url":"https://r2…/deck.pptx"}

event: error
data: {"jobId":"abc","message":"…"}
```

### Common error codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED`   | 401 | Missing/invalid session |
| `FORBIDDEN`      | 403 | Plan does not include feature |
| `RATE_LIMITED`   | 429 | User or IP quota hit |
| `QUOTA_EXCEEDED` | 402 | Monthly LLM/TTS quota hit |
| `BAD_INPUT`      | 400 | Zod validation failed |
| `UPSTREAM`       | 502 | KIMI / TTS provider error |
| `INTERNAL`       | 500 | Unhandled |

---

## 3. Prompt Library Location

```
packages/llm/src/prompts/
├─ chat.ts
├─ slides.ts
├─ speech.ts
├─ summarize.ts
├─ translate.ts
└─ code.ts
```

Each exports `system`, `examples`, and a `build(input): Message[]` helper so prompts are versioned in code review.
