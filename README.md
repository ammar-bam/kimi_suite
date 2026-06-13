# KimiAI Suite

A modular **web application** that bundles several AI-powered productivity tools on top of the **KIMI (Moonshot AI) API**.

## Modules (v1 scope)
| # | Module | What it does |
|---|--------|-------------|
| 1 | **AI Slide Creator** | Turn a prompt / outline / document into a downloadable slide deck (`.pptx` + live preview). |
| 2 | **Speech Generator** | Generate a script with KIMI, then synthesize natural speech (TTS) to MP3/WAV. |
| 3 | **Document Summarizer** | Upload PDF / DOCX / TXT → structured summary, key points, Q&A. |
| 4 | **Chat Workspace** | Multi-conversation chat with file + image context (KIMI long context, 128k). |
| 5 | **Translator + Rewriter** | Translate, paraphrase, change tone, fix grammar. |
| 6 | **Code Assistant** | Explain, refactor, generate code and unit tests. |

> Modules are independent micro-features that share auth, billing, history and a common UI shell.

## Documentation Index
1. [PLAN.md](docs/PLAN.md) — Vision, goals, scope, phases
2. [TECH_STACK.md](docs/TECH_STACK.md) — Chosen technologies + rationale
3. [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and data flow
4. [MODULES.md](docs/MODULES.md) — Detailed spec for every module
5. [API.md](docs/API.md) — Internal REST contract + KIMI integration
6. [DATA_MODEL.md](docs/DATA_MODEL.md) — Database schema
7. [SECURITY.md](docs/SECURITY.md) — Auth, secrets, rate limiting, OWASP
8. [ROADMAP.md](docs/ROADMAP.md) — Milestones and deliverables
9. [.env.example](.env.example) — Required environment variables

## Quick Start (after scaffolding)
```bash
# install
pnpm install

# dev (Next.js + workers)
pnpm dev

# build for production
pnpm build && pnpm start
```
