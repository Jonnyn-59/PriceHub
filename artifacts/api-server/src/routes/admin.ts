import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  productsTable,
  salesTable,
  auditLogTable,
  consoleLogTable,
  codeFilesTable,
  serverNodesTable,
} from "@workspace/db";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  ALL_DEV_PERMISSIONS,
  hashPassword,
  requireAuth,
  requirePermission,
  requireRole,
  SUPPORT_PERMISSIONS,
} from "../lib/auth";
import { recordAudit, recordConsole } from "../lib/audit";

const router: IRouter = Router();

router.use(requireAuth, requireRole("developer", "support"));

function publicAdminUser(u: typeof usersTable.$inferSelect) {
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
    lastActiveAt: u.lastActiveAt.toISOString(),
  };
}

// Users
router.get("/admin/users", requirePermission("users:view"), async (_req, res) => {
  const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(rows.map(publicAdminUser));
});

router.patch("/admin/users/:id", async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const { displayName, email, role, banned, subscriptionTier } = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (displayName !== undefined) {
    if (!actor.permissions?.includes("users:edit")) return res.status(403).json({ error: "Нет прав users:edit" });
    patch.displayName = displayName;
  }
  if (email !== undefined) {
    if (!actor.permissions?.includes("users:edit")) return res.status(403).json({ error: "Нет прав users:edit" });
    patch.email = email;
  }
  if (role !== undefined) {
    if (!actor.permissions?.includes("users:edit")) return res.status(403).json({ error: "Нет прав users:edit" });
    patch.role = role;
  }
  if (subscriptionTier !== undefined) {
    if (!actor.permissions?.includes("users:edit")) return res.status(403).json({ error: "Нет прав users:edit" });
    patch.subscriptionTier = subscriptionTier;
  }
  if (banned !== undefined) {
    if (!actor.permissions?.includes("users:ban")) return res.status(403).json({ error: "Нет прав users:ban" });
    patch.banned = !!banned;
  }
  const [updated] = await db.update(usersTable).set(patch).where(eq(usersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Пользователь не найден" });
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.user.update",
    target: `user#${id}`,
    details: JSON.stringify(patch),
  });
  res.json(publicAdminUser(updated));
});

router.delete("/admin/users/:id", requirePermission("users:delete"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  if (id === actor.id) {
    res.status(400).json({ error: "Нельзя удалить себя" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.user.delete",
    target: `user#${id}`,
  });
  res.json({ ok: true });
});

// Products
router.get("/admin/products", requirePermission("products:view"), async (_req, res) => {
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  const withSeller = await Promise.all(
    rows.map(async (p) => {
      const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, p.sellerId));
      return {
        id: p.id,
        sellerId: p.sellerId,
        sellerHubId: seller?.hubId ?? null,
        sellerName: seller?.displayName ?? null,
        name: p.name,
        price: p.price,
        cost: p.cost,
        currency: p.currency,
        marketplace: p.marketplace,
        category: p.category,
        imageUrl: p.imageUrl,
        stock: p.stock,
        createdAt: p.createdAt.toISOString(),
      };
    }),
  );
  res.json(withSeller);
});

router.patch("/admin/products/:id", requirePermission("products:edit"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const { name, price, cost, marketplace, category, stock } = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (marketplace !== undefined) patch.marketplace = marketplace;
  if (category !== undefined) patch.category = category;
  if (price !== undefined) patch.price = Number(price);
  if (cost !== undefined) patch.cost = Number(cost);
  if (stock !== undefined) patch.stock = Number(stock);
  const [updated] = await db.update(productsTable).set(patch).where(eq(productsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Товар не найден" });
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.product.update",
    target: `product#${id}`,
  });
  res.json(updated);
});

router.delete("/admin/products/:id", requirePermission("products:delete"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.product.delete",
    target: `product#${id}`,
  });
  res.json({ ok: true });
});

// Developers
router.get("/admin/devs", requirePermission("users:view"), async (_req, res) => {
  const rows = await db.select().from(usersTable);
  res.json(rows.filter((u) => u.role === "developer" || u.role === "support").map(publicAdminUser));
});

router.post("/admin/devs", requirePermission("devs:create"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { hubId, password, displayName, email, role, permissions } = req.body ?? {};
  if (!hubId || !password || !displayName || !["developer", "support"].includes(role)) {
    res.status(400).json({ error: "Неверные параметры" });
    return;
  }
  const exists = await db.select().from(usersTable).where(eq(usersTable.hubId, hubId));
  if (exists.length) {
    res.status(409).json({ error: "Hub ID уже занят" });
    return;
  }
  const perms = Array.isArray(permissions)
    ? permissions.filter((p: string) => ALL_DEV_PERMISSIONS.includes(p as never))
    : role === "developer"
      ? ALL_DEV_PERMISSIONS
      : SUPPORT_PERMISSIONS;
  const [created] = await db
    .insert(usersTable)
    .values({
      hubId,
      passwordHash: await hashPassword(password),
      displayName,
      email: email ?? null,
      role,
      permissions: perms,
    })
    .returning();
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.dev.create",
    target: hubId,
    details: `role=${role}`,
  });
  res.json(publicAdminUser(created));
});

router.patch("/admin/devs/:id/permissions", requirePermission("devs:edit"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const { permissions } = req.body ?? {};
  if (!Array.isArray(permissions)) {
    res.status(400).json({ error: "permissions должен быть массивом" });
    return;
  }
  const perms = permissions.filter((p: string) => ALL_DEV_PERMISSIONS.includes(p as never));
  const [updated] = await db
    .update(usersTable)
    .set({ permissions: perms })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Не найдено" });
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.dev.permissions.update",
    target: updated.hubId,
    details: perms.join(","),
  });
  res.json(publicAdminUser(updated));
});

// Console
router.get("/admin/console", requirePermission("console:view"), async (_req, res) => {
  const rows = await db
    .select()
    .from(consoleLogTable)
    .orderBy(desc(consoleLogTable.createdAt))
    .limit(120);
  res.json(
    rows.reverse().map((r) => ({
      id: r.id,
      level: r.level,
      source: r.source,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// Audit
router.get("/admin/audit", requirePermission("audit:view"), async (_req, res) => {
  const rows = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(200);
  res.json(
    rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorName: r.actorName,
      actorRole: r.actorRole,
      action: r.action,
      target: r.target,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// Servers
router.get("/admin/server/nodes", requirePermission("server:view"), async (_req, res) => {
  const rows = await db.select().from(serverNodesTable);
  // Jitter cpu/memory live
  const enriched = rows.map((n) => ({
    id: n.id,
    name: n.name,
    region: n.region,
    status: n.status,
    cpu: Math.max(2, Math.min(98, n.cpu + (Math.random() * 14 - 7))),
    memory: Math.max(5, Math.min(98, n.memory + (Math.random() * 10 - 5))),
    uptimeHours: n.uptimeHours,
  }));
  res.json(enriched);
});

router.post("/admin/server/restart", requirePermission("server:restart"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { nodeId } = req.body ?? {};
  if (!nodeId) return res.status(400).json({ error: "nodeId обязателен" });
  await db.update(serverNodesTable).set({ status: "restarting", uptimeHours: 0 }).where(eq(serverNodesTable.id, String(nodeId)));
  setTimeout(async () => {
    try {
      await db.update(serverNodesTable).set({ status: "healthy" }).where(eq(serverNodesTable.id, String(nodeId)));
      await recordConsole({ level: "info", source: "ops", message: `Node ${nodeId} восстановлен после перезапуска` });
    } catch {}
  }, 3000);
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.server.restart",
    target: String(nodeId),
  });
  await recordConsole({ level: "warn", source: "ops", message: `Перезапуск ноды ${nodeId} инициирован ${actor.hubId}` });
  res.json({ ok: true });
});

// Code files
router.get("/admin/code", requirePermission("code:view"), async (_req, res) => {
  const rows = await db.select().from(codeFilesTable);
  res.json(
    rows.map((f) => ({
      path: f.path,
      language: f.language,
      content: f.content,
      updatedAt: f.updatedAt.toISOString(),
    })),
  );
});

router.patch("/admin/code", requirePermission("code:edit"), async (req, res) => {
  const actor = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { path, content, language } = req.body ?? {};
  if (!path || content == null) {
    res.status(400).json({ error: "path и content обязательны" });
    return;
  }
  await db
    .insert(codeFilesTable)
    .values({ path, content, language: language ?? "txt" })
    .onConflictDoUpdate({
      target: codeFilesTable.path,
      set: { content, language: language ?? "txt", updatedAt: new Date() },
    });
  await recordAudit({
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "admin.code.update",
    target: path,
  });
  await recordConsole({ level: "info", source: "code", message: `${actor.hubId} сохранил ${path}` });
  res.json({ ok: true });
});

// Seller history
router.get("/admin/seller-history/:id", requirePermission("history:view"), async (req, res) => {
  const id = Number(req.params.id);
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!seller) return res.status(404).json({ error: "Продавец не найден" });
  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, id));
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sales = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.sellerId, id), gte(salesTable.soldAt, since)));
  const audits = await db
    .select()
    .from(auditLogTable)
    .where(eq(auditLogTable.actorId, id))
    .orderBy(desc(auditLogTable.createdAt))
    .limit(20);

  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of sales) {
    const k = s.soldAt.toISOString().slice(0, 10);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + s.revenue);
  }
  res.json({
    seller: {
      id: seller.id,
      hubId: seller.hubId,
      displayName: seller.displayName,
      email: seller.email,
      avatarUrl: seller.avatarUrl,
      role: seller.role,
      banned: seller.banned,
      subscriptionTier: seller.subscriptionTier,
      createdAt: seller.createdAt.toISOString(),
    },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      marketplace: p.marketplace,
    })),
    actions: audits.map((a) => ({
      id: a.id,
      action: a.action,
      target: a.target,
      details: a.details,
      createdAt: a.createdAt.toISOString(),
    })),
    salesSeries: Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue })),
    totals: {
      revenue30d: sales.reduce((s, r) => s + r.revenue, 0),
      profit30d: sales.reduce((s, r) => s + r.profit, 0),
      orders30d: sales.length,
      products: products.length,
    },
  });
});

export default router;
