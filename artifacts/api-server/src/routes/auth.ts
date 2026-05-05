import { Router, type IRouter } from "express";
import { db, usersTable, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, requireAuth } from "../lib/auth";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

function publicUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    hubId: u.hubId,
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    company: u.company,
    banned: u.banned,
    subscriptionTier: u.subscriptionTier,
    permissions: u.permissions ?? [],
    createdAt: u.createdAt.toISOString(),
  };
}

function normalizeHubId(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDisplayName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

function validatePassword(value: unknown): string | null {
  if (typeof value !== "string") return "Пароль обязателен";
  if (value.length < 8) return "Пароль должен содержать минимум 8 символов";
  if (value.length > 128) return "Пароль слишком длинный";
  return null;
}

function validateHubId(value: string): string | null {
  if (!value) return "Hub ID обязателен";
  if (!/^[a-z0-9._-]{3,32}$/.test(value)) {
    return "Hub ID должен быть 3-32 символа и содержать только a-z, 0-9, ., _, -";
  }
  return null;
}

router.post("/auth/register", async (req, res) => {
  const { password, role } = req.body ?? {};
  const hubId = normalizeHubId(req.body?.hubId);
  const displayName = normalizeDisplayName(req.body?.displayName);
  const email = normalizeEmail(req.body?.email);

  const hubIdError = validateHubId(hubId);
  if (hubIdError) {
    res.status(400).json({ error: hubIdError });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  if (!displayName) {
    res.status(400).json({ error: "Заполните все обязательные поля" });
    return;
  }
  if (!["buyer", "seller"].includes(role)) {
    res.status(400).json({ error: "Неверная роль" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.hubId, hubId));
  if (existing.length) {
    res.status(409).json({ error: "Hub ID уже занят" });
    return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({
      hubId,
      passwordHash: await hashPassword(password as string),
      displayName,
      email,
      role,
      permissions: [],
    })
    .returning();
  await db.insert(preferencesTable).values({ userId: user.id }).onConflictDoNothing();
  req.session.userId = user.id;
  await recordAudit({
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action: "user.register",
    target: hubId,
  });
  res.json({ user: publicUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const hubId = normalizeHubId(req.body?.hubId);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!hubId || !password) {
    res.status(400).json({ error: "Введите Hub ID и пароль" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.hubId, hubId));
  if (!user) {
    res.status(401).json({ error: "Неверный Hub ID или пароль" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "Аккаунт заблокирован" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Неверный Hub ID или пароль" });
    return;
  }
  req.session.userId = user.id;
  await db.update(usersTable).set({ lastActiveAt: new Date() }).where(eq(usersTable.id, user.id));
  res.json({ user: publicUser(user) });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("pricehub.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  res.json({ user: publicUser(user) });
});

router.post("/auth/change-password", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const currentPassword =
    typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const nextPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword || !nextPassword) {
    res.status(400).json({ error: "Нужно передать текущий и новый пароль" });
    return;
  }

  const nextPasswordError = validatePassword(nextPassword);
  if (nextPasswordError) {
    res.status(400).json({ error: nextPasswordError });
    return;
  }

  const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(401).json({ error: "Текущий пароль неверный" });
    return;
  }

  const isSamePassword = await verifyPassword(nextPassword, user.passwordHash);
  if (isSamePassword) {
    res.status(400).json({ error: "Новый пароль должен отличаться от текущего" });
    return;
  }

  await db
    .update(usersTable)
    .set({
      passwordHash: await hashPassword(nextPassword),
      lastActiveAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  await recordAudit({
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action: "user.change_password",
    target: user.hubId,
  });

  res.json({ ok: true });
});

export default router;
