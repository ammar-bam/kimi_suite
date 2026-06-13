# DATA_MODEL — PostgreSQL Schema (Drizzle)

> Conceptual schema. Field types in Postgres / Drizzle notation.

## Core

```ts
users (
  id            uuid pk,
  clerk_id      text unique,
  email         text unique not null,
  name          text,
  plan          enum('free','pro','team') default 'free',
  created_at    timestamptz default now()
)

usage_events (
  id            bigserial pk,
  user_id       uuid fk users,
  module        text,                -- 'chat' | 'slides' | …
  model         text,                -- 'moonshot-v1-32k' | …
  tokens_in     int,
  tokens_out    int,
  cost_usd      numeric(10,6),
  created_at    timestamptz default now(),
  index (user_id, created_at desc)
)

quotas (
  user_id       uuid pk fk users,
  llm_calls_day int default 0,
  pptx_day      int default 0,
  tts_chars_mo  int default 0,
  resets_at     timestamptz
)
```

## Chat

```ts
conversations (
  id          uuid pk,
  user_id     uuid fk,
  title       text,
  model       text,
  pinned      bool default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz
)

messages (
  id           uuid pk,
  conv_id      uuid fk conversations on delete cascade,
  role         enum('user','assistant','system','tool'),
  content      text,                 -- markdown
  attachments  jsonb,                -- [{key,type,name,size}]
  tokens_in    int,
  tokens_out   int,
  cost_usd     numeric(10,6),
  created_at   timestamptz default now(),
  index (conv_id, created_at)
)
```

## Summarizer (RAG)

```ts
documents (
  id          uuid pk,
  user_id     uuid fk,
  name        text,
  mime        text,
  size_bytes  int,
  storage_key text,                  -- R2 key
  status      enum('uploaded','extracting','embedded','failed'),
  pages       int,
  created_at  timestamptz default now()
)

doc_chunks (
  id          bigserial pk,
  doc_id      uuid fk documents on delete cascade,
  ord         int,
  text        text,
  embedding   vector(1024),          -- pgvector, bge-m3 dim
  index using hnsw (embedding vector_cosine_ops)
)

doc_qas (
  id          uuid pk,
  doc_id      uuid fk,
  user_id     uuid fk,
  question    text,
  answer      text,
  citations   jsonb,                 -- [{chunkId, page}]
  created_at  timestamptz default now()
)
```

## Slide Creator

```ts
slide_jobs (
  id          uuid pk,
  user_id     uuid fk,
  status      enum('queued','running','done','failed'),
  input       jsonb,                 -- {topic, slides, template, language}
  progress    int default 0,
  error       text,
  deck_id     uuid,
  created_at  timestamptz default now()
)

slide_decks (
  id          uuid pk,
  job_id      uuid fk slide_jobs,
  title       text,
  theme       text,
  storage_key text,                  -- pptx in R2
  preview_key text,                  -- thumbnail
  json        jsonb                  -- deck JSON for re-render
)
```

## Speech

```ts
voices (
  id          text pk,               -- provider id
  provider    enum('elevenlabs','azure'),
  label       text,
  language    text,
  preview_url text
)

speech_jobs (
  id          uuid pk,
  user_id     uuid fk,
  voice_id    text fk voices,
  script      text,
  format      enum('mp3','wav') default 'mp3',
  status      enum('queued','running','done','failed'),
  audio_key   text,                  -- R2 key
  duration_s  numeric(6,2),
  cost_usd    numeric(10,6),
  created_at  timestamptz default now()
)
```

## Translation / Code (optional history)

```ts
translations (id, user_id, source, target_lang, action, tone, result, created_at)
code_snippets (id, user_id, action, language, input, output, created_at)
```

## Sharing

```ts
shares (
  id          uuid pk,
  user_id     uuid fk,
  resource    text,                  -- 'deck' | 'doc' | 'speech' | 'chat'
  resource_id uuid,
  slug        text unique,
  expires_at  timestamptz
)
```
