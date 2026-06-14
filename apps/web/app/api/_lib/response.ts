import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  code: "UNAUTHORIZED" | "FORBIDDEN" | "RATE_LIMITED" | "QUOTA_EXCEEDED" | "BAD_INPUT" | "UPSTREAM" | "INTERNAL",
  message: string,
  init?: ResponseInit & { retryAfter?: number }
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        retryAfter: init?.retryAfter
      }
    },
    init
  );
}
