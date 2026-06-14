import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "pro", "team"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system", "tool"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  plan: planEnum("plan").default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title"),
  model: text("model"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  convId: uuid("conv_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
