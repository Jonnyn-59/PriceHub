import { Router, type IRouter } from "express";
import { db, productsTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

function serialize(p: typeof productsTable.$inferSelect) {
  const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
  return {
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    description: p.description,
    price: p.price,
    cost: p.cost,
    currency: p.currency,
    marketplace: p.marketplace,
    category: p.category,
    imageUrl: p.imageUrl,
    externalUrl: p.externalUrl,
    stock: p.stock,
    marginPercent: Math.round(margin * 10) / 10,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/products", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const rows = await db.select().from(productsTable).where(eq(productsTable.sellerId, user.id));
  res.json(rows.map(serialize));
});

router.post("/products", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { name, description, price, cost, marketplace, category, imageUrl, externalUrl, stock, currency } = req.body ?? {};
  if (!name || price == null || cost == null || !marketplace) {
    res.status(400).json({ error: "Заполните обязательные поля" });
    return;
  }
  const [row] = await db
    .insert(productsTable)
    .values({
      sellerId: user.id,
      name,
      description: description ?? null,
      price: Number(price),
      cost: Number(cost),
      currency: currency ?? "RUB",
      marketplace,
      category: category ?? null,
      imageUrl: imageUrl ?? null,
      externalUrl: externalUrl ?? null,
      stock: Number(stock ?? 0),
    })
    .returning();
  await recordAudit({
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action: "product.create",
    target: `product#${row.id}`,
    details: name,
  });
  res.json(serialize(row));
});

router.get("/products/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }
  res.json(serialize(row));
});

router.patch("/products/:id", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }
  if (existing.sellerId !== user.id && user.role !== "developer" && user.role !== "support") {
    res.status(403).json({ error: "Нет прав" });
    return;
  }
  const body = req.body ?? {};
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "description", "marketplace", "category", "imageUrl", "externalUrl", "currency"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  for (const k of ["price", "cost", "stock"]) {
    if (body[k] !== undefined) patch[k] = Number(body[k]);
  }
  const [updated] = await db.update(productsTable).set(patch).where(eq(productsTable.id, id)).returning();
  await recordAudit({
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action: "product.update",
    target: `product#${id}`,
  });
  res.json(serialize(updated));
});

router.delete("/products/:id", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }
  if (existing.sellerId !== user.id && user.role !== "developer" && user.role !== "support") {
    res.status(403).json({ error: "Нет прав" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  await recordAudit({
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action: "product.delete",
    target: `product#${id}`,
  });
  res.json({ ok: true });
});

export default router;
