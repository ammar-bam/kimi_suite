# ROADMAP — KimiAI Suite

> Sequenced, not time-boxed. Each milestone has a clear demo-able deliverable.

## M0 — Foundations
**Deliverable:** Empty app boots, user can sign in, calls KIMI from a debug page.
- Turborepo scaffold (`apps/web`, `apps/worker`, `packages/*`).
- Tailwind + shadcn theme.
- Clerk auth + middleware.
- Drizzle + Postgres + initial migration.
- `packages/llm` with KIMI client + `chat()` wrapper.
- `/debug/llm` page proving end-to-end call.
- CI: lint, typecheck, unit tests on PR.

## M1 — Chat Workspace
**Deliverable:** Polished streaming chat with history.
- Conversations list + new/rename/delete/pin.
- Streaming UI via Vercel AI SDK.
- Model picker.
- Token/cost counter.
- Markdown + code-block rendering with copy button.
- Mobile-responsive layout.

## M2 — Document Summarizer
**Deliverable:** Drop PDF → summary + ask questions with citations.
- R2 storage + signed uploads.
- Worker pipeline (extract → chunk → embed → store).
- pgvector retrieval.
- Streaming summary + Q&A UI with citation tooltips.

## M3 — Translator + Rewriter
**Deliverable:** Utility module live, fully cached.
- Prompt templates, language list, tone presets.
- Redis cache layer.
- History toggle (off by default).

## M4 — AI Slide Creator
**Deliverable:** Prompt → previewed deck → downloaded `.pptx`.
- Outline streaming UI.
- JSON-mode deck generation.
- Worker renders via PptxGenJS (4 themes).
- Reveal.js live preview.
- Job progress SSE.

## M5 — Speech Generator
**Deliverable:** Script + voice → MP3 download.
- Voice catalogue page with samples.
- Script editor with KIMI streaming.
- ElevenLabs integration (chunked + concat).
- Audio cache by hash.

## M6 — Code Assistant
**Deliverable:** Monaco-based helper with diff view.
- 5 actions (explain, refactor, tests, translate-lang, find bugs).
- Diff viewer + accept/reject.
- Optional save to snippets.

## M7 — Billing & Quotas
**Deliverable:** Free vs Pro working end-to-end.
- Stripe Checkout + Customer Portal + Webhook.
- Quota counters + 402 responses.
- Usage dashboard with Recharts.

## M8 — Launch Hardening
**Deliverable:** Production-ready.
- Sentry, Axiom, OpenTelemetry wired in.
- Playwright e2e for each module.
- Load test (k6) on chat + slides.
- Privacy policy, terms, marketing landing page.
- Custom domain, SSL, monitoring dashboards.

## Post-Launch Ideas (Backlog)
- Vision input (when/if KIMI vision GA).
- Image generation module (Flux / SDXL via Replicate).
- Browser extension (right-click → summarize / translate).
- Team workspaces and shared knowledge bases.
- Mobile PWA install prompt + offline history.
- Custom voice cloning (ElevenLabs Pro).
- Public templates marketplace (slides, prompts).
