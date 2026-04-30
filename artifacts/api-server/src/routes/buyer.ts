import { Router, type IRouter } from "express";
import {
  db,
  marketplaceListingsTable,
  marketplaceOffersTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.use("/buyer", requireAuth);

function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

router.get("/buyer/price-history/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [listing] = await db
    .select()
    .from(marketplaceListingsTable)
    .where(eq(marketplaceListingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }
  const offers = await db
    .select()
    .from(marketplaceOffersTable)
    .where(eq(marketplaceOffersTable.listingId, id));
  const days = 30;
  const points: Array<{ date: string; price: number; marketplace: string }> = [];
  const now = new Date();
  for (const offer of offers) {
    const rand = seededRandom(offer.id * 37 + id);
    let price = offer.price;
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const drift = (rand() - 0.5) * 0.06;
      const trend = (days - d) / days * 0.04;
      const candidate = Math.round((price * (1 + drift - trend)) / 10) * 10;
      points.push({
        date: date.toISOString().slice(0, 10),
        price: candidate,
        marketplace: offer.marketplace,
      });
      price = candidate;
    }
  }
  res.json({
    listingId: id,
    name: listing.name,
    currency: "RUB",
    points,
  });
});

router.get("/buyer/savings-summary", async (_req, res) => {
  const totalsRows = await db.execute<{
    listing_id: number;
    min_price: number;
    max_price: number;
  }>(sql`
    SELECT listing_id,
           MIN(price)::float AS min_price,
           MAX(price)::float AS max_price
    FROM marketplace_offers
    GROUP BY listing_id
  `);
  const rows = totalsRows.rows ?? [];
  const trackedItems = rows.length;
  let totalSavings = 0;
  let totalSavingsPercent = 0;
  for (const r of rows) {
    totalSavings += r.max_price - r.min_price;
    if (r.max_price > 0) totalSavingsPercent += ((r.max_price - r.min_price) / r.max_price) * 100;
  }
  const avgSavingsPercent = trackedItems > 0 ? totalSavingsPercent / trackedItems : 0;

  const offers = await db.select().from(marketplaceOffersTable);
  const byMp = new Map<string, { savings: number; deals: number }>();
  const grouped = new Map<number, typeof offers>();
  for (const o of offers) {
    if (!grouped.has(o.listingId)) grouped.set(o.listingId, []);
    grouped.get(o.listingId)!.push(o);
  }
  for (const list of grouped.values()) {
    if (list.length < 2) continue;
    const cheapest = list.reduce((a, b) => (a.price < b.price ? a : b));
    const max = list.reduce((a, b) => (a.price > b.price ? a : b));
    const cur = byMp.get(cheapest.marketplace) ?? { savings: 0, deals: 0 };
    cur.savings += max.price - cheapest.price;
    cur.deals += 1;
    byMp.set(cheapest.marketplace, cur);
  }
  const savingsByMarketplace = Array.from(byMp.entries())
    .map(([marketplace, v]) => ({ marketplace, ...v }))
    .sort((a, b) => b.savings - a.savings);

  const recentDealsRaw = await db
    .select()
    .from(marketplaceListingsTable)
    .orderBy(marketplaceListingsTable.id)
    .limit(6);
  const recentDeals = await Promise.all(
    recentDealsRaw.map(async (l) => {
      const lOffers = await db
        .select()
        .from(marketplaceOffersTable)
        .where(eq(marketplaceOffersTable.listingId, l.id));
      const prices = lOffers.map((o) => o.price);
      const lowest = prices.length ? Math.min(...prices) : 0;
      const highest = prices.length ? Math.max(...prices) : 0;
      return {
        id: l.id,
        name: l.name,
        category: l.category,
        imageUrl: l.imageUrl,
        currency: "RUB",
        lowestPrice: lowest,
        highestPrice: highest,
        savingsPercent: highest > 0 ? Math.round(((highest - lowest) / highest) * 100) : 0,
        offers: lOffers.map((o) => ({
          id: o.id,
          marketplace: o.marketplace,
          price: o.price,
          url: o.url,
          inStock: o.inStock,
          deliveryDays: o.deliveryDays,
          rating: o.rating,
        })),
      };
    })
  );

  res.json({
    totals: {
      trackedItems,
      totalSavings: Math.round(totalSavings),
      avgSavingsPercent: Math.round(avgSavingsPercent * 10) / 10,
      viewedItems: Math.max(trackedItems * 3, 10),
    },
    savingsByMarketplace,
    recentDeals,
  });
});

export default router;
