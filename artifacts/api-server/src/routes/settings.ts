import { Router, type IRouter } from "express";
import { db, usersTable, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/settings/profile", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  res.json({
    hubId: u.hubId,
    displayName: u.displayName,
    email: u.email,
    bio: u.bio,
    company: u.company,
    avatarUrl: u.avatarUrl,
    role: u.role,
    subscriptionTier: u.subscriptionTier,
  });
});

router.patch("/settings/profile", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { displayName, email, bio, company, avatarUrl } = req.body ?? {};
  const patch: Record<string, string | null> = {};
  if (displayName !== undefined) patch.displayName = displayName;
  if (email !== undefined) patch.email = email ?? null;
  if (bio !== undefined) patch.bio = bio ?? null;
  if (company !== undefined) patch.company = company ?? null;
  if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl ?? null;
  const [updated] = await db.update(usersTable).set(patch).where(eq(usersTable.id, u.id)).returning();
  res.json({
    hubId: updated.hubId,
    displayName: updated.displayName,
    email: updated.email,
    bio: updated.bio,
    company: updated.company,
    avatarUrl: updated.avatarUrl,
    role: updated.role,
    subscriptionTier: updated.subscriptionTier,
  });
});

router.get("/settings/preferences", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  let [pref] = await db.select().from(preferencesTable).where(eq(preferencesTable.userId, u.id));
  if (!pref) {
    [pref] = await db.insert(preferencesTable).values({ userId: u.id }).returning();
  }
  res.json(pref);
});

router.patch("/settings/preferences", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { theme, accent, density, language, notifications } = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (theme !== undefined) patch.theme = theme;
  if (accent !== undefined) patch.accent = accent;
  if (density !== undefined) patch.density = density;
  if (language !== undefined) patch.language = language;
  if (notifications !== undefined) patch.notifications = !!notifications;
  await db.insert(preferencesTable).values({ userId: u.id, ...patch }).onConflictDoUpdate({
    target: preferencesTable.userId,
    set: patch,
  });
  const [pref] = await db.select().from(preferencesTable).where(eq(preferencesTable.userId, u.id));
  res.json(pref);
});

export default router;
