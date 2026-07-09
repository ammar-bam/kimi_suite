# TECH_STACK — KimiAI Suite

A modern, type-safe, mostly-TypeScript stack chosen for speed of development, low ops burden, and good fit with streaming LLM workloads.

## 1. Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, React 19) | SSR + RSC + streaming + API routes in one project, perfect for LLM streaming. |
| Language | **TypeScript (strict)** | Catches issues early, great DX with OpenAI-compatible SDKs (NVIDIA NIM endpoint). |
| Styling | **Tailwind CSS v4** | Utility-first, tiny output, themable. |
| UI kit | **shadcn/ui + Radix Primitives** | Owned components, accessible, easy to theme. |
| Icons | **lucide-react** | Tree-shakeable. |
| State | **Zustand** (client) + **TanStack Query** (server data) | Minimal boilerplate; great cache for chat history. |
| Forms | **react-hook-form + Zod** | Same Zod schemas reused on the server. |
| Streaming UI | **Vercel AI SDK (`ai` package)** | Works with any OpenAI-compatible endpoint → fits NVIDIA NIM directly. |
| Editor (code module) | **Monaco** | Same engine as VS Code. |
| Slide preview | **Reveal.js** (in iframe) | Renders the JSON deck before export. |
| Charts | **Recharts** | For usage dashboard. |
| i18n | **next-intl** | Locale-aware routing. |

## 2. Backend

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Native fetch, stable. |
| API | **Next.js Route Handlers** (Edge where possible) | Co-located with UI; Edge runtime gives low TTFB for streams. |
| LLM client | **OpenAI SDK** pointed at `https://integrate.api.nvidia.com/v1` | NVIDIA NIM is OpenAI-compatible; model can vary by feature. |
| Background jobs | **BullMQ** on Redis | For PPTX rendering, long TTS jobs, embeddings. |
| Worker host | **Railway** or **Fly.io** | Long-running processes outside serverless. |
| ORM | **Drizzle ORM** | Type-safe, lightweight, SQL-first. |
| Validation | **Zod** | Shared with frontend. |
| Rate limiting | **Upstash Ratelimit** | Edge-friendly, per-IP + per-user. |

## 3. Data & Storage

| Need | Choice |
|---|---|
| Primary DB | **PostgreSQL** (Supabase or Neon) |
| Cache / queue | **Upstash Redis** |
| File storage | **Supabase Storage** or **Cloudflare R2** (S3-compatible, cheap egress) |
| Vector store (RAG for summarizer) | **pgvector** extension in Postgres |

## 4. Auth & Billing

| Need | Choice |
|---|---|
| Auth | **Clerk** (fastest) *or* **NextAuth + Supabase** (cheaper) |
| Billing | **Stripe** (Checkout + Customer Portal + Webhooks) |
| Quotas | Stored in Postgres, enforced in middleware |

## 5. AI Services

| Capability | Provider | Notes |
|---|---|---|
| LLM (chat, summarize, translate, slides JSON, code) | **NVIDIA NIM endpoint** (`integrate.api.nvidia.com/v1`) | OpenAI-compatible; route model per module via env (`MODEL_CHAT`, `MODEL_CODE`, etc). |
| Text-to-Speech | **ElevenLabs** (high quality) or **Azure Speech** (cheaper) | Independent from primary LLM provider. |
| Speech-to-Text (optional) | **Whisper** via Groq or OpenAI | For voice input. |
| Embeddings | **bge-m3** via a small self-hosted endpoint *or* **Voyage AI** | KIMI does not (yet) expose embeddings publicly. |
| PPTX export | **PptxGenJS** (pure JS, runs in worker) | No external service. |
| PDF parsing | **pdf-parse** + **unpdf** | For the summarizer. |

## 6. DevOps & Tooling

| Layer | Choice |
|---|---|
| Package manager | **pnpm** |
| Monorepo | **Turborepo** (single repo: `apps/web`, `apps/worker`, `packages/ui`, `packages/llm`) |
| Linting | ESLint + Prettier + Husky + lint-staged |
| Testing | Vitest (unit), Playwright (e2e) |
| CI/CD | GitHub Actions → Vercel (web) + Railway (worker) |
| Observability | **Sentry** (errors) + **Axiom / Logtail** (logs) + **OpenTelemetry** traces |
| Feature flags | **PostHog** (also analytics) |

## 7. Deployment Topology

```
┌─────────────┐      ┌─────────────────┐
│  Vercel     │◄────►│  Supabase / Neon │   Postgres + pgvector
│  Next.js    │      └─────────────────┘
│  (Edge+Node)│      ┌─────────────────┐
│             │◄────►│  Upstash Redis  │   queue + ratelimit + cache
└──────┬──────┘      └─────────────────┘
       │             ┌─────────────────┐
       │             │  Cloudflare R2  │   pptx / mp3 / uploads
       │             └─────────────────┘
       │             ┌─────────────────┐
       └────────────►│  NVIDIA NIM     │   LLM
                     │  ElevenLabs     │   TTS
                     └─────────────────┘

           ┌─────────────────┐
           │  Railway Worker │  BullMQ consumer (PPTX, TTS, RAG)
           └─────────────────┘
```

## 8. Alternative Stacks Considered

| Alt | Why rejected |
|---|---|
| Python FastAPI backend | Adds a second runtime; OpenAI-compatible SDK works fine in Node; Vercel AI SDK is JS-first. |
| Remix / SvelteKit | Smaller ecosystem for AI streaming today. |
| Firebase | Vendor lock-in, weaker SQL/vector story than Postgres+pgvector. |
| MongoDB | Relational data (orgs, users, jobs, files, history) is a better Postgres fit. |
