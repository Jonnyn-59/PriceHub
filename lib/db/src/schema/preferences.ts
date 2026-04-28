import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core";

export const preferencesTable = pgTable("preferences", {
  userId: integer("user_id").primaryKey(),
  theme: text("theme").notNull().default("dark"),
  accent: text("accent").notNull().default("violet"),
  density: text("density").notNull().default("comfortable"),
  language: text("language").notNull().default("ru"),
  notifications: boolean("notifications").notNull().default(true),
});

export type Preferences = typeof preferencesTable.$inferSelect;
