# MODULES — Detailed Specs

Each module below is described with: **purpose · UX flow · input · processing · output · KIMI prompt strategy · DB tables · open questions**.

---

## 1. AI Slide Creator

**Purpose** Turn a topic, outline or pasted document into a polished slide deck.

**UX flow**
1. User picks a template (Minimal / Corporate / Pitch / Academic).
2. Enters a prompt + optional source text + slide count (5–30).
3. Sees streaming outline → confirms.
4. Watches progress bar → previews deck in `Reveal.js` iframe.
5. Downloads `.pptx` or shares link.

**Input** `{ topic, sourceText?, slides: number, template, language, audience }`

**Processing**
- Step A (LLM, streaming): generate outline `{ title, sections[] }`.
- Step B (LLM, JSON mode): expand outline into `Deck` JSON conforming to schema below.
- Step C (Worker): render with **PptxGenJS** + chosen theme.
- Step D: upload to R2, store signed URL.

**Deck schema (Zod)**
```ts
const Slide = z.object({
  layout: z.enum(['title', 'bullets', 'two-column', 'image', 'quote', 'chart']),
  title: z.string(),
  bullets: z.array(z.string()).optional(),
  body: z.string().optional(),
  notes: z.string().optional(),
  imagePrompt: z.string().optional(), // for future image-gen
});
const Deck = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  theme: z.enum(['minimal','corporate','pitch','academic']),
  slides: z.array(Slide).min(3).max(40),
});
```

**KIMI prompt strategy** Use `response_format: { type: "json_object" }` with `moonshot-v1-32k`. System prompt enforces the schema; few-shot example included.

**Tables** `slide_jobs`, `slide_decks` (FK to job + storage key).

---

## 2. Speech Generator

**Purpose** Produce a natural-sounding voiceover from an idea.

**UX flow**
1. User picks voice (preview samples), language, style (narration / podcast / ad), pace.
2. Enters topic OR pastes script.
3. KIMI streams a cleaned script → user edits inline.
4. Click **Generate audio** → progress → audio player + MP3 download.

**Processing**
- Script step (LLM): KIMI `moonshot-v1-8k`, system prompt enforces SSML-safe output (no markdown, prosody hints allowed).
- TTS step (Worker): chunk by sentence (≤ 4 000 chars/chunk for ElevenLabs), call provider in parallel (max 3), concat with `fluent-ffmpeg`.
- Output: 44.1 kHz MP3 (configurable WAV).

**Cache** `sha256(text + voice + provider)` → R2 key; reuse if hit.

**Tables** `speech_jobs`, `voices` (catalogue).

---

## 3. Document Summarizer (RAG)

**Purpose** Drop a long PDF / DOCX / TXT → get summary, key points, and ask questions.

**UX flow**
1. Drag-drop file (max 25 MB).
2. See extraction progress → summary appears (streaming).
3. Tabs: **Summary · Key Points · Action Items · Chat with doc**.

**Processing**
- Extract: `unpdf` (PDF), `mammoth` (DOCX), plain read (TXT/MD).
- Short docs (< 80 k tokens): single KIMI call with `moonshot-v1-128k`.
- Long docs: chunk 800 tokens, embed (bge-m3), store in `pgvector`; for Q&A, retrieve top-8 → stuff into 32k context with citations.

**Output** Markdown summary + JSON `keyPoints[]`, `actions[]`, `citations[]`.

**Tables** `documents`, `doc_chunks (id, doc_id, ord, text, embedding vector(1024))`, `doc_qas`.

---

## 4. Chat Workspace

**Purpose** General-purpose chat with conversation history, attachments and model picker.

**Features**
- Multiple conversations, rename, pin, delete.
- File attachments (PDF, code, image — image goes through vision model if/when KIMI vision is enabled, otherwise OCR fallback).
- Model selector: `moonshot-v1-8k | -32k | -128k | kimi-k2`.
- System prompt presets (Tutor, Coder, Translator, Critic).
- Token + cost counter per conversation.

**Processing** Vercel AI SDK `streamText` → KIMI; persist with Drizzle.

**Tables** `conversations`, `messages (role, content, tokens_in, tokens_out, cost_usd, created_at)`.

---

## 5. Translator + Rewriter

**Purpose** Quick utility for translation, tone-shift, paraphrase, grammar.

**UX** Two textareas (source / target) + dropdowns: target language, tone (formal / casual / friendly / academic), action (translate / rewrite / shorten / expand / fix grammar).

**Processing** Single prompt template; cache by `(text + opts)` hash; `moonshot-v1-8k`.

**Tables** `translations` (optional history, off by default for privacy).

---

## 6. Code Assistant

**Purpose** Inline AI for code: explain, refactor, generate tests, convert between languages.

**UX**
- Monaco editor.
- Right panel actions: **Explain · Refactor · Generate tests · Translate to <lang> · Find bugs**.
- Diff view for refactors with accept / reject.

**Processing** Prompt templates per action; `moonshot-v1-32k`; response constrained to fenced code + brief explanation.

**Tables** `code_snippets` (optional save).

---

## 7. Cross-Module Shared Features

| Feature | Notes |
|---|---|
| **History** | Every module writes to a unified `activity` view for the dashboard. |
| **Favorites** | Star any output. |
| **Share** | Public read-only link with optional expiry. |
| **Export** | All outputs exportable to Markdown / PDF / their native format. |
| **Quotas** | Free tier: 50 LLM calls/day, 5 PPTX, 3 TTS minutes. Pro: configurable. |
