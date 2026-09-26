import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "@/packages/db/src/schema";

// Initialize drizzle with vercel postgres
export const drizzle = drizzle(sql, { schema });