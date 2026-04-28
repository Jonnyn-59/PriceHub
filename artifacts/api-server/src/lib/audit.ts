import { db, auditLogTable, consoleLogTable } from "@workspace/db";

export async function recordAudit(params: {
  actorId: number;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  details?: string;
}) {
  await db.insert(auditLogTable).values({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    target: params.target,
    details: params.details ?? null,
  });
}

export async function recordConsole(params: {
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
}) {
  await db.insert(consoleLogTable).values({
    level: params.level,
    source: params.source,
    message: params.message,
  });
}
