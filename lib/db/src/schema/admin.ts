import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consoleLogTable = pgTable("console_log", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  source: text("source").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codeFilesTable = pgTable("code_files", {
  path: text("path").primaryKey(),
  language: text("language").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const serverNodesTable = pgTable("server_nodes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("healthy"),
  cpu: doublePrecision("cpu").notNull().default(20),
  memory: doublePrecision("memory").notNull().default(40),
  uptimeHours: doublePrecision("uptime_hours").notNull().default(0),
});

export const subscriptionsTable = pgTable("subscriptions", {
  userId: integer("user_id").primaryKey(),
  planId: text("plan_id").notNull().default("free"),
  status: text("status").notNull().default("active"),
  renewsAt: timestamp("renews_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditEntry = typeof auditLogTable.$inferSelect;
export type ConsoleEntry = typeof consoleLogTable.$inferSelect;
export type CodeFile = typeof codeFilesTable.$inferSelect;
export type ServerNode = typeof serverNodesTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
