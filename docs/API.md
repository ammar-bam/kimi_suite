# API — Internal Endpoints & LLM Integration

## 1. NVIDIA NIM Integration (OpenAI-compatible)

NVIDIA NIM exposes an **OpenAI-compatible** REST API, so the official `openai` Node SDK works directly.

### Base configuration

```ts
// packages/llm/src/client.ts
import OpenAI from 'openai';
import { env } from '@kimi/config';

export const kimi = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL, // default: https://integrate.api.nvidia.com/v1
  timeout: 60_000,
  maxRetries: 2,
});
```

### Per-feature model routing

Configure default models per module in environment variables:

| Env var | Module |
|---|---|
| `MODEL_CHAT` | Chat Workspace |
| `MODEL_SUMMARIZE` | Document Summarizer |
| `MODEL_TRANSLATE` | Translator + Rewriter |
| `MODEL_SLIDES` | AI Slide Creator |
| `MODEL_SPEECH_SCRIPT` | Speech script generation |
| `MODEL_CODE` | Code Assistant |

Routes also accept an optional `model` override in request bodies when you want request-level model switching.

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
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  const result = await streamText({
    model: kimiProvider(model ?? process.env.MODEL_CHAT!),
    messages,
    onFinish: ({ usage }) => recordUsage(/* … */),
  });
  return result.toDataStreamResponse();
}
```

### JSON-mode example (Slide Creator)

```ts
const completion = await kimi.chat.completions.create({
  model: process.env.MODEL_SLIDES!,
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
| POST | `/api/summarize/:docId/ask`    | `{ question, model? }`                  | SSE answer + `citations[]`          | ✅ |
| POST | `/api/translate`               | `{ text, target, tone?, action, model? }` | `{ result }`                      |   |
| POST | `/api/code/:action`            | `{ code, language, instruction?, model? }` | `{ result, diff? }`               |   |
| POST | `/api/slides`                  | `{ topic, slides, template, language, model? }` | `{ jobId }`                  |   |
| GET  | `/api/jobs/:id`                | —                                       | `Job`                               |   |
| GET  | `/api/jobs/:id/stream`         | —                                       | SSE progress events                 | ✅ |
| POST | `/api/speech/script`           | `{ topic, style, language, model? }`    | SSE script                          | ✅ |
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
| `UPSTREAM`       | 502 | NVIDIA / TTS provider error |
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
