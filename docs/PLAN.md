# PLAN — KimiAI Suite

## 1. Vision
Build a single web app where users sign in once and access multiple AI tools (slides, speech, summarizer, chat, translator, code helper), all powered by the **KIMI / Moonshot** large-language-model API. Each tool is a self-contained module that can ship independently.

## 2. Goals
- **Modular**: every feature lives in its own folder, owns its UI, routes, server actions and DB tables.
- **Fast TTFV** (time to first value): user can try any module in <30 s without sign-up (rate-limited).
- **Production-grade**: auth, persistence, history, billing-ready, observable.
- **Extensible**: adding a new module = adding a folder; no core changes.

## 3. Non-Goals (v1)
- Real-time collaboration (multi-cursor).
- Mobile native apps (web is responsive instead).
- Self-hosted on-prem deployment.

## 4. Target Users
- Students preparing presentations / reports.
- Content creators needing voiceovers and drafts.
- Developers wanting an AI sidekick.
- Knowledge workers summarizing long PDFs.

## 5. Success Metrics
| Metric | Target (3 months post-launch) |
|---|---|
| Weekly active users | 1 000 |
| Median module latency | < 8 s (non-streaming), first token < 1.5 s (streaming) |
| Crash-free sessions | > 99.5 % |
| KIMI token cost / active user / month | < $0.30 (with caching) |

## 6. Phases

### Phase 0 — Foundations (Week 1)
- Repo, CI/CD, linting, Prettier, Husky.
- Auth (Clerk or NextAuth + Supabase).
- DB schema + migrations (Drizzle ORM).
- Shared UI shell, theme, i18n skeleton.
- KIMI client wrapper + cost meter.

### Phase 1 — Core Modules (Weeks 2-4)
- **Chat Workspace** (proves streaming + history).
- **Document Summarizer** (proves file upload + long context).
- **Translator / Rewriter** (proves prompt templates).

### Phase 2 — Generative Modules (Weeks 5-7)
- **AI Slide Creator** (JSON-schema output → PPTX export).
- **Speech Generator** (KIMI script → TTS provider).
- **Code Assistant** (Monaco editor + diff view).

### Phase 3 — Polish & Launch (Week 8)
- Stripe billing (free / pro tiers).
- Usage dashboard, quotas, abuse protection.
- Marketing landing page, docs site.
- Production deploy + monitoring.

## 7. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| KIMI API quota / outage | Abstract behind `LLMProvider` interface; fallback to OpenAI-compatible alt. |
| TTS cost spikes | Cache by hash(text+voice); cap free-tier characters. |
| Prompt injection from uploaded files | Strip / sandbox, never execute, system-prompt isolation. |
| Long-running jobs blocking serverless | Offload to BullMQ worker on Railway. |
| Storage costs (audio/PPTX) | Auto-delete after 30 days for free tier; signed URLs. |
