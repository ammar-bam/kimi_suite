# ARCHITECTURE — KimiAI Suite

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                           │
│  Next.js App Router · React 19 · Tailwind · shadcn · AI SDK UI   │
└───────────────┬──────────────────────────────────────┬───────────┘
                │ HTTPS (SSE for streaming)            │
                ▼                                      ▼
   ┌─────────────────────────┐            ┌──────────────────────┐
   │  Next.js Route Handlers │            │  Static assets (CDN) │
   │  /api/*                 │            └──────────────────────┘
   │  - edge: streaming LLM  │
   │  - node: file I/O, jobs │
   └─────┬───────────────────┘
         │
         │ enqueue                  query / mutate
         ▼                                ▼
   ┌──────────────┐               ┌──────────────────┐
   │  Redis (BullMQ│              │  Postgres + pgvector│
   │  + Ratelimit) │              │  Drizzle ORM     │
   └──────┬───────┘               └──────────────────┘
          │ consume
          ▼
   ┌──────────────────────────┐
   │  Worker (Node, Railway)  │
   │  - PPTX render           │
   │  - TTS pipeline          │
   │  - RAG embeddings        │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │  Object Storage (R2/S3)  │
   │  uploads / outputs       │
   └──────────────────────────┘

       ┌─────────────────────────────────────────────┐
       │ External AI: NVIDIA NIM · ElevenLabs · Whisper │
       └─────────────────────────────────────────────┘
```

## 2. Repository Layout (Turborepo)

```
KimiAI_Suite/
├─ apps/
│  ├─ web/                  # Next.js 15 app
│  │  ├─ app/
│  │  │  ├─ (marketing)/
│  │  │  ├─ (auth)/
│  │  │  ├─ dashboard/
│  │  │  └─ modules/
│  │  │     ├─ chat/
│  │  │     ├─ slides/
│  │  │     ├─ speech/
│  │  │     ├─ summarize/
│  │  │     ├─ translate/
│  │  │     └─ code/
│  │  ├─ api/               # route handlers
│  │  └─ components/
│  └─ worker/               # BullMQ consumer
│     └─ src/jobs/
│        ├─ render-pptx.ts
│        ├─ tts.ts
│        └─ embed.ts
├─ packages/
│  ├─ ui/                   # shadcn re-exports + custom components
│  ├─ llm/                  # LLM client, prompt templates, schemas
│  ├─ db/                   # Drizzle schema + migrations
│  ├─ config/               # env loader (Zod-validated)
│  └─ shared/               # zod types reused by web + worker
├─ docs/
├─ .env.example
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

## 3. Module Pattern (Plug-in Architecture)

Every module follows the same contract so adding a new one is mechanical:

```
apps/web/app/modules/<name>/
├─ page.tsx              # UI entry
├─ actions.ts            # server actions (mutations)
├─ schema.ts             # Zod input/output schemas
├─ prompts.ts            # system + few-shot prompts
└─ components/

packages/llm/src/modules/<name>.ts   # callable from web OR worker
packages/db/src/schema/<name>.ts     # tables (history, artifacts)
```

A `ModuleManifest` registry exposes them to the dashboard:

```ts
// packages/shared/src/modules.ts
export const modules = [
  { id: 'chat',      label: 'Chat',          icon: 'message-square', path: '/modules/chat',      tier: 'free' },
  { id: 'summarize', label: 'Summarizer',    icon: 'file-text',      path: '/modules/summarize', tier: 'free' },
  { id: 'translate', label: 'Translate',     icon: 'languages',      path: '/modules/translate', tier: 'free' },
  { id: 'slides',    label: 'Slide Creator', icon: 'presentation',   path: '/modules/slides',    tier: 'pro'  },
  { id: 'speech',    label: 'Speech',        icon: 'mic',            path: '/modules/speech',    tier: 'pro'  },
  { id: 'code',      label: 'Code Helper',   icon: 'code-2',         path: '/modules/code',      tier: 'free' },
] as const;
```

## 4. Request Lifecycles

### 4a. Streaming chat (fast path, no queue)
1. Client `POST /api/chat` (SSE).
2. Edge handler authenticates → rate-limits → resolves `MODEL_CHAT` (or request override) and calls NVIDIA endpoint with `stream: true`.
3. Tokens piped back through Vercel AI SDK `streamText`.
4. On `onFinish`, server action persists the message pair + token cost.

### 4b. Slide generation (queued)
1. Client `POST /api/slides` with prompt.
2. Node handler validates → enqueues `render-pptx` job → returns `jobId`.
3. Client subscribes to `GET /api/jobs/:id/stream` (SSE progress).
4. Worker:
       - calls NVIDIA endpoint with `MODEL_SLIDES` and JSON-schema response format → deck JSON,
   - renders via PptxGenJS,
   - uploads to R2,
   - updates job row.
5. Client downloads from signed URL.

### 4c. Speech generation
1. NVIDIA endpoint generates / cleans the script with `MODEL_SPEECH_SCRIPT` (streaming preview to UI).
2. On user confirm → enqueue `tts` job.
3. Worker chunks text, calls ElevenLabs per chunk, concatenates with ffmpeg, uploads MP3.

### 4d. Document summarizer (RAG)
1. Upload → R2 → enqueue `embed` job.
2. Worker extracts text, chunks 800 tokens, embeds, stores in `pgvector`.
3. User asks question → top-k retrieval → `MODEL_SUMMARIZE` prompt with citations.

## 5. Cross-Cutting Concerns

- **Auth context** propagated via Next middleware → injected into every server action.
- **Tracing**: each request gets a `traceId`; passed as header to the LLM provider for log correlation.
- **Cost meter**: a single helper `recordUsage(userId, model, in, out)` writes to `usage_events` and updates a Redis counter for quota.
- **Idempotency**: mutating routes accept `Idempotency-Key` header.
- **Caching**: prompt+model+input hash → Redis (TTL 24 h) for deterministic calls (translate, summarize).

## 6. Failure Handling

| Failure | Behavior |
|---|---|
| LLM 429 | Exponential backoff, max 3 retries, then return 503 with `retry-after`. |
| Job worker crash | BullMQ retries (max 2) with backoff; dead-letter queue alerted via Sentry. |
| Upload too large | Reject at edge (>25 MB) with friendly error. |
| Stream client disconnect | `AbortController` cancels KIMI request → saves cost. |
