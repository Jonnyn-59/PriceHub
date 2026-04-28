import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export const PERMISSION_SCOPES = [
  "users:view",
  "users:edit",
  "users:ban",
  "users:delete",
  "products:view",
  "products:edit",
  "products:delete",
  "devs:create",
  "devs:edit",
  "server:view",
  "server:restart",
  "code:view",
  "code:edit",
  "console:view",
  "audit:view",
  "history:view",
] as const;

export const ALL_DEV_PERMISSIONS = [...PERMISSION_SCOPES];
export const SUPPORT_PERMISSIONS = [
  "users:view",
  "products:view",
  "audit:view",
  "history:view",
  "console:view",
];

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  const user = await getUserById(req.session.userId);
  if (!user) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "Аккаунт заблокирован" });
    return;
  }
  (req as Request & { user: typeof user }).user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { role: string } }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Доступ запрещён" });
      return;
    }
    next();
  };
}

export function requirePermission(scope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { role: string; permissions: string[] } }).user;
    if (!user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }
    if (user.role !== "developer" && user.role !== "support") {
      res.status(403).json({ error: "Доступ запрещён" });
      return;
    }
    if (!user.permissions?.includes(scope)) {
      res.status(403).json({ error: `Недостаточно прав: ${scope}` });
      return;
    }
    next();
  };
}

export type AuthedRequest = Request & {
  user: Awaited<ReturnType<typeof getUserById>>;
};
