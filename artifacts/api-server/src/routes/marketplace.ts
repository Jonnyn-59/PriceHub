import { Router, type IRouter } from "express";
import { db, marketplaceListingsTable, marketplaceOffersTable } from "@workspace/db";
import { eq, ilike, or, asc } from "drizzle-orm";

const router: IRouter = Router();

async function withOffers(listing: typeof marketplaceListingsTable.$inferSelect) {
  const offers = await db
    .select()
    .from(marketplaceOffersTable)
    .where(eq(marketplaceOffersTable.listingId, listing.id))
    .orderBy(asc(marketplaceOffersTable.price));
  const prices = offers.map((o) => o.price);
  const lowest = prices.length ? Math.min(...prices) : 0;
  const highest = prices.length ? Math.max(...prices) : 0;
  const savings = highest > 0 ? Math.round(((highest - lowest) / highest) * 100) : 0;
  return {
    id: listing.id,
    name: listing.name,
    brand: listing.brand,
    description: listing.description,
    category: listing.category,
    imageUrl: listing.imageUrl,
    currency: listing.currency,
    lowestPrice: lowest,
    highestPrice: highest,
    savingsPercent: savings,
    offers: offers.map((o) => ({
      id: o.id,
      marketplace: o.marketplace,
      price: o.price,
      url: o.url,
      inStock: o.inStock,
      deliveryDays: o.deliveryDays,
      rating: o.rating,
    })),
  };
}

router.get("/marketplace/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  let listings: (typeof marketplaceListingsTable.$inferSelect)[];
  if (!q) {
    listings = await db.select().from(marketplaceListingsTable).limit(40);
  } else {
    const pattern = `%${q}%`;
    listings = await db
      .select()
      .from(marketplaceListingsTable)
      .where(
        or(
          ilike(marketplaceListingsTable.name, pattern),
          ilike(marketplaceListingsTable.brand, pattern),
          ilike(marketplaceListingsTable.category, pattern),
        ),
      )
      .limit(40);
  }
  const enriched = await Promise.all(listings.map(withOffers));
  res.json(enriched);
});

router.get("/marketplace/featured", async (_req, res) => {
  const listings = await db.select().from(marketplaceListingsTable).limit(12);
  const enriched = await Promise.all(listings.map(withOffers));
  enriched.sort((a, b) => b.savingsPercent - a.savingsPercent);
  res.json(enriched.slice(0, 8));
});

router.get("/marketplace/listings/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [listing] = await db.select().from(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }
  res.json(await withOffers(listing));
});

export default router;
