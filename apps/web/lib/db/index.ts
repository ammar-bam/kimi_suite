import { getDb } from "@kimi/db";

export function drizzle() {
  return getDb();
}

export { getDb };
