# SECURITY — KimiAI Suite

Mapped to **OWASP Top 10 (2021)** plus AI-specific risks (**OWASP LLM Top 10**).

## 1. Authentication & Sessions
- Managed by **Clerk** (or NextAuth) — never roll your own.
- HttpOnly, Secure, SameSite=Lax cookies.
- All `/api/*` and `/dashboard/*` paths gated by middleware.
- Sign-out invalidates server session.

## 2. Authorization
- Row-level checks in every Drizzle query: `where(eq(table.userId, ctx.userId))`.
- Plan-tier checks before invoking Pro-only modules.
- Signed URLs for object storage (15-min expiry) — never expose raw bucket.

## 3. Secrets Management
- All secrets in env vars; loaded through a **Zod-validated** `env` helper (`packages/config`).
- Never logged, never sent to client.
- Rotated quarterly; KIMI key restricted to server runtime only.
- `.env*` in `.gitignore`; CI uses provider secret stores (Vercel / Railway / GitHub Actions OIDC).

## 4. Input Validation
- Every route handler validates body / params with **Zod**.
- File uploads: type sniffing (`file-type`), size cap (25 MB), extension allowlist (PDF, DOCX, TXT, MD).
- Reject zip-bombs, encrypted PDFs without password handling.

## 5. Prompt Injection (LLM01)
- Treat **all user content and uploaded files as untrusted**.
- System prompt isolation: user text is wrapped in clear delimiters and explicitly labeled untrusted; instructions tell the model to ignore embedded directives.
- For agent-like flows: tool calls only from a fixed allowlist; never execute model-generated shell, SQL, or code.
- Strip HTML / scripts from extracted document text before embedding.

## 6. Sensitive Data (LLM06)
- Show a banner: “Don’t paste secrets/PII.”
- Optional: server-side regex scrubber (emails, credit cards, API keys) before sending to KIMI.
- Conversations encrypted at rest by Postgres provider (Supabase/Neon AES-256).
- Right-to-erasure: `DELETE /api/account` cascades all user data within 24 h.

## 7. Rate Limiting & Abuse (LLM04 Model DoS)
- **Upstash Ratelimit** in middleware:
  - Anonymous: 10 req / 10 min / IP.
  - Free user: 50 LLM calls / day.
  - Per-route caps for expensive ops (5 PPTX/day free).
- Token budget per request (max output tokens enforced server-side).
- AbortController cancels KIMI call when client disconnects.

## 8. Supply-Chain (LLM05/A06)
- `pnpm audit` + Dependabot weekly.
- Lockfile committed; CI runs `pnpm install --frozen-lockfile`.
- No `postinstall` scripts from untrusted packages.

## 9. Logging & Monitoring
- Sentry for errors (PII-scrubbed via `beforeSend`).
- Axiom / Logtail for structured logs (`traceId`, `userId`, `module`, `model`, `tokens`, `cost`).
- Alerts on: 5xx spike, KIMI 4xx spike, abnormal cost/min, job DLQ length.

## 10. Transport & Headers
- HTTPS enforced (HSTS preload).
- Strict CSP (no inline scripts beyond Next’s nonced ones).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self)`.
- CORS: same-origin only; public share endpoints read-only.

## 11. CSRF
- Server actions and `POST /api/*` use Next.js built-in same-origin protection + Origin header check.
- Stripe webhook verified with signing secret.

## 12. File Output Safety
- PPTX generated server-side only; never deserialize user-uploaded PPTX.
- TTS audio served via signed URL; `Content-Disposition: attachment`.

## 13. Privacy & Compliance
- Privacy policy clarifying KIMI / ElevenLabs as sub-processors.
- GDPR DSAR endpoints (export + delete).
- Cookie banner for analytics in EU.

## 14. Incident Response
- Runbook in `docs/RUNBOOK.md` (key rotation, kill-switch flag to disable a module, queue drain).
- `FEATURE_KIMI_ENABLED` flag in PostHog for instant disable.
