import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __kimiPg: PostgresClient | undefined;
  // eslint-disable-next-line no-var
  var __kimiDb: DrizzleClient | undefined;
}

function resolveConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.length === 0) {
    throw new Error(
      "DATABASE_URL is not set. Start Postgres with `pnpm db:up` and copy .env.example to .env."
    );
  }
  return url;
}

function createClient(): DrizzleClient {
  const connectionString = resolveConnectionString();
  // Single pooled client per Node process (works in dev + serverless warm starts).
  const client =
    globalThis.__kimiPg ??
    postgres(connectionString, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idle_timeout: 20,
      prepare: false
    });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__kimiPg = client;
  }
  return drizzle(client, { schema });
}

export function getDb(): DrizzleClient {
  if (!globalThis.__kimiDb) {
    globalThis.__kimiDb = createClient();
  }
  return globalThis.__kimiDb;
}

export { schema };
export * from "./schema";
