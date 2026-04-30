import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { hashPassword, requireAuth } from "../lib/auth";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.use("/seller", requireAuth);

function publicStaff(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    hubId: u.hubId,
    displayName: u.displayName,
    email: u.email,
    jobTitle: u.jobTitle,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt.toISOString(),
  };
}

router.get("/seller/staff", async (req, res) => {
  const me = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (me.role !== "seller" && me.role !== "developer") {
    res.status(403).json({ error: "Только продавцы могут управлять сотрудниками" });
    return;
  }
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.managerId, me.id))
    .orderBy(desc(usersTable.createdAt));
  res.json(rows.map(publicStaff));
});

router.post("/seller/staff", async (req, res) => {
  const me = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (me.role !== "seller" && me.role !== "developer") {
    res.status(403).json({ error: "Только продавцы могут создавать сотрудников" });
    return;
  }
  const { hubId, password, displayName, email, jobTitle } = req.body ?? {};
  if (!hubId || !password || !displayName || !jobTitle) {
    res.status(400).json({ error: "Заполните Hub ID, пароль, имя и должность" });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: "Пароль должен быть минимум 6 символов" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.hubId, hubId));
  if (existing) {
    res.status(409).json({ error: "Hub ID уже занят" });
    return;
  }
  const [staff] = await db
    .insert(usersTable)
    .values({
      hubId,
      passwordHash: await hashPassword(password),
      displayName,
      email: email ?? null,
      role: "seller",
      jobTitle,
      managerId: me.id,
      company: me.company,
      subscriptionTier: me.subscriptionTier,
    })
    .returning();
  await recordAudit({
    actorId: me.id,
    actorName: me.displayName,
    actorRole: me.role,
    action: "seller.staff.create",
    target: hubId,
  });
  res.json(publicStaff(staff));
});

router.delete("/seller/staff/:id", async (req, res) => {
  const me = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const [staff] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!staff || staff.managerId !== me.id) {
    res.status(404).json({ error: "Сотрудник не найден" });
    return;
  }
  await db.delete(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.managerId, me.id)));
  await recordAudit({
    actorId: me.id,
    actorName: me.displayName,
    actorRole: me.role,
    action: "seller.staff.delete",
    target: staff.hubId,
  });
  res.json({ ok: true });
});

export default router;
