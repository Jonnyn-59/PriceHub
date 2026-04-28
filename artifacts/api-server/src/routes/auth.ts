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

router.post("/auth/register", async (req, res) => {
  const { hubId, password, displayName, role, email } = req.body ?? {};
  if (!hubId || !password || !displayName) {
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
      passwordHash: await hashPassword(password),
      displayName,
      email: email ?? null,
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
  const { hubId, password } = req.body ?? {};
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

export default router;
